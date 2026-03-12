/**
 * Anthropic-specific extra parameters handling.
 *
 * This module handles Anthropic Claude-specific parameters including:
 * - Extended thinking mode support (Issue #43056)
 * - Claude 3.7 Sonnet model handling (Issue #43269)
 */

import type { StreamFn } from "@mariozechner/pi-agent-core";
import { streamSimple } from "@mariozechner/pi-ai";
import { log } from "./logger.js";

type AnthropicThinkingBudget = {
  type: "thinking_budget";
  thinking_budget_tokens?: number;
};

type AnthropicExtendedThinking = {
  type: "extended_thinking";
  enabled?: boolean;
  budget_tokens?: number;
};

/**
 * Check if model supports extended thinking
 */
export function supportsExtendedThinking(modelId: string): boolean {
  const normalized = modelId.toLowerCase();
  // Claude 3.7 Sonnet and newer models support extended thinking
  return (
    normalized.includes("claude-3-7") ||
    normalized.includes("claude-3.7") ||
    normalized.includes("claude-4")
  );
}

/**
 * Normalize extended thinking configuration
 */
export function normalizeExtendedThinkingConfig(
  extraParams: Record<string, unknown> | undefined,
): AnthropicExtendedThinking | undefined {
  if (!extraParams) {
    return undefined;
  }

  // Check for extended_thinking or extendedThinking
  const rawThinking = extraParams.extended_thinking ?? extraParams.extendedThinking;

  if (rawThinking === undefined || rawThinking === null) {
    return undefined;
  }

  // Boolean shorthand: true enables extended thinking
  if (typeof rawThinking === "boolean") {
    return {
      type: "extended_thinking",
      enabled: rawThinking,
    };
  }

  // Object format with options
  if (typeof rawThinking === "object") {
    const thinkingObj = rawThinking as Record<string, unknown>;
    const enabled = thinkingObj.enabled === true || thinkingObj.enabled === undefined;
    const budgetTokens =
      typeof thinkingObj.budget_tokens === "number"
        ? thinkingObj.budget_tokens
        : typeof thinkingObj.budgetTokens === "number"
          ? thinkingObj.budgetTokens
          : undefined;

    return {
      type: "extended_thinking",
      enabled,
      budget_tokens: budgetTokens,
    };
  }

  return undefined;
}

/**
 * Create stream wrapper for extended thinking support
 */
export function createAnthropicExtendedThinkingWrapper(
  baseStreamFn: StreamFn | undefined,
  extraParams: Record<string, unknown> | undefined,
): StreamFn {
  const underlying = baseStreamFn ?? streamSimple;

  return (model, context, options) => {
    // Only apply to Anthropic provider
    if (model.provider !== "anthropic") {
      return underlying(model, context, options);
    }

    // Check if model supports extended thinking
    if (!supportsExtendedThinking(model.id ?? "")) {
      return underlying(model, context, options);
    }

    const thinkingConfig = normalizeExtendedThinkingConfig(extraParams);
    if (!thinkingConfig) {
      return underlying(model, context, options);
    }

    log.debug(`Applying extended thinking for ${model.id}: ${JSON.stringify(thinkingConfig)}`);

    const originalOnPayload = options?.onPayload;
    return underlying(model, context, {
      ...options,
      onPayload: (payload) => {
        if (payload && typeof payload === "object") {
          const payloadObj = payload as Record<string, unknown>;

          // Apply extended_thinking parameter
          if (thinkingConfig.enabled !== false) {
            if (thinkingConfig.budget_tokens !== undefined) {
              payloadObj.extended_thinking = {
                type: "extended_thinking",
                budget_tokens: thinkingConfig.budget_tokens,
              };
            } else {
              payloadObj.extended_thinking = {
                type: "extended_thinking",
              };
            }
          }
        }
        return originalOnPayload?.(payload, model);
      },
    });
  };
}

/**
 * Validate Anthropic extended thinking parameters
 */
export function validateExtendedThinkingParams(
  params: Record<string, unknown> | undefined,
): { valid: boolean; error?: string } {
  if (!params) {
    return { valid: true };
  }

  const thinkingConfig = normalizeExtendedThinkingConfig(params);
  if (!thinkingConfig) {
    return { valid: true };
  }

  // Validate budget_tokens if present
  if (thinkingConfig.budget_tokens !== undefined) {
    if (typeof thinkingConfig.budget_tokens !== "number") {
      return {
        valid: false,
        error: "extended_thinking.budget_tokens must be a number",
      };
    }

    if (thinkingConfig.budget_tokens < 1 || thinkingConfig.budget_tokens > 10000) {
      return {
        valid: false,
        error: "extended_thinking.budget_tokens must be between 1 and 10000",
      };
    }
  }

  return { valid: true };
}

/**
 * Get default extended thinking configuration for a model
 */
export function getDefaultExtendedThinkingConfig(
  modelId: string,
): AnthropicExtendedThinking | undefined {
  if (!supportsExtendedThinking(modelId)) {
    return undefined;
  }

  // Default: enabled with auto budget
  return {
    type: "extended_thinking",
    enabled: true,
  };
}
