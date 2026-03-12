/**
 * Local model support for OpenClaw.
 * Provides automatic installation and management of local AI models.
 */

export * from "./types.js";
export * from "./catalog.js";
export * from "./system-resources.js";
export * from "./ollama-backend.js";
export * from "./installer.js";

// Re-export main functions for convenience
export {
  getSystemInfo,
  getModelRecommendations,
  installModel,
  uninstallModel,
  listInstalledModels,
  quickInstall,
  setupOllamaBackend,
} from "./installer.js";

export { LOCAL_MODEL_CATALOG, getModelById, getModelByName } from "./catalog.js";

export { detectSystemResources, formatSystemResources } from "./system-resources.js";

export {
  getOllamaBackendInfo,
  isOllamaInstalled,
  isOllamaRunning,
  installOllama,
  startOllamaServer,
} from "./ollama-backend.js";
