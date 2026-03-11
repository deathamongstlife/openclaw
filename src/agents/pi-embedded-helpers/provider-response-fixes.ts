/**
 * Provider-specific response handling and error recovery.
 *
 * This module contains fixes for known provider API issues:
 * - OpenAI o1/o3 models with missing usage fields
 * - Gemini empty responses with STOP finish reason
 * - Gemini invalid JSON in tool calls
 * - Non-JSON error responses (429 rate limits, etc.)
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { normalizeUsage, type UsageLike } from "../usage.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("provider-fixes");

/**
 * OpenAI o1/o3 models can return responses with undefined usage field.
 * Issue #43327
 *
 * @param response - Raw API response
 * @returns Normalized response with safe usage field
 */
export function normalizeOpenAIUsageField(response: unknown): unknown {
  if (!response || typeof response !== "object") {
    return response;
  }

  const responseObj = response as Record<string, unknown>;

  // If usage is explicitly undefined or null, set it to empty object
  if (responseObj.usage === undefined || responseObj.usage === null) {
    return {
      ...responseObj,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  return response;
}

/**
 * Gemini Exp models can return finishReason=STOP with empty text content.
 * Issue #43181
 *
 * @param response - Gemini API response
 * @returns Response with validated content
 */
export function normalizeGeminiEmptyResponse(response: unknown): unknown {
  if (!response || typeof response !== "object") {
    return response;
  }

  const responseObj = response as Record<string, unknown>;
  const candidates = responseObj.candidates;

  if (!Array.isArray(candidates)) {
    return response;
  }

  let modified = false;
  const normalizedCandidates = candidates.map((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return candidate;
    }

    const candidateObj = candidate as Record<string, unknown>;
    const content = candidateObj.content;
    const finishReason = candidateObj.finishReason;

    // Check for STOP with empty/missing content
    if (finishReason === "STOP" && (!content || (typeof content === "object" && !hasContent(content)))) {
      modified = true;
      log.warn("Gemini returned STOP with empty content, adding placeholder");
      return {
        ...candidateObj,
        content: {
          parts: [{ text: "" }],
          role: "model",
        },
      };
    }

    return candidate;
  });

  return modified ? { ...responseObj, candidates: normalizedCandidates } : response;
}

function hasContent(content: unknown): boolean {
  if (!content || typeof content !== "object") {
    return false;
  }

  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return false;
  }

  return parts.some((part) => {
    if (!part || typeof part !== "object") {
      return false;
    }
    const text = (part as { text?: unknown }).text;
    const functionCall = (part as { functionCall?: unknown }).functionCall;
    return (typeof text === "string" && text.length > 0) || functionCall !== undefined;
  });
}

/**
 * Sanitize Gemini tool call JSON to handle malformed responses.
 * Issue #43140
 *
 * @param toolCall - Raw tool call object
 * @returns Sanitized tool call with valid JSON
 */
export function sanitizeGeminiToolCallJSON(toolCall: unknown): unknown {
  if (!toolCall || typeof toolCall !== "object") {
    return toolCall;
  }

  const toolCallObj = toolCall as Record<string, unknown>;
  const functionCall = toolCallObj.functionCall;

  if (!functionCall || typeof functionCall !== "object") {
    return toolCall;
  }

  const functionCallObj = functionCall as Record<string, unknown>;
  const args = functionCallObj.args;

  // Try to parse and re-stringify args to ensure valid JSON
  if (args && typeof args === "object") {
    try {
      // If args is already an object, stringify and parse to validate
      const jsonString = JSON.stringify(args);
      const parsed = JSON.parse(jsonString);

      return {
        ...toolCallObj,
        functionCall: {
          ...functionCallObj,
          args: parsed,
        },
      };
    } catch (error) {
      log.error(`Failed to sanitize Gemini tool call JSON: ${error}`);
      // Return with empty args rather than failing
      return {
        ...toolCallObj,
        functionCall: {
          ...functionCallObj,
          args: {},
        },
      };
    }
  }

  return toolCall;
}

/**
 * Detect and handle non-JSON error responses (e.g., HTML error pages on 429).
 * Issue #43262
 *
 * @param text - Response body text
 * @returns Parsed JSON or error object
 */
export function parseProviderResponse(text: string): unknown {
  if (!text || typeof text !== "string") {
    return { error: { message: "Empty response from provider", type: "empty_response" } };
  }

  const trimmed = text.trim();

  // Check if response looks like HTML (common for 429 rate limit pages)
  if (trimmed.startsWith("<") || trimmed.toLowerCase().includes("<!doctype html")) {
    log.warn("Provider returned HTML instead of JSON, likely rate limit or error page");
    return {
      error: {
        message: "Provider returned non-JSON response. This usually indicates rate limiting or service errors.",
        type: "invalid_response_error",
        code: "non_json_response",
      },
    };
  }

  // Check for other non-JSON responses
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    log.warn(`Provider returned non-JSON response: ${trimmed.substring(0, 100)}`);
    return {
      error: {
        message: "Provider returned invalid response format",
        type: "invalid_response_error",
        code: "malformed_response",
        raw: trimmed.substring(0, 200),
      },
    };
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    log.error(`Failed to parse provider JSON response: ${error}`);
    return {
      error: {
        message: "Failed to parse provider response as JSON",
        type: "parse_error",
        raw: trimmed.substring(0, 200),
      },
    };
  }
}

/**
 * Normalize o1-preview model handling to preserve text when images are present.
 * Issue #43092
 *
 * @param messages - Agent messages
 * @returns Messages with preserved text content
 */
export function preserveO1TextWithImages(messages: AgentMessage[]): AgentMessage[] {
  let modified = false;
  const normalized: AgentMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      normalized.push(msg);
      continue;
    }

    const role = (msg as { role?: unknown }).role;
    if (role !== "user") {
      normalized.push(msg);
      continue;
    }

    const content = (msg as { content?: unknown }).content;

    // Check if this is a multi-part message with both text and images
    if (Array.isArray(content)) {
      const hasImage = content.some(
        (part) =>
          part &&
          typeof part === "object" &&
          (part as { type?: unknown }).type === "image",
      );
      const hasText = content.some(
        (part) =>
          part &&
          typeof part === "object" &&
          (part as { type?: unknown }).type === "text",
      );

      // o1-preview can drop text content when images are present
      // Ensure text is preserved
      if (hasImage && !hasText) {
        log.warn("o1-preview: Found image without text, adding placeholder");
        modified = true;
        normalized.push({
          ...(msg as unknown as Record<string, unknown>),
          content: [
            { type: "text", text: "Please analyze the provided image." },
            ...content,
          ],
        } as AgentMessage);
        continue;
      }
    }

    normalized.push(msg);
  }

  return modified ? normalized : messages;
}

/**
 * Apply reasoning_effort parameter for o3 models.
 * Issue #43061
 *
 * @param params - Request parameters
 * @param modelId - Model ID
 * @returns Parameters with reasoning_effort if applicable
 */
export function applyO3ReasoningEffort(
  params: Record<string, unknown>,
  modelId: string,
): Record<string, unknown> {
  // o3 models support reasoning_effort parameter (low, medium, high)
  if (!modelId.toLowerCase().includes("o3")) {
    return params;
  }

  // Only apply if not already set
  if (params.reasoning_effort !== undefined) {
    return params;
  }

  // Check if extraParams has reasoning_effort
  const extraParams = params.extraParams as Record<string, unknown> | undefined;
  const reasoningEffort = extraParams?.reasoning_effort ?? extraParams?.reasoningEffort;

  if (reasoningEffort === undefined) {
    return params;
  }

  // Validate and apply reasoning_effort
  const validLevels = ["low", "medium", "high"];
  const effort = String(reasoningEffort).toLowerCase();

  if (validLevels.includes(effort)) {
    return {
      ...params,
      reasoning_effort: effort,
    };
  }

  log.warn(`Invalid reasoning_effort value: ${reasoningEffort}, expected one of: ${validLevels.join(", ")}`);
  return params;
}
