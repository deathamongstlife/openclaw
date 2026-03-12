/**
 * Local model installer with automatic backend selection and model recommendations.
 */

import { createSubsystemLogger } from "../../logging/subsystem.js";
import { LOCAL_MODEL_CATALOG, getModelById } from "./catalog.js";
import {
  detectSystemResources,
  canRunModel,
  formatSystemResources,
  recommendQuantization,
} from "./system-resources.js";
import {
  getOllamaBackendInfo,
  installOllama,
  startOllamaServer,
  installModelViaOllama,
  listOllamaModels,
  deleteOllamaModel,
  testOllamaModel,
} from "./ollama-backend.js";
import type {
  LocalModelDefinition,
  ModelInstallationOptions,
  ModelInstallationProgress,
  ModelRecommendation,
  SystemResources,
  InstalledModel,
} from "./types.js";

const log = createSubsystemLogger("local-model-installer");

/**
 * Get model recommendations based on system resources.
 */
export async function getModelRecommendations(
  resources?: SystemResources,
): Promise<ModelRecommendation[]> {
  const systemResources = resources ?? (await detectSystemResources());
  const recommendations: ModelRecommendation[] = [];

  for (const model of LOCAL_MODEL_CATALOG) {
    // Calculate fit score based on resource requirements
    let fitScore = 0;
    let reason = "";

    const requiredMemory = systemResources.hasGPU ? model.minVRAM : model.minRAM;
    const availableMemory = systemResources.hasGPU
      ? systemResources.totalVRAM
      : systemResources.totalRAM;

    if (!canRunModel(systemResources, model.minVRAM, model.minRAM)) {
      // Model requires more resources than available
      continue;
    }

    // Score based on how well resources match
    if (availableMemory >= model.recommendedVRAM || availableMemory >= model.recommendedRAM) {
      fitScore = 100;
      reason = "Excellent fit - recommended resources available";
    } else if (availableMemory >= requiredMemory * 1.5) {
      fitScore = 80;
      reason = "Good fit - sufficient resources with headroom";
    } else if (availableMemory >= requiredMemory * 1.2) {
      fitScore = 60;
      reason = "Adequate fit - meets minimum requirements";
    } else {
      fitScore = 40;
      reason = "Marginal fit - may run slowly";
    }

    // Bonus points for smaller models on resource-constrained systems
    const parseSize = (size: string): number => {
      const match = size.match(/(\d+)B/);
      return match ? Number.parseInt(match[1]) : 0;
    };

    const modelSize = parseSize(model.size);
    if (availableMemory < 32 && modelSize <= 8) {
      fitScore += 10;
      reason += " (optimized for your system)";
    }

    const quantization = recommendQuantization(systemResources, requiredMemory);

    recommendations.push({
      model,
      quantization: quantization as never,
      reason,
      fitScore,
    });
  }

  // Sort by fit score (descending)
  recommendations.sort((a, b) => b.fitScore - a.fitScore);

  return recommendations;
}

/**
 * Install and setup Ollama backend if not already installed.
 */
export async function setupOllamaBackend(
  onProgress?: (message: string) => void,
): Promise<{ success: boolean; message: string }> {
  onProgress?.("Checking Ollama installation...");

  const backendInfo = await getOllamaBackendInfo();

  if (!backendInfo.installed) {
    onProgress?.("Ollama not found. Installing...");
    const installResult = await installOllama();

    if (!installResult.success) {
      return installResult;
    }

    onProgress?.("Ollama installed successfully");
  }

  if (!backendInfo.available) {
    onProgress?.("Starting Ollama server...");
    const startResult = await startOllamaServer();

    if (!startResult.success) {
      return startResult;
    }

    onProgress?.("Ollama server started");
  }

  return {
    success: true,
    message: "Ollama backend is ready",
  };
}

/**
 * Install a model with progress tracking.
 */
export async function installModel(
  modelId: string,
  options?: Partial<ModelInstallationOptions>,
  onProgress?: (progress: ModelInstallationProgress) => void,
): Promise<{ success: boolean; message: string; model?: InstalledModel }> {
  const model = getModelById(modelId);
  if (!model) {
    return {
      success: false,
      message: `Model ${modelId} not found in catalog`,
    };
  }

  log.info(`Installing model: ${model.displayName} (${modelId})`);

  // Ensure backend is ready
  const setupResult = await setupOllamaBackend((msg) => {
    onProgress?.({
      modelId,
      status: "pending",
      percent: 0,
      bytesDownloaded: 0,
      bytesTotal: 0,
      currentFile: msg,
    });
  });

  if (!setupResult.success) {
    return setupResult;
  }

  // Check if already installed (unless force reinstall)
  if (!options?.forceReinstall) {
    const installed = await listOllamaModels();
    const existing = installed.find((m) => m.modelId === model.ollamaModelName);

    if (existing) {
      log.info(`Model ${modelId} already installed`);
      return {
        success: true,
        message: `Model ${model.displayName} is already installed`,
        model: existing,
      };
    }
  }

  // Detect resources and recommend quantization
  const resources = await detectSystemResources();
  const recommendedQuant = recommendQuantization(resources, model.minVRAM);

  const installOptions: ModelInstallationOptions = {
    backend: "ollama",
    quantization: options?.quantization ?? (recommendedQuant as never),
    forceReinstall: options?.forceReinstall ?? false,
    skipVerification: options?.skipVerification ?? false,
  };

  // Install via Ollama
  const installResult = await installModelViaOllama(modelId, installOptions, onProgress);

  if (!installResult.success) {
    return installResult;
  }

  // Verify installation (unless skipped)
  if (!installOptions.skipVerification) {
    onProgress?.({
      modelId,
      status: "verifying",
      percent: 95,
      bytesDownloaded: 0,
      bytesTotal: 0,
      currentFile: "Testing model...",
    });

    const testResult = await testOllamaModel(model.ollamaModelName ?? modelId);

    if (!testResult.success) {
      return {
        success: false,
        message: `Model installed but verification failed: ${testResult.message}`,
      };
    }

    log.info(`Model ${modelId} verified successfully (${testResult.responseTime}ms)`);
  }

  onProgress?.({
    modelId,
    status: "complete",
    percent: 100,
    bytesDownloaded: 0,
    bytesTotal: 0,
  });

  // Get installed model info
  const installed = await listOllamaModels();
  const installedModel = installed.find((m) => m.modelId === model.ollamaModelName);

  return {
    success: true,
    message: `Successfully installed ${model.displayName}`,
    model: installedModel,
  };
}

/**
 * Uninstall a model.
 */
export async function uninstallModel(modelId: string): Promise<{ success: boolean; message: string }> {
  const model = getModelById(modelId);
  if (!model) {
    return {
      success: false,
      message: `Model ${modelId} not found in catalog`,
    };
  }

  const modelName = model.ollamaModelName ?? modelId;
  return await deleteOllamaModel(modelName);
}

/**
 * List all installed models.
 */
export async function listInstalledModels(): Promise<InstalledModel[]> {
  return await listOllamaModels();
}

/**
 * Get system information and model recommendations.
 */
export async function getSystemInfo(): Promise<{
  resources: SystemResources;
  formattedResources: string;
  recommendations: ModelRecommendation[];
  installedModels: InstalledModel[];
}> {
  const resources = await detectSystemResources();
  const formattedResources = formatSystemResources(resources);
  const recommendations = await getModelRecommendations(resources);
  const installedModels = await listInstalledModels();

  return {
    resources,
    formattedResources,
    recommendations,
    installedModels,
  };
}

/**
 * One-click install: setup backend and install recommended model.
 */
export async function quickInstall(
  onProgress?: (progress: ModelInstallationProgress) => void,
): Promise<{ success: boolean; message: string; model?: LocalModelDefinition }> {
  log.info("Starting quick install...");

  // Get system resources
  const resources = await detectSystemResources();
  log.info(`System resources: ${formatSystemResources(resources)}`);

  // Get recommendations
  const recommendations = await getModelRecommendations(resources);

  if (recommendations.length === 0) {
    return {
      success: false,
      message: "No suitable models found for your system resources",
    };
  }

  // Install top recommendation
  const topRecommendation = recommendations[0];
  log.info(`Installing recommended model: ${topRecommendation.model.displayName}`);

  const result = await installModel(
    topRecommendation.model.id,
    {
      quantization: topRecommendation.quantization,
    },
    onProgress,
  );

  if (result.success) {
    return {
      success: true,
      message: `Successfully installed ${topRecommendation.model.displayName}`,
      model: topRecommendation.model,
    };
  }

  return result;
}
