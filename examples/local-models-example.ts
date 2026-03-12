#!/usr/bin/env node
/**
 * Local Models Example
 *
 * This example demonstrates how to use Jarvis's local model support
 * to install and run AI models completely offline.
 */

import {
  getSystemInfo,
  getModelRecommendations,
  installModel,
  quickInstall,
  getOllamaBackendInfo,
  listInstalledModels,
} from "../src/agents/local-models/index.js";

async function main() {
  console.log("🚀 Jarvis Local Models Example\n");

  // Step 1: Check system resources
  console.log("📊 Step 1: Detecting system resources...\n");
  const { resources, formattedResources, recommendations } = await getSystemInfo();

  console.log(formattedResources);
  console.log();

  // Step 2: Check backend status
  console.log("🔧 Step 2: Checking Ollama backend...\n");
  const backendInfo = await getOllamaBackendInfo();

  if (backendInfo.available) {
    console.log(`✅ Ollama ${backendInfo.version} is running`);
  } else if (backendInfo.installed) {
    console.log(`⚠️  Ollama is installed but not running`);
    console.log("   Start it with: ollama serve");
    return;
  } else {
    console.log("❌ Ollama is not installed");
    console.log("   Install from: https://ollama.com/download");
    console.log("   Or run: ./scripts/install-local-models.sh");
    return;
  }
  console.log();

  // Step 3: Show recommendations
  console.log("💡 Step 3: Model recommendations for your system:\n");

  for (let i = 0; i < Math.min(3, recommendations.length); i++) {
    const rec = recommendations[i];
    console.log(`${i + 1}. ${rec.model.displayName} (${rec.model.size})`);
    console.log(`   ${rec.model.description}`);
    console.log(`   Quantization: ${rec.quantization}`);
    console.log(`   Fit Score: ${rec.fitScore}%`);
    console.log(`   ${rec.reason}`);
    console.log();
  }

  // Step 4: Check installed models
  console.log("📦 Step 4: Checking installed models...\n");
  const installed = await listInstalledModels();

  if (installed.length > 0) {
    console.log("Installed models:");
    for (const model of installed) {
      const sizeGB = (model.sizeOnDisk / (1024 ** 3)).toFixed(2);
      console.log(`  ✅ ${model.modelId} (${sizeGB} GB)`);
    }
  } else {
    console.log("No models installed yet");
  }
  console.log();

  // Step 5: Quick install example (commented out to avoid accidental downloads)
  console.log("🎯 Step 5: Quick Install Example\n");
  console.log("To automatically install the recommended model, run:");
  console.log("  jarvis local-models quick-install");
  console.log();
  console.log("Or install a specific model:");
  console.log(`  jarvis local-models install ${recommendations[0]?.model.id}`);
  console.log();

  /*
  // Uncomment to actually install a model:
  console.log("Installing recommended model...");

  const result = await installModel(
    recommendations[0].model.id,
    {
      quantization: recommendations[0].quantization,
    },
    (progress) => {
      const bar = "█".repeat(Math.round(progress.percent / 2));
      const empty = "░".repeat(50 - Math.round(progress.percent / 2));
      process.stdout.write(`\r[${bar}${empty}] ${progress.percent}% - ${progress.status}`);
    }
  );

  console.log();
  if (result.success) {
    console.log("✅ Installation complete!");
    console.log(`Use with: jarvis config set agents.defaults.model ollama/${result.model?.modelId}`);
  } else {
    console.log("❌ Installation failed:", result.message);
  }
  */

  // Step 6: Usage instructions
  console.log("📚 Step 6: Using Local Models\n");
  console.log("After installing a model, configure Jarvis:");
  console.log(`  jarvis config set agents.defaults.model ollama/${recommendations[0]?.model.ollamaModelName}`);
  console.log();
  console.log("Then use it:");
  console.log('  jarvis message send "Hello from local AI!"');
  console.log();
  console.log("Or specify the model directly:");
  console.log(`  jarvis message send "Hello!" --model ollama/${recommendations[0]?.model.ollamaModelName}`);
  console.log();

  // Additional commands
  console.log("🛠️  Useful Commands:\n");
  console.log("  jarvis local-models info         - Show system info");
  console.log("  jarvis local-models list         - List available models");
  console.log("  jarvis local-models list -i      - List installed models");
  console.log("  jarvis local-models status       - Check backend status");
  console.log("  ollama list                        - List Ollama models");
  console.log("  ollama pull <model>                - Download a model");
  console.log("  ollama rm <model>                  - Remove a model");
  console.log();

  console.log("📖 Documentation: docs/LOCAL_MODELS_GUIDE.md");
}

// Run the example
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
