/**
 * Provider fixes integration layer.
 *
 * This module integrates provider-specific fixes into the agent runner pipeline.
 * It should be imported and used by pi-embedded-runner to apply fixes transparently.
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";
import {
  normalizeOpenAIUsageField,
  normalizeGeminiEmptyResponse,
  sanitizeGeminiToolCallJSON,
  parseProviderResponse,
  preserveO1TextWithImages,
  applyO3ReasoningEffort,
} from "./provider-response-fixes.js";
import {
  classifyProviderError,
  enhanceKimiProviderErrors,
  enhanceXAIProviderErrors,
  enhanceVertexAIErrors,
  shouldFallbackOnError,
  isRetryableError,
  logProviderError,
  type EnhancedProviderError,
} from "./provider-error-handling.js";
import {
  ALL_NEW_MODELS,
  isRecognizedNewModel,
  isReasoningModel,
  type NewModelDefinition,
} from "../model-schema-updates.js";

/**
 * Apply provider-specific request preprocessing
 */
export function preprocessProviderRequest(params: {
  provider: string;
  modelId: string;
  messages: AgentMessage[];
  requestParams: Record<string, unknown>;
}): {
  messages: AgentMessage[];
  requestParams: Record<string, unknown>;
} {
  const { provider, modelId, messages, requestParams } = params;
  const normalizedProvider = provider.toLowerCase();

  let processedMessages = messages;
  let processedParams = requestParams;

  // OpenAI o1-preview: preserve text with images
  if (normalizedProvider === "openai" && modelId.toLowerCase().includes("o1-preview")) {
    processedMessages = preserveO1TextWithImages(processedMessages);
  }

  // OpenAI o3: apply reasoning_effort
  if (normalizedProvider === "openai" && modelId.toLowerCase().includes("o3")) {
    processedParams = applyO3ReasoningEffort(processedParams, modelId);
  }

  return {
    messages: processedMessages,
    requestParams: processedParams,
  };
}

/**
 * Apply provider-specific response postprocessing
 */
export function postprocessProviderResponse(params: {
  provider: string;
  modelId: string;
  response: unknown;
}): unknown {
  const { provider, modelId, response } = params;
  const normalizedProvider = provider.toLowerCase();

  let processedResponse = response;

  // OpenAI: normalize usage field for o1/o3 models
  if (normalizedProvider === "openai" && (modelId.includes("o1") || modelId.includes("o3"))) {
    processedResponse = normalizeOpenAIUsageField(processedResponse);
  }

  // Gemini: handle empty responses
  if (normalizedProvider === "google" || normalizedProvider === "gemini") {
    processedResponse = normalizeGeminiEmptyResponse(processedResponse);
  }

  // Gemini: sanitize tool call JSON
  if (normalizedProvider === "google" || normalizedProvider === "gemini") {
    if (processedResponse && typeof processedResponse === "object") {
      const candidates = (processedResponse as { candidates?: unknown[] }).candidates;
      if (Array.isArray(candidates)) {
        const sanitized = candidates.map((candidate) => sanitizeGeminiToolCallJSON(candidate));
        processedResponse = { ...processedResponse, candidates: sanitized };
      }
    }
  }

  return processedResponse;
}

/**
 * Parse provider response text with error handling
 */
export function parseProviderResponseText(text: string): unknown {
  return parseProviderResponse(text);
}

/**
 * Handle provider errors with enhanced classification
 */
export function handleProviderError(params: {
  error: unknown;
  provider: string;
  modelId?: string;
}): EnhancedProviderError {
  const { error, provider, modelId } = params;
  const normalizedProvider = provider.toLowerCase();

  let enhancedError: EnhancedProviderError;

  // Provider-specific error enhancement
  switch (normalizedProvider) {
    case "kimi":
    case "moonshot":
      enhancedError = enhanceKimiProviderErrors(error);
      break;
    case "xai":
      enhancedError = enhanceXAIProviderErrors(error);
      break;
    case "vertex":
    case "vertex-ai":
      enhancedError = enhanceVertexAIErrors(error);
      break;
    default:
      enhancedError = classifyProviderError(error, provider);
  }

  // Add model context
  if (modelId) {
    enhancedError.model = modelId;
  }

  // Log the error
  logProviderError(enhancedError);

  return enhancedError;
}

/**
 * Determine if provider error should trigger fallback
 */
export function shouldFallbackToNextProvider(error: EnhancedProviderError): boolean {
  return shouldFallbackOnError(error);
}

/**
 * Determine if provider error is retryable
 */
export function isProviderErrorRetryable(error: EnhancedProviderError): boolean {
  return isRetryableError(error);
}

/**
 * Get all new model definitions for catalog integration
 */
export function getNewModelDefinitions(): NewModelDefinition[] {
  return ALL_NEW_MODELS;
}

/**
 * Check if model ID is recognized as a new model
 */
export function isNewModel(modelId: string): boolean {
  return isRecognizedNewModel(modelId);
}

/**
 * Check if model supports reasoning
 */
export function modelSupportsReasoning(modelId: string): boolean {
  return isReasoningModel(modelId);
}

/**
 * Apply all provider fixes in sequence
 */
export function applyProviderFixes(params: {
  provider: string;
  modelId: string;
  messages: AgentMessage[];
  requestParams: Record<string, unknown>;
}): {
  messages: AgentMessage[];
  requestParams: Record<string, unknown>;
} {
  return preprocessProviderRequest(params);
}

/**
 * Process provider response with all fixes
 */
export function processProviderResponse(params: {
  provider: string;
  modelId: string;
  response: unknown;
}): unknown {
  return postprocessProviderResponse(params);
}
