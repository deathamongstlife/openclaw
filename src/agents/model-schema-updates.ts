/**
 * Model schema updates for new provider models.
 *
 * This file contains model definitions for newly released models that need
 * to be recognized by Jarvis's model catalog and validation systems.
 */

export type NewModelDefinition = {
  id: string;
  provider: string;
  name?: string;
  api?: string;
  contextWindow?: number;
  reasoning?: boolean;
  input?: Array<"text" | "image" | "document">;
  maxTokens?: number;
};

/**
 * OpenAI o-series models (o1, o3 family)
 * Issues: #43301, #43327, #43092, #43061
 */
export const OPENAI_O_SERIES_MODELS: NewModelDefinition[] = [
  {
    id: "o1-preview",
    provider: "openai",
    name: "OpenAI o1 Preview",
    api: "openai-responses",
    contextWindow: 128000,
    reasoning: true,
    input: ["text", "image"],
    maxTokens: 32768,
  },
  {
    id: "o1-mini",
    provider: "openai",
    name: "OpenAI o1 Mini",
    api: "openai-responses",
    contextWindow: 128000,
    reasoning: true,
    input: ["text"],
    maxTokens: 65536,
  },
  {
    id: "o3-mini",
    provider: "openai",
    name: "OpenAI o3 Mini",
    api: "openai-responses",
    contextWindow: 200000,
    reasoning: true,
    input: ["text"],
    maxTokens: 100000,
  },
  {
    id: "o3",
    provider: "openai",
    name: "OpenAI o3",
    api: "openai-responses",
    contextWindow: 200000,
    reasoning: true,
    input: ["text"],
    maxTokens: 100000,
  },
];

/**
 * Gemini 2.0 models including Flash Thinking experimental
 * Issues: #43315, #43181, #43140, #43076
 */
export const GEMINI_2_0_MODELS: NewModelDefinition[] = [
  {
    id: "gemini-2.0-flash-thinking-exp",
    provider: "google",
    name: "Gemini 2.0 Flash Thinking (Experimental)",
    api: "gemini",
    contextWindow: 1000000,
    reasoning: true,
    input: ["text", "image"],
    maxTokens: 8192,
  },
  {
    id: "gemini-2.0-flash-thinking-exp-1219",
    provider: "google",
    name: "Gemini 2.0 Flash Thinking Exp 1219",
    api: "gemini",
    contextWindow: 1000000,
    reasoning: true,
    input: ["text", "image"],
    maxTokens: 8192,
  },
  {
    id: "gemini-exp-1206",
    provider: "google",
    name: "Gemini Experimental 1206",
    api: "gemini",
    contextWindow: 2097152,
    reasoning: true,
    input: ["text", "image"],
    maxTokens: 8192,
  },
];

/**
 * Claude 3.7 Sonnet
 * Issue: #43269
 */
export const ANTHROPIC_CLAUDE_37_MODELS: NewModelDefinition[] = [
  {
    id: "claude-3-7-sonnet-20250219",
    provider: "anthropic",
    name: "Claude 3.7 Sonnet",
    api: "anthropic",
    contextWindow: 200000,
    reasoning: false,
    input: ["text", "image", "document"],
    maxTokens: 8192,
  },
];

/**
 * DeepSeek R1
 * Issue: #43287
 */
export const DEEPSEEK_R1_MODELS: NewModelDefinition[] = [
  {
    id: "deepseek-r1",
    provider: "deepseek",
    name: "DeepSeek R1",
    api: "openai-completions",
    contextWindow: 64000,
    reasoning: true,
    input: ["text"],
    maxTokens: 8192,
  },
  {
    id: "deepseek-reasoner",
    provider: "deepseek",
    name: "DeepSeek Reasoner",
    api: "openai-completions",
    contextWindow: 64000,
    reasoning: true,
    input: ["text"],
    maxTokens: 8192,
  },
];

/**
 * Combined list of all new models
 */
export const ALL_NEW_MODELS: NewModelDefinition[] = [
  ...OPENAI_O_SERIES_MODELS,
  ...GEMINI_2_0_MODELS,
  ...ANTHROPIC_CLAUDE_37_MODELS,
  ...DEEPSEEK_R1_MODELS,
];

/**
 * Model ID patterns for validation
 */
export const MODEL_ID_PATTERNS = {
  openai_o_series: /^o[13](-mini|-preview)?$/i,
  gemini_2_0: /^gemini-(2\.0|exp-\d+|2\.0-flash-thinking-exp)/i,
  claude_37: /^claude-3-7-sonnet/i,
  deepseek_r1: /^deepseek-(r1|reasoner)/i,
};

/**
 * Check if a model ID matches any new model pattern
 */
export function isRecognizedNewModel(modelId: string): boolean {
  return Object.values(MODEL_ID_PATTERNS).some((pattern) => pattern.test(modelId));
}

/**
 * Get model definition for a given provider and model ID
 */
export function getNewModelDefinition(
  provider: string,
  modelId: string,
): NewModelDefinition | undefined {
  const normalizedProvider = provider.toLowerCase().trim();
  const normalizedModelId = modelId.toLowerCase().trim();

  return ALL_NEW_MODELS.find(
    (model) =>
      model.provider.toLowerCase() === normalizedProvider &&
      model.id.toLowerCase() === normalizedModelId,
  );
}

/**
 * Check if a model supports reasoning (o1, o3, DeepSeek R1, Gemini thinking)
 */
export function isReasoningModel(modelId: string): boolean {
  return ALL_NEW_MODELS.some(
    (model) => model.id.toLowerCase() === modelId.toLowerCase() && model.reasoning === true,
  );
}
