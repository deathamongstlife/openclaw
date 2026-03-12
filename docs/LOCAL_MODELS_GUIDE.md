# Local Models Guide

Run AI models completely offline on your own hardware with Jarvis's local model support.

## Overview

Jarvis supports running AI models locally on your machine, providing:

- **🔒 Complete Privacy**: All inference happens on your hardware
- **💰 Zero API Costs**: No per-token charges
- **⚡ Low Latency**: No network round-trips
- **🌐 Offline Capability**: Works without internet connection
- **🎯 Full Control**: Choose your models and quantization levels

## Quick Start

### One-Command Installation

```bash
curl -fsSL https://openclaw.ai/install-local.sh | bash
```

This script will:
1. Install Ollama (if not present)
2. Detect your system resources
3. Recommend and install an appropriate model
4. Configure Jarvis automatically
5. Test the installation

### Manual Installation

1. **Install Ollama**

   ```bash
   # macOS
   brew install ollama

   # Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows
   # Download from https://ollama.com/download
   ```

2. **Start Ollama Server**

   ```bash
   ollama serve
   ```

3. **Pull a Model**

   ```bash
   # Fast 3B model (4GB RAM minimum)
   ollama pull llama3.2:3b

   # Balanced 70B model (48GB RAM recommended)
   ollama pull llama3.3:70b

   # Reasoning model (8GB RAM minimum)
   ollama pull deepseek-r1:8b
   ```

4. **Configure Jarvis**

   ```bash
   jarvis config set agents.defaults.model ollama/llama3.2:3b
   ```

5. **Test It**

   ```bash
   jarvis message send "Hello! Are you running locally?"
   ```

## Supported Models

Jarvis includes pre-configured support for popular local models:

### Small Models (4-8GB RAM)

| Model | Size | Best For | Context |
|-------|------|----------|---------|
| **Llama 3.2 3B** | 3B | Fast responses, efficient systems | 128K |
| **DeepSeek R1 8B** | 8B | Reasoning tasks | 64K |
| **Llama 3.1 8B** | 8B | General purpose, balanced | 128K |

### Medium Models (16-32GB RAM)

| Model | Size | Best For | Context |
|-------|------|----------|---------|
| **Phi-4 14B** | 14B | Reasoning, efficient performance | 16K |
| **Mistral Small 22B** | 22B | Balanced quality and speed | 32K |
| **Gemma 2 27B** | 27B | Instruction following | 8K |

### Large Models (48GB+ RAM)

| Model | Size | Best For | Context |
|-------|------|----------|---------|
| **Llama 3.3 70B** | 70B | Highest quality, best reasoning | 128K |
| **Qwen 2.5 72B** | 72B | Multilingual, coding | 128K |

## System Requirements

### Hardware Recommendations

**Minimum (CPU-only):**
- 8GB RAM
- 4 CPU cores
- 20GB disk space
- Recommended: Llama 3.2 3B

**Recommended (CPU-only):**
- 16GB RAM
- 8 CPU cores
- 50GB disk space
- Recommended: Phi-4 14B or Llama 3.1 8B

**High-End (GPU-accelerated):**
- 32GB+ RAM
- 24GB+ VRAM (NVIDIA/AMD GPU)
- 100GB disk space
- Recommended: Llama 3.3 70B or Qwen 2.5 72B

### GPU Support

Jarvis automatically detects and uses GPU acceleration when available:

**Supported GPUs:**
- NVIDIA (CUDA) - RTX 3090/4090, A100, H100
- AMD (ROCm) - RX 7900 XTX, MI250, MI300
- Apple Silicon - M1/M2/M3 (Metal)
- Intel Arc (experimental)

**VRAM Requirements:**
- 3B models: 2-4GB VRAM
- 8B models: 4-8GB VRAM
- 14B models: 8-12GB VRAM
- 70B models: 24-48GB VRAM (depending on quantization)

## Quantization

Quantization reduces model size and memory requirements while maintaining quality:

| Quantization | Size Reduction | Quality | Use Case |
|-------------|----------------|---------|----------|
| **FP16** | Baseline | 100% | Maximum quality, research |
| **Q8_0** | 50% | ~99% | High quality, recommended for GPU |
| **Q5_K_M** | 65% | ~98% | Balanced quality/size |
| **Q4_K_M** | 75% | ~95% | Standard, best compatibility |
| **Q4_0** | 75% | ~93% | Smallest, CPU-friendly |

### Choosing Quantization

The installer automatically recommends quantization based on your system:

```typescript
// Automatic recommendation
const resources = await detectSystemResources();
const quant = recommendQuantization(resources, modelVRAM);

// Manual selection
ollama pull llama3.3:70b-q4_k_m  // 4-bit quantized
ollama pull llama3.3:70b-q8_0    // 8-bit quantized
```

## Backends

Jarvis supports multiple local model backends:

### Ollama (Primary)

**Status:** ✅ Fully Supported

**Features:**
- Easy installation and management
- Automatic model downloads
- GPU acceleration (CUDA, Metal, ROCm)
- OpenAI-compatible API
- Model library with popular models

**Usage:**
```bash
# Install models
ollama pull llama3.3:70b

# List installed models
ollama list

# Remove a model
ollama rm llama3.3:70b

# Check status
curl http://localhost:11434/api/tags
```

### LM Studio (Coming Soon)

**Status:** 🚧 Planned

- GUI-based model management
- LoRA support
- Prompt templates

### llama.cpp (Coming Soon)

**Status:** 🚧 Planned

- Direct GGUF file support
- Maximum performance
- Custom model support

### vLLM (Coming Soon)

**Status:** 🚧 Planned

- High-throughput inference
- Multi-GPU support
- Tensor parallelism

## Configuration

### Jarvis Config

Configure local models in `~/.openclaw/config.json`:

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/v1",
        "api": "ollama",
        "apiKey": "OLLAMA_API_KEY",
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

### Environment Variables

```bash
# Ollama API endpoint (default: http://localhost:11434)
export OLLAMA_HOST=http://localhost:11434

# GPU selection (CUDA)
export CUDA_VISIBLE_DEVICES=0

# Number of GPU layers (for partial GPU offloading)
export OLLAMA_NUM_GPU=35

# Keep models loaded in memory
export OLLAMA_KEEP_ALIVE=5m
```

### Per-Model Configuration

```bash
# Set context window
ollama run llama3.2:3b --num-ctx 32768

# Set temperature
jarvis config set agents.defaults.temperature 0.7

# Enable reasoning mode
jarvis config set agents.defaults.reasoning true
```

## Advanced Usage

### Multiple Models

Run different models for different tasks:

```bash
# Fast model for quick tasks
jarvis config set agents.defaults.model ollama/llama3.2:3b

# Large model for complex tasks
jarvis config set agents.defaults.model.fallback ollama/llama3.3:70b
```

### Custom Models

Import custom GGUF models:

```bash
# Create a Modelfile
cat > Modelfile << EOF
FROM /path/to/model.gguf
PARAMETER temperature 0.7
PARAMETER num_ctx 8192
TEMPLATE """{{ .System }}
{{ .Prompt }}"""
EOF

# Create the model
ollama create my-custom-model -f Modelfile

# Use in Jarvis
jarvis config set agents.defaults.model ollama/my-custom-model
```

### Performance Tuning

**CPU Optimization:**
```bash
# Set thread count
export OMP_NUM_THREADS=8
export OPENBLAS_NUM_THREADS=8

# Use all cores
ollama run llama3.2:3b --num-thread 8
```

**GPU Optimization:**
```bash
# Partial GPU offloading (if VRAM is limited)
export OLLAMA_NUM_GPU=20  # Offload 20 layers to GPU

# Multi-GPU (coming soon)
export CUDA_VISIBLE_DEVICES=0,1
```

## Troubleshooting

### Model Won't Load

**Symptom:** "Out of memory" or model fails to start

**Solution:**
1. Check available RAM: `free -h` (Linux) or Activity Monitor (macOS)
2. Try a smaller model or lower quantization
3. Close other applications
4. Use partial GPU offloading: `export OLLAMA_NUM_GPU=20`

### Slow Performance

**Symptom:** Responses take too long

**Solution:**
1. Check GPU is detected: `nvidia-smi` or `system_profiler SPDisplaysDataType`
2. Verify GPU acceleration: Look for "metal" or "cuda" in ollama logs
3. Use a smaller model for faster responses
4. Increase thread count for CPU inference

### Ollama Connection Issues

**Symptom:** "Failed to connect to Ollama"

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama server
ollama serve

# Check firewall (if using remote Ollama)
sudo ufw allow 11434
```

### Model Download Fails

**Symptom:** Download interrupted or fails

**Solution:**
```bash
# Resume download
ollama pull llama3.2:3b

# Use specific registry
export OLLAMA_REGISTRY=https://registry.ollama.ai

# Check disk space
df -h
```

## Migration from Cloud Models

### Gradual Migration

1. **Start with small models** for testing
2. **Use local for development** (fast iteration, no costs)
3. **Keep cloud as fallback** for production critical tasks
4. **Monitor quality** and adjust based on needs

### Cost Savings Example

**Scenario:** 1M tokens/month

| Provider | Cost/Month | Local Model | Savings |
|----------|------------|-------------|---------|
| OpenAI GPT-4 | $150 | Llama 3.3 70B | $150/mo |
| Anthropic Claude | $120 | Qwen 2.5 72B | $120/mo |
| Google Gemini | $70 | Phi-4 14B | $70/mo |

**Break-even:** Hardware costs typically pay for themselves in 2-4 months.

## Best Practices

1. **Match model to task**: Use small models for simple tasks, large for complex
2. **Monitor resources**: Keep an eye on RAM/VRAM usage
3. **Update regularly**: New models and quantizations improve regularly
4. **Benchmark locally**: Test quality vs. cloud for your specific use cases
5. **Keep models warm**: Use `OLLAMA_KEEP_ALIVE=5m` to avoid reload delays

## CLI Commands

```bash
# System info and recommendations
jarvis local-models info

# Install recommended model
jarvis local-models quick-install

# Install specific model
jarvis local-models install llama3.3:70b

# List installed models
jarvis local-models list

# Uninstall a model
jarvis local-models uninstall llama3.2:3b

# Test a model
jarvis local-models test llama3.2:3b

# Check backend status
jarvis local-models status
```

## Resources

- **Ollama Models:** https://ollama.com/library
- **Model Leaderboard:** https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard
- **Quantization Guide:** https://github.com/ggerganov/llama.cpp/blob/master/examples/quantize/README.md
- **Hardware Recommendations:** https://docs.openclaw.ai/hardware

## Next Steps

- [Configure Multiple Models](./configuration.md)
- [Optimize Performance](./performance.md)
- [Deploy in Production](./deployment.md)
- [Contribute Models](./contributing.md)
