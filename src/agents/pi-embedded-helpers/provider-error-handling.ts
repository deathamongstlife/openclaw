/**
 * Enhanced provider error handling and fallback logic.
 *
 * This module improves error detection, recovery, and fallback for various providers:
 * - Better error classification (rate limit, auth, billing, timeout)
 * - Provider-specific error message parsing
 * - Fallback chain implementation
 */

import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("provider-errors");

export type ProviderErrorType =
  | "rate_limit"
  | "auth"
  | "billing"
  | "timeout"
  | "overloaded"
  | "context_overflow"
  | "invalid_request"
  | "model_not_found"
  | "unknown";

export type EnhancedProviderError = {
  type: ProviderErrorType;
  message: string;
  provider?: string;
  model?: string;
  retryable: boolean;
  fallbackEligible: boolean;
  originalError?: unknown;
};

/**
 * Parse and classify provider error responses
 */
export function classifyProviderError(error: unknown, provider?: string): EnhancedProviderError {
  const errorMessage = extractErrorMessage(error);
  const errorCode = extractErrorCode(error);
  const statusCode = extractStatusCode(error);

  // Detect rate limiting
  if (isRateLimitError(errorMessage, errorCode, statusCode)) {
    return {
      type: "rate_limit",
      message: formatRateLimitMessage(errorMessage, provider),
      provider,
      retryable: true,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Detect billing/quota errors
  if (isBillingError(errorMessage, errorCode)) {
    return {
      type: "billing",
      message: formatBillingMessage(errorMessage, provider),
      provider,
      retryable: false,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Detect authentication errors
  if (isAuthError(errorMessage, errorCode, statusCode)) {
    return {
      type: "auth",
      message: formatAuthMessage(errorMessage, provider),
      provider,
      retryable: false,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Detect timeout errors
  if (isTimeoutError(errorMessage, errorCode)) {
    return {
      type: "timeout",
      message: `Request to ${provider || "provider"} timed out. The model may be processing a long request.`,
      provider,
      retryable: true,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Detect service overload
  if (isOverloadedError(errorMessage, statusCode)) {
    return {
      type: "overloaded",
      message: `${provider || "Provider"} service is temporarily overloaded. Please try again in a moment.`,
      provider,
      retryable: true,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Detect context overflow
  if (isContextOverflowError(errorMessage)) {
    return {
      type: "context_overflow",
      message: "Context window exceeded. Try shortening your message or conversation history.",
      provider,
      retryable: false,
      fallbackEligible: false,
      originalError: error,
    };
  }

  // Detect model not found
  if (isModelNotFoundError(errorMessage, errorCode)) {
    return {
      type: "model_not_found",
      message: errorMessage || "Model not found or not accessible with current API key",
      provider,
      retryable: false,
      fallbackEligible: true,
      originalError: error,
    };
  }

  // Unknown error
  return {
    type: "unknown",
    message: errorMessage || "Unknown error occurred",
    provider,
    retryable: false,
    fallbackEligible: false,
    originalError: error,
  };
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (!error || typeof error !== "object") {
    return "";
  }

  const errorObj = error as Record<string, unknown>;

  // Try common error message fields
  const message =
    errorObj.message ??
    errorObj.error_message ??
    errorObj.errorMessage ??
    (errorObj.error && typeof errorObj.error === "object"
      ? (errorObj.error as Record<string, unknown>).message
      : undefined);

  return typeof message === "string" ? message : String(error);
}

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const errorObj = error as Record<string, unknown>;
  const code =
    errorObj.code ??
    errorObj.error_code ??
    errorObj.errorCode ??
    (errorObj.error && typeof errorObj.error === "object"
      ? (errorObj.error as Record<string, unknown>).code
      : undefined);

  return typeof code === "string" ? code : undefined;
}

function extractStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const errorObj = error as Record<string, unknown>;
  const status =
    errorObj.status ??
    errorObj.statusCode ??
    errorObj.status_code ??
    (errorObj.response && typeof errorObj.response === "object"
      ? (errorObj.response as Record<string, unknown>).status
      : undefined);

  return typeof status === "number" ? status : undefined;
}

function isRateLimitError(message: string, code?: string, status?: number): boolean {
  if (status === 429) {
    return true;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests") ||
    code === "rate_limit_exceeded" ||
    code === "429"
  );
}

function isBillingError(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("insufficient_quota") ||
    lower.includes("quota exceeded") ||
    lower.includes("billing") ||
    lower.includes("credits") ||
    lower.includes("payment") ||
    code === "insufficient_quota" ||
    code === "quota_exceeded"
  );
}

function isAuthError(message: string, code?: string, status?: number): boolean {
  if (status === 401 || status === 403) {
    return true;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes("unauthorized") ||
    lower.includes("authentication") ||
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("forbidden") ||
    code === "invalid_api_key" ||
    code === "authentication_error"
  );
}

function isTimeoutError(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("time out") ||
    code === "timeout" ||
    code === "request_timeout"
  );
}

function isOverloadedError(message: string, status?: number): boolean {
  if (status === 503 || status === 529) {
    return true;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes("overloaded") ||
    lower.includes("service unavailable") ||
    lower.includes("temporarily unavailable")
  );
}

function isContextOverflowError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("context length") ||
    lower.includes("context window") ||
    lower.includes("maximum context") ||
    lower.includes("too long") ||
    lower.includes("exceeds")
  );
}

function isModelNotFoundError(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("model not found") ||
    lower.includes("model_not_found") ||
    lower.includes("does not exist") ||
    code === "model_not_found"
  );
}

function formatRateLimitMessage(message: string, provider?: string): string {
  if (provider) {
    return `⚠️ ${provider} rate limit reached. ${message || "Please try again later."}`;
  }
  return `⚠️ API rate limit reached. ${message || "Please try again later."}`;
}

function formatBillingMessage(message: string, provider?: string): string {
  if (provider) {
    return `⚠️ ${provider} billing error: ${message || "Insufficient quota or credits."}`;
  }
  return `⚠️ API billing error: ${message || "Insufficient quota or credits."}`;
}

function formatAuthMessage(message: string, provider?: string): string {
  if (provider) {
    return `⚠️ ${provider} authentication failed: ${message || "Invalid API key."}`;
  }
  return `⚠️ Authentication failed: ${message || "Invalid API key."}`;
}

/**
 * Provider-specific error enhancements
 */

export function enhanceKimiProviderErrors(error: unknown): EnhancedProviderError {
  const classified = classifyProviderError(error, "Kimi");

  // Kimi-specific error patterns
  const message = extractErrorMessage(error);
  if (message.includes("思考") || message.includes("thinking")) {
    return {
      ...classified,
      message: `Kimi thinking mode error: ${message}`,
    };
  }

  return classified;
}

export function enhanceXAIProviderErrors(error: unknown): EnhancedProviderError {
  const classified = classifyProviderError(error, "xAI");

  // xAI Grok-specific patterns
  const message = extractErrorMessage(error);
  if (message.toLowerCase().includes("grok")) {
    return {
      ...classified,
      message: `xAI Grok error: ${message}`,
    };
  }

  return classified;
}

export function enhanceVertexAIErrors(error: unknown): EnhancedProviderError {
  const classified = classifyProviderError(error, "Vertex AI");

  // Vertex AI often has longer processing times
  if (classified.type === "timeout") {
    return {
      ...classified,
      message: "Vertex AI request timed out. Consider increasing timeout for long-running requests.",
    };
  }

  return classified;
}

/**
 * Determine if an error should trigger fallback to next provider
 */
export function shouldFallbackOnError(error: EnhancedProviderError): boolean {
  // Fallback on rate limits, billing, auth, overload, and model not found
  return error.fallbackEligible;
}

/**
 * Determine if an error is retryable with the same provider
 */
export function isRetryableError(error: EnhancedProviderError): boolean {
  return error.retryable;
}

/**
 * Log enhanced error for debugging
 */
export function logProviderError(error: EnhancedProviderError): void {
  const prefix = error.provider ? `[${error.provider}]` : "[Provider]";

  switch (error.type) {
    case "rate_limit":
      log.warn(`${prefix} Rate limit: ${error.message}`);
      break;
    case "billing":
      log.error(`${prefix} Billing error: ${error.message}`);
      break;
    case "auth":
      log.error(`${prefix} Auth error: ${error.message}`);
      break;
    case "timeout":
      log.warn(`${prefix} Timeout: ${error.message}`);
      break;
    case "overloaded":
      log.warn(`${prefix} Overloaded: ${error.message}`);
      break;
    default:
      log.error(`${prefix} Error [${error.type}]: ${error.message}`);
  }
}
