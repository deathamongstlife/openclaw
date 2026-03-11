/**
 * Ollama backend for local model management.
 * Provides model installation, management, and inference capabilities.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { fetchOllamaModels, resolveOllamaApiBase } from "../ollama-models.js";
import type {
  BackendInfo,
  InstalledModel,
  LocalModelBackend,
  ModelInstallationOptions,
  ModelInstallationProgress,
} from "./types.js";
import { getModelById } from "./catalog.js";

const execAsync = promisify(exec);
const log = createSubsystemLogger("ollama-backend");

export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

/**
 * Check if Ollama is installed on the system.
 */
export async function isOllamaInstalled(): Promise<boolean> {
  try {
    await execAsync("ollama --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Ollama version if installed.
 */
export async function getOllamaVersion(): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync("ollama --version");
    const match = stdout.match(/ollama version is ([\d.]+)/i);
    return match?.[1] ?? stdout.trim();
  } catch {
    return undefined;
  }
}

/**
 * Check if Ollama server is running.
 */
export async function isOllamaRunning(baseUrl: string = OLLAMA_DEFAULT_BASE_URL): Promise<boolean> {
  try {
    const apiBase = resolveOllamaApiBase(baseUrl);
    const response = await fetch(`${apiBase}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get comprehensive Ollama backend information.
 */
export async function getOllamaBackendInfo(baseUrl: string = OLLAMA_DEFAULT_BASE_URL): Promise<BackendInfo> {
  const installed = await isOllamaInstalled();
  const version = await getOllamaVersion();
  const running = installed ? await isOllamaRunning(baseUrl) : false;

  let errorMessage: string | undefined;
  if (!installed) {
    errorMessage = "Ollama is not installed. Install from https://ollama.com/download";
  } else if (!running) {
    errorMessage = "Ollama is installed but not running. Start it with 'ollama serve'";
  }

  return {
    backend: "ollama",
    installed,
    version,
    baseUrl,
    available: running,
    errorMessage,
  };
}

/**
 * Install Ollama automatically (platform-specific).
 */
export async function installOllama(): Promise<{ success: boolean; message: string }> {
  const platform = os.platform();

  try {
    if (platform === "darwin") {
      // macOS - Download and install using brew or direct download
      try {
        await execAsync("brew install ollama");
        return { success: true, message: "Ollama installed via Homebrew" };
      } catch {
        return {
          success: false,
          message: "Please install Ollama manually from https://ollama.com/download",
        };
      }
    } else if (platform === "linux") {
      // Linux - Use official install script
      const installCmd = 'curl -fsSL https://ollama.com/install.sh | sh';
      await execAsync(installCmd);
      return { success: true, message: "Ollama installed successfully" };
    } else if (platform === "win32") {
      // Windows - Direct user to download
      return {
        success: false,
        message: "Please download Ollama from https://ollama.com/download and run the installer",
      };
    } else {
      return {
        success: false,
        message: `Unsupported platform: ${platform}. Please install manually from https://ollama.com/download`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Installation failed: ${message}`,
    };
  }
}

/**
 * Start Ollama server (background process).
 */
export async function startOllamaServer(): Promise<{ success: boolean; message: string }> {
  try {
    const platform = os.platform();

    if (platform === "win32") {
      // Windows - Start as background process
      exec("ollama serve");
    } else {
      // macOS/Linux - Start as daemon
      exec("ollama serve > /dev/null 2>&1 &");
    }

    // Wait a bit for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const running = await isOllamaRunning();
    if (running) {
      return { success: true, message: "Ollama server started successfully" };
    }

    return {
      success: false,
      message: "Failed to start Ollama server. It may already be running.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to start server: ${message}`,
    };
  }
}

interface OllamaPullChunk {
  status?: string;
  total?: number;
  completed?: number;
  digest?: string;
  error?: string;
}

/**
 * Pull (download) a model from Ollama registry.
 */
export async function pullOllamaModel(
  modelName: string,
  baseUrl: string = OLLAMA_DEFAULT_BASE_URL,
  onProgress?: (progress: ModelInstallationProgress) => void,
): Promise<{ success: boolean; message: string }> {
  try {
    const apiBase = resolveOllamaApiBase(baseUrl);
    const response = await fetch(`${apiBase}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to pull model (HTTP ${response.status})`,
      };
    }

    if (!response.body) {
      return {
        success: false,
        message: "No response body from Ollama",
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const layers = new Map<string, { total: number; completed: number }>();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as OllamaPullChunk;

          if (chunk.error) {
            return {
              success: false,
              message: `Download failed: ${chunk.error}`,
            };
          }

          if (chunk.status && chunk.total && chunk.completed !== undefined) {
            layers.set(chunk.digest ?? chunk.status, {
              total: chunk.total,
              completed: chunk.completed,
            });

            let totalSum = 0;
            let completedSum = 0;
            for (const layer of layers.values()) {
              totalSum += layer.total;
              completedSum += layer.completed;
            }

            const percent = totalSum > 0 ? Math.round((completedSum / totalSum) * 100) : 0;

            onProgress?.({
              modelId: modelName,
              status: "downloading",
              percent,
              bytesDownloaded: completedSum,
              bytesTotal: totalSum,
              currentFile: chunk.status,
            });
          }
        } catch (error) {
          // Ignore malformed JSON lines
          log.debug(`Failed to parse pull response line: ${error}`);
        }
      }
    }

    return {
      success: true,
      message: `Successfully downloaded ${modelName}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to pull model: ${message}`,
    };
  }
}

/**
 * List all installed models via Ollama.
 */
export async function listOllamaModels(
  baseUrl: string = OLLAMA_DEFAULT_BASE_URL,
): Promise<InstalledModel[]> {
  try {
    const { models } = await fetchOllamaModels(baseUrl);

    return models.map((model) => ({
      modelId: model.name,
      backend: "ollama" as LocalModelBackend,
      quantization: "Q4_K_M", // Default, Ollama doesn't expose this
      installPath: "", // Ollama manages paths internally
      sizeOnDisk: model.size ?? 0,
      installedAt: model.modified_at ? new Date(model.modified_at) : new Date(),
      verified: true,
    }));
  } catch (error) {
    log.error(`Failed to list Ollama models: ${error}`);
    return [];
  }
}

/**
 * Delete a model from Ollama.
 */
export async function deleteOllamaModel(
  modelName: string,
  baseUrl: string = OLLAMA_DEFAULT_BASE_URL,
): Promise<{ success: boolean; message: string }> {
  try {
    const apiBase = resolveOllamaApiBase(baseUrl);
    const response = await fetch(`${apiBase}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to delete model (HTTP ${response.status})`,
      };
    }

    return {
      success: true,
      message: `Successfully deleted ${modelName}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to delete model: ${message}`,
    };
  }
}

/**
 * Install a model from the catalog using Ollama.
 */
export async function installModelViaOllama(
  modelId: string,
  options: ModelInstallationOptions,
  onProgress?: (progress: ModelInstallationProgress) => void,
): Promise<{ success: boolean; message: string }> {
  const model = getModelById(modelId);
  if (!model) {
    return {
      success: false,
      message: `Model ${modelId} not found in catalog`,
    };
  }

  if (!model.ollamaModelName) {
    return {
      success: false,
      message: `Model ${modelId} is not available via Ollama`,
    };
  }

  // Append quantization suffix if specified and different from default
  let modelName = model.ollamaModelName;
  if (options.quantization && options.quantization !== model.defaultQuantization) {
    // Ollama uses tags like :q4_k_m, :q8_0, etc.
    const quantTag = options.quantization.toLowerCase().replace(/_/g, "_");
    if (!modelName.includes(":")) {
      modelName = `${modelName}:${quantTag}`;
    }
  }

  return await pullOllamaModel(modelName, OLLAMA_DEFAULT_BASE_URL, onProgress);
}

/**
 * Run a test inference to verify model works.
 */
export async function testOllamaModel(
  modelName: string,
  baseUrl: string = OLLAMA_DEFAULT_BASE_URL,
): Promise<{ success: boolean; message: string; responseTime?: number }> {
  try {
    const apiBase = resolveOllamaApiBase(baseUrl);
    const startTime = Date.now();

    const response = await fetch(`${apiBase}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: "Say hello!",
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Model test failed (HTTP ${response.status})`,
      };
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (data.response) {
      return {
        success: true,
        message: `Model is working correctly`,
        responseTime,
      };
    }

    return {
      success: false,
      message: "Model responded but output was empty",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Model test failed: ${message}`,
    };
  }
}
