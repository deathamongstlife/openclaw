/**
 * CLI commands for local model management.
 */

import chalk from "chalk";
import { Command } from "commander";
import {
  getSystemInfo,
  installModel,
  uninstallModel,
  listInstalledModels,
  quickInstall,
  getOllamaBackendInfo,
  LOCAL_MODEL_CATALOG,
  type ModelInstallationProgress,
} from "../agents/local-models/index.js";

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Display a progress bar.
 */
function showProgress(progress: ModelInstallationProgress): void {
  const { status, percent, bytesDownloaded, bytesTotal, currentFile } = progress;

  const barLength = 30;
  const filled = Math.round((percent / 100) * barLength);
  const empty = barLength - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  let statusText = status.toUpperCase();
  let details = "";

  if (bytesTotal > 0) {
    details = ` ${formatBytes(bytesDownloaded)} / ${formatBytes(bytesTotal)}`;
  }

  if (currentFile) {
    details += ` - ${currentFile}`;
  }

  process.stdout.write(`\r${chalk.blue(statusText)} [${bar}] ${percent}%${details}`);

  if (status === "complete" || status === "failed") {
    process.stdout.write("\n");
  }
}

/**
 * Command: info
 * Show system information and model recommendations.
 */
async function infoCommand(): Promise<void> {
  console.log(chalk.blue.bold("\n🖥️  System Information\n"));

  const { formattedResources, recommendations, installedModels } = await getSystemInfo();

  console.log(formattedResources);
  console.log();

  // Backend status
  console.log(chalk.blue.bold("🔧 Backend Status\n"));
  const backendInfo = await getOllamaBackendInfo();

  if (backendInfo.available) {
    console.log(chalk.green(`✓ Ollama ${backendInfo.version ?? "unknown"} - Running`));
  } else if (backendInfo.installed) {
    console.log(chalk.yellow(`⚠ Ollama ${backendInfo.version ?? "unknown"} - Not Running`));
    console.log(chalk.dim(`  Start with: ollama serve`));
  } else {
    console.log(chalk.red("✗ Ollama - Not Installed"));
    console.log(chalk.dim(`  Install from: https://ollama.com/download`));
  }
  console.log();

  // Installed models
  if (installedModels.length > 0) {
    console.log(chalk.blue.bold("📦 Installed Models\n"));
    for (const model of installedModels) {
      const sizeStr = formatBytes(model.sizeOnDisk);
      console.log(chalk.green(`  ✓ ${model.modelId}`), chalk.dim(`(${sizeStr})`));
    }
    console.log();
  }

  // Recommendations
  if (recommendations.length > 0) {
    console.log(chalk.blue.bold("💡 Recommended Models\n"));

    const topRecommendations = recommendations.slice(0, 5);
    for (const rec of topRecommendations) {
      const isInstalled = installedModels.some((m) => m.modelId === rec.model.ollamaModelName);
      const statusIcon = isInstalled ? chalk.green("✓") : chalk.dim("○");

      console.log(`${statusIcon} ${chalk.bold(rec.model.displayName)}`);
      console.log(chalk.dim(`  ${rec.model.description}`));
      console.log(
        chalk.dim(
          `  Size: ${rec.model.size} | Quantization: ${rec.quantization} | Fit: ${rec.fitScore}%`,
        ),
      );
      console.log(chalk.dim(`  ${rec.reason}`));

      if (!isInstalled) {
        console.log(chalk.dim(`  Install: jarvis local-models install ${rec.model.id}`));
      }
      console.log();
    }
  }
}

/**
 * Command: list
 * List all available models in catalog.
 */
async function listCommand(options: { installed?: boolean }): Promise<void> {
  if (options.installed) {
    // List installed models
    console.log(chalk.blue.bold("\n📦 Installed Models\n"));

    const installed = await listInstalledModels();

    if (installed.length === 0) {
      console.log(chalk.yellow("No models installed yet"));
      console.log(chalk.dim("Install a model with: jarvis local-models install <model-id>"));
      return;
    }

    for (const model of installed) {
      const sizeStr = formatBytes(model.sizeOnDisk);
      const dateStr = model.installedAt.toLocaleDateString();

      console.log(chalk.green(`✓ ${model.modelId}`));
      console.log(chalk.dim(`  Size: ${sizeStr}`));
      console.log(chalk.dim(`  Installed: ${dateStr}`));
      console.log(chalk.dim(`  Backend: ${model.backend}`));

      if (model.lastUsed) {
        console.log(chalk.dim(`  Last used: ${model.lastUsed.toLocaleDateString()}`));
      }
      console.log();
    }

    return;
  }

  // List all available models
  console.log(chalk.blue.bold("\n📚 Available Models\n"));

  for (const model of LOCAL_MODEL_CATALOG) {
    console.log(chalk.bold(model.displayName), chalk.dim(`(${model.size})`));
    console.log(chalk.dim(`  ID: ${model.id}`));
    console.log(chalk.dim(`  ${model.description}`));
    console.log(
      chalk.dim(
        `  Capabilities: ${model.capabilities.join(", ")} | Context: ${model.contextWindow}`,
      ),
    );
    console.log(chalk.dim(`  Min RAM: ${model.minRAM}GB | Min VRAM: ${model.minVRAM}GB`));
    console.log();
  }
}

/**
 * Command: install
 * Install a specific model.
 */
async function installCommand(modelId: string, options: { quantization?: string }): Promise<void> {
  console.log(chalk.blue.bold(`\n🚀 Installing ${modelId}...\n`));

  const result = await installModel(
    modelId,
    {
      quantization: options.quantization as never,
    },
    showProgress,
  );

  if (result.success) {
    console.log(chalk.green.bold("\n✓ Installation Complete!\n"));
    console.log(chalk.dim(`Use with: jarvis config set agents.defaults.model ollama/${modelId}`));
  } else {
    console.log(chalk.red.bold("\n✗ Installation Failed\n"));
    console.log(chalk.red(result.message));
    process.exit(1);
  }
}

/**
 * Command: uninstall
 * Uninstall a model.
 */
async function uninstallCommand(modelId: string): Promise<void> {
  console.log(chalk.blue.bold(`\n🗑️  Uninstalling ${modelId}...\n`));

  const result = await uninstallModel(modelId);

  if (result.success) {
    console.log(chalk.green.bold("✓ Uninstalled successfully"));
  } else {
    console.log(chalk.red.bold("✗ Uninstall failed"));
    console.log(chalk.red(result.message));
    process.exit(1);
  }
}

/**
 * Command: quick-install
 * One-click installation of recommended model.
 */
async function quickInstallCommand(): Promise<void> {
  console.log(chalk.blue.bold("\n🚀 Quick Install - Setting up local AI...\n"));

  const result = await quickInstall(showProgress);

  if (result.success) {
    console.log(chalk.green.bold("\n✓ Setup Complete!\n"));

    if (result.model) {
      console.log(chalk.dim(`Installed: ${result.model.displayName}`));
      console.log(
        chalk.dim(`Use with: jarvis message send "Hello!" --model ollama/${result.model.id}`),
      );
    }
  } else {
    console.log(chalk.red.bold("\n✗ Setup Failed\n"));
    console.log(chalk.red(result.message));
    process.exit(1);
  }
}

/**
 * Command: status
 * Check backend status.
 */
async function statusCommand(): Promise<void> {
  console.log(chalk.blue.bold("\n🔧 Backend Status\n"));

  const backendInfo = await getOllamaBackendInfo();

  console.log(chalk.bold("Backend:"), "Ollama");

  if (backendInfo.installed) {
    console.log(chalk.bold("Installed:"), chalk.green("✓ Yes"));
    console.log(chalk.bold("Version:"), backendInfo.version ?? "unknown");
  } else {
    console.log(chalk.bold("Installed:"), chalk.red("✗ No"));
  }

  if (backendInfo.available) {
    console.log(chalk.bold("Status:"), chalk.green("✓ Running"));
    console.log(chalk.bold("URL:"), backendInfo.baseUrl);
  } else {
    console.log(chalk.bold("Status:"), chalk.yellow("⚠ Not Running"));
    if (backendInfo.errorMessage) {
      console.log(chalk.dim(`  ${backendInfo.errorMessage}`));
    }
  }
}

/**
 * Register local models commands.
 */
export function registerLocalModelsCommands(program: Command): void {
  const localModels = program
    .command("local-models")
    .alias("lm")
    .description("Manage local AI models");

  localModels
    .command("info")
    .description("Show system information and model recommendations")
    .action(infoCommand);

  localModels
    .command("list")
    .description("List available or installed models")
    .option("-i, --installed", "List only installed models")
    .action(listCommand);

  localModels
    .command("install <model-id>")
    .description("Install a specific model")
    .option("-q, --quantization <level>", "Quantization level (Q4_0, Q4_K_M, Q5_0, Q8_0, FP16)")
    .action(installCommand);

  localModels
    .command("uninstall <model-id>")
    .description("Uninstall a model")
    .action(uninstallCommand);

  localModels
    .command("quick-install")
    .alias("quick")
    .description("One-click installation of recommended model")
    .action(quickInstallCommand);

  localModels.command("status").description("Check backend status").action(statusCommand);
}
