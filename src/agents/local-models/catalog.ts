/**
 * Catalog of popular local models with their configurations and requirements.
 */

import type { LocalModelDefinition } from "./types.js";

export const LOCAL_MODEL_CATALOG: LocalModelDefinition[] = [
  {
    id: "llama-3.3-70b",
    name: "llama3.3:70b",
    displayName: "Llama 3.3 70B",
    description: "Meta's flagship model with excellent reasoning and instruction following. Best quality for most tasks.",
    size: "70B",
    capabilities: ["text", "reasoning", "code"],
    contextWindow: 131072,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 24,
    minRAM: 48,
    recommendedVRAM: 48,
    recommendedRAM: 64,
    ollamaModelName: "llama3.3:70b",
    huggingfaceRepo: "meta-llama/Llama-3.3-70B-Instruct",
    licenseType: "Llama 3 Community License",
  },
  {
    id: "llama-3.2-3b",
    name: "llama3.2:3b",
    displayName: "Llama 3.2 3B",
    description: "Fast and efficient small model. Great for quick tasks and resource-constrained systems.",
    size: "3B",
    capabilities: ["text", "code"],
    contextWindow: 131072,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 2,
    minRAM: 4,
    recommendedVRAM: 4,
    recommendedRAM: 8,
    ollamaModelName: "llama3.2:3b",
    huggingfaceRepo: "meta-llama/Llama-3.2-3B-Instruct",
    licenseType: "Llama 3 Community License",
  },
  {
    id: "qwen2.5-72b",
    name: "qwen2.5:72b",
    displayName: "Qwen 2.5 72B",
    description: "Alibaba's powerful multilingual model with strong reasoning. Excellent for non-English languages.",
    size: "72B",
    capabilities: ["text", "reasoning", "multilingual", "code"],
    contextWindow: 131072,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 24,
    minRAM: 48,
    recommendedVRAM: 48,
    recommendedRAM: 64,
    ollamaModelName: "qwen2.5:72b",
    huggingfaceRepo: "Qwen/Qwen2.5-72B-Instruct",
    licenseType: "Apache 2.0",
  },
  {
    id: "deepseek-r1-8b",
    name: "deepseek-r1:8b",
    displayName: "DeepSeek R1 8B",
    description: "Reasoning-focused model with chain-of-thought capabilities. Excellent for complex problem solving.",
    size: "8B",
    capabilities: ["text", "reasoning", "code"],
    contextWindow: 65536,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 4,
    minRAM: 8,
    recommendedVRAM: 8,
    recommendedRAM: 16,
    ollamaModelName: "deepseek-r1:8b",
    huggingfaceRepo: "deepseek-ai/DeepSeek-R1-Distill-Qwen-8B",
    licenseType: "MIT",
  },
  {
    id: "mistral-small",
    name: "mistral-small",
    displayName: "Mistral Small 22B",
    description: "Balanced model from Mistral AI. Good quality with reasonable resource requirements.",
    size: "22B",
    capabilities: ["text", "reasoning", "code"],
    contextWindow: 32768,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 12,
    minRAM: 16,
    recommendedVRAM: 16,
    recommendedRAM: 32,
    ollamaModelName: "mistral-small",
    huggingfaceRepo: "mistralai/Mistral-Small-Instruct-2409",
    licenseType: "Apache 2.0",
  },
  {
    id: "phi-4",
    name: "phi4",
    displayName: "Phi-4 14B",
    description: "Microsoft's efficient reasoning model. Excellent performance for its size.",
    size: "14B",
    capabilities: ["text", "reasoning", "code"],
    contextWindow: 16384,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 8,
    minRAM: 12,
    recommendedVRAM: 12,
    recommendedRAM: 24,
    ollamaModelName: "phi4",
    huggingfaceRepo: "microsoft/phi-4",
    licenseType: "MIT",
  },
  {
    id: "gemma-2-27b",
    name: "gemma2:27b",
    displayName: "Gemma 2 27B",
    description: "Google's open model with strong instruction following and reasoning.",
    size: "27B",
    capabilities: ["text", "reasoning", "code"],
    contextWindow: 8192,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 16,
    minRAM: 20,
    recommendedVRAM: 20,
    recommendedRAM: 32,
    ollamaModelName: "gemma2:27b",
    huggingfaceRepo: "google/gemma-2-27b-it",
    licenseType: "Gemma License",
  },
  {
    id: "llama-3.1-8b",
    name: "llama3.1:8b",
    displayName: "Llama 3.1 8B",
    description: "Versatile and efficient 8B model. Good balance of speed and quality.",
    size: "8B",
    capabilities: ["text", "code"],
    contextWindow: 131072,
    defaultQuantization: "Q4_K_M",
    supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q5_K_M", "Q8_0", "FP16"],
    minVRAM: 4,
    minRAM: 8,
    recommendedVRAM: 8,
    recommendedRAM: 16,
    ollamaModelName: "llama3.1:8b",
    huggingfaceRepo: "meta-llama/Llama-3.1-8B-Instruct",
    licenseType: "Llama 3 Community License",
  },
];

export function getModelById(modelId: string): LocalModelDefinition | undefined {
  return LOCAL_MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getModelByName(name: string): LocalModelDefinition | undefined {
  return LOCAL_MODEL_CATALOG.find((m) => m.name === name || m.ollamaModelName === name);
}

export function getModelsByCapability(capability: string): LocalModelDefinition[] {
  return LOCAL_MODEL_CATALOG.filter((m) => m.capabilities.includes(capability as never));
}

export function getModelsBySize(minSize: number, maxSize: number): LocalModelDefinition[] {
  const parseSize = (size: string): number => {
    const match = size.match(/(\d+)B/);
    return match ? Number.parseInt(match[1]) : 0;
  };

  return LOCAL_MODEL_CATALOG.filter((m) => {
    const size = parseSize(m.size);
    return size >= minSize && size <= maxSize;
  });
}
