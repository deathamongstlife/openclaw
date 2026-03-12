# Local Models Module

Local model support for Jarvis - run AI models completely offline on your own hardware.

## Overview

This module provides comprehensive support for installing, managing, and running local AI models through Jarvis. It handles:

- **Automatic backend detection and installation** (Ollama, LM Studio, llama.cpp, etc.)
- **System resource detection** (RAM, VRAM, GPU capabilities)
- **Intelligent model recommendations** based on available hardware
- **One-click model installation** with progress tracking
- **Model catalog** with 7+ popular pre-configured models
- **Quantization support** for optimizing memory usage
- **CLI commands** for easy management

## Architecture

```
local-models/
├── types.ts              # TypeScript interfaces and types
├── catalog.ts            # Model catalog with 7+ popular models
├── system-resources.ts   # Hardware detection and recommendations
├── ollama-backend.ts     # Ollama integration (primary backend)
├── installer.ts          # High-level installation and management
├── index.ts              # Public API exports
└── README.md             # This file
```

## Key Components

### 1. Model Catalog (`catalog.ts`)

Pre-configured models with full metadata:

```typescript
import { LOCAL_MODEL_CATALOG, getModelById } from "./catalog.js";

// Get all models
console.log(LOCAL_MODEL_CATALOG);

// Get specific model
const llama = getModelById("llama-3.3-70b");
console.log(llama.displayName); // "Llama 3.3 70B"
console.log(llama.minVRAM); // 24
console.log(llama.capabilities); // ["text", "reasoning", "code"]
```

### 2. System Resources (`system-resources.ts`)

Detect hardware capabilities:

```typescript
import { detectSystemResources, canRunModel } from "./system-resources.js";

// Detect hardware
const resources = await detectSystemResources();
console.log(resources.totalRAM); // 64
console.log(resources.hasGPU); // true
console.log(resources.gpuName); // "NVIDIA RTX 4090"

// Check if model can run
const canRun = canRunModel(resources, 24, 48); // 24GB VRAM, 48GB RAM
console.log(canRun); // true/false
```

### 3. Ollama Backend (`ollama-backend.ts`)

Ollama integration:

```typescript
import {
  isOllamaInstalled,
  installOllama,
  pullOllamaModel,
  listOllamaModels,
} from "./ollama-backend.js";

// Check if installed
const installed = await isOllamaInstalled();

// Install if needed
if (!installed) {
  await installOllama();
}

// Pull a model
await pullOllamaModel("llama3.2:3b", "http://localhost:11434", (progress) => {
  console.log(`${progress.percent}% - ${progress.currentFile}`);
});

// List installed
const models = await listOllamaModels();
```

### 4. Installer (`installer.ts`)

High-level management:

```typescript
import { getSystemInfo, getModelRecommendations, installModel, quickInstall } from "./installer.js";

// Get system info + recommendations
const info = await getSystemInfo();
console.log(info.formattedResources);
console.log(info.recommendations[0]); // Top recommendation

// Install a specific model
await installModel(
  "llama-3.2-3b",
  {
    quantization: "Q4_K_M",
  },
  (progress) => {
    console.log(`${progress.status}: ${progress.percent}%`);
  },
);

// Quick install (automatic)
await quickInstall((progress) => {
  console.log(progress);
});
```

## Usage Examples

### CLI Commands

```bash
# System info and recommendations
jarvis local-models info

# Quick install recommended model
jarvis local-models quick-install

# Install specific model
jarvis local-models install llama-3.3-70b --quantization Q4_K_M

# List available models
jarvis local-models list

# List installed models
jarvis local-models list --installed

# Uninstall a model
jarvis local-models uninstall llama-3.2-3b

# Check backend status
jarvis local-models status
```

### Programmatic Usage

```typescript
import { getSystemInfo, installModel, getModelRecommendations } from "@/agents/local-models";

// Get recommendations
async function setupLocal() {
  const { resources, recommendations } = await getSystemInfo();

  console.log("System Resources:", resources);
  console.log("Top Recommendation:", recommendations[0].model.displayName);

  // Install top recommendation
  const result = await installModel(
    recommendations[0].model.id,
    { quantization: recommendations[0].quantization },
    (progress) => console.log(`${progress.percent}%`),
  );

  if (result.success) {
    console.log("Model installed:", result.model);
  }
}
```

## Model Selection Guide

### Small Models (4-8GB RAM)

- **llama-3.2-3b**: Fast, efficient, good for quick tasks
- **deepseek-r1-8b**: Reasoning-focused
- **llama-3.1-8b**: Balanced general purpose

### Medium Models (16-32GB RAM)

- **phi-4**: Microsoft's efficient 14B reasoning model
- **mistral-small**: 22B balanced model
- **gemma-2-27b**: Google's instruction-following model

### Large Models (48GB+ RAM)

- **llama-3.3-70b**: Meta's flagship, best quality
- **qwen2.5-72b**: Multilingual powerhouse

## Quantization Levels

| Level  | Size     | Quality | Use Case                  |
| ------ | -------- | ------- | ------------------------- |
| FP16   | Baseline | 100%    | Research, maximum quality |
| Q8_0   | 50%      | ~99%    | High-quality production   |
| Q5_K_M | 65%      | ~98%    | Balanced                  |
| Q4_K_M | 75%      | ~95%    | Standard (default)        |
| Q4_0   | 75%      | ~93%    | CPU-friendly              |

## Backend Support

### Currently Supported

- ✅ **Ollama** - Full support with auto-installation

### Coming Soon

- 🚧 **LM Studio** - GUI-based management
- 🚧 **llama.cpp** - Direct GGUF support
- 🚧 **vLLM** - High-throughput inference

## Testing

```bash
# Run all tests
pnpm test src/agents/local-models

# Test specific module
pnpm test src/agents/local-models/catalog.test.ts
pnpm test src/agents/local-models/system-resources.test.ts
```

## Configuration

Models are configured in `~/.jarvis/config.json`:

```json
{
  "models": {
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/v1",
        "api": "ollama",
        "models": [
          {
            "id": "llama3.2:3b",
            "name": "Llama 3.2 3B",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 131072,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "ollama/llama3.2:3b"
    }
  }
}
```

## Environment Variables

```bash
# Ollama endpoint
export OLLAMA_HOST=http://localhost:11434

# GPU selection
export CUDA_VISIBLE_DEVICES=0

# Model keep-alive
export OLLAMA_KEEP_ALIVE=5m
```

## Adding New Models

To add a new model to the catalog:

1. **Add to `catalog.ts`:**

```typescript
{
  id: "new-model-id",
  name: "new-model:tag",
  displayName: "New Model Name",
  description: "Description here",
  size: "7B",
  capabilities: ["text", "code"],
  contextWindow: 32768,
  defaultQuantization: "Q4_K_M",
  supportedQuantizations: ["Q4_0", "Q4_K_M", "Q5_0", "Q8_0"],
  minVRAM: 4,
  minRAM: 8,
  recommendedVRAM: 8,
  recommendedRAM: 16,
  ollamaModelName: "new-model:tag",
  huggingfaceRepo: "org/model-repo",
  licenseType: "MIT"
}
```

2. **Update tests** in `catalog.test.ts`
3. **Update documentation** in `docs/LOCAL_MODELS_GUIDE.md`

## Troubleshooting

### Ollama Not Found

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or use the script
./scripts/install-local-models.sh
```

### Out of Memory

- Try a smaller model
- Use lower quantization (Q4_K_M → Q4_0)
- Close other applications
- Check with: `jarvis local-models info`

### Model Won't Download

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Start if needed
ollama serve

# Retry download
ollama pull llama3.2:3b
```

## Further Reading

- [Local Models Guide](../../../docs/LOCAL_MODELS_GUIDE.md) - Complete user guide
- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) - Ollama API reference
- [Model Catalog](https://ollama.com/library) - Browse available models
