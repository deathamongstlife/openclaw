/**
 * Types and interfaces for local model support.
 */

export type LocalModelBackend = "ollama" | "lm-studio" | "llama-cpp" | "vllm" | "text-generation-webui";

export type ModelQuantization = "Q4_0" | "Q4_K_M" | "Q5_0" | "Q5_K_M" | "Q8_0" | "FP16" | "FP32";

export type ModelSize = "3B" | "7B" | "8B" | "14B" | "22B" | "27B" | "70B" | "72B";

export type ModelCapability = "text" | "reasoning" | "vision" | "multilingual" | "code";

export interface LocalModelDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  size: ModelSize;
  capabilities: ModelCapability[];
  contextWindow: number;
  defaultQuantization: ModelQuantization;
  supportedQuantizations: ModelQuantization[];
  minVRAM: number; // GB
  minRAM: number; // GB
  recommendedVRAM: number; // GB
  recommendedRAM: number; // GB
  ollamaModelName?: string;
  huggingfaceRepo?: string;
  downloadUrl?: string;
  licenseType?: string;
}

export interface SystemResources {
  totalRAM: number; // GB
  availableRAM: number; // GB
  totalVRAM: number; // GB
  availableVRAM: number; // GB
  hasGPU: boolean;
  gpuName?: string;
  cpuCores: number;
}

export interface ModelInstallationOptions {
  backend: LocalModelBackend;
  quantization?: ModelQuantization;
  forceReinstall?: boolean;
  skipVerification?: boolean;
}

export interface ModelInstallationProgress {
  modelId: string;
  status: "pending" | "downloading" | "extracting" | "verifying" | "complete" | "failed";
  percent: number;
  bytesDownloaded: number;
  bytesTotal: number;
  currentFile?: string;
  error?: string;
}

export interface InstalledModel {
  modelId: string;
  backend: LocalModelBackend;
  quantization: ModelQuantization;
  installPath: string;
  sizeOnDisk: number; // bytes
  installedAt: Date;
  lastUsed?: Date;
  verified: boolean;
}

export interface BackendInfo {
  backend: LocalModelBackend;
  installed: boolean;
  version?: string;
  baseUrl?: string;
  available: boolean;
  errorMessage?: string;
}

export interface ModelRecommendation {
  model: LocalModelDefinition;
  quantization: ModelQuantization;
  reason: string;
  fitScore: number; // 0-100, how well this model fits the system
}
