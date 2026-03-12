# Local Models Quick Start

Get started with local AI models in 60 seconds.

## One-Line Install

```bash
curl -fsSL https://jarvis.ai/install-local.sh | bash
```

Or use the included script:

```bash
./scripts/install-local-models.sh
```

## Quick Commands

```bash
# Check your system and see recommendations
jarvis local-models info

# Install best model for your system automatically
jarvis local-models quick-install

# Install a specific model
jarvis local-models install llama-3.2-3b

# List all available models
jarvis local-models list

# List installed models
jarvis local-models list --installed

# Configure as default
jarvis config set agents.defaults.model ollama/llama3.2:3b

# Test it
jarvis message send "Hello from local AI!"
```

## Model Recommendations

### 🚀 Small & Fast (4-8GB RAM)
```bash
jarvis local-models install llama-3.2-3b
```
- **Best for:** Quick tasks, testing, resource-constrained systems
- **Speed:** ~20-30 tokens/sec (CPU), ~100-150 (GPU)
- **Requirements:** 4GB RAM minimum

### ⚡ Medium & Balanced (16-32GB RAM)
```bash
jarvis local-models install phi-4
```
- **Best for:** General purpose, development, reasoning tasks
- **Speed:** ~10-15 tokens/sec (CPU), ~60-100 (GPU)
- **Requirements:** 12GB RAM minimum

### 💪 Large & Powerful (48GB+ RAM)
```bash
jarvis local-models install llama-3.3-70b
```
- **Best for:** Production, complex tasks, best quality
- **Speed:** ~1-3 tokens/sec (CPU), ~30-50 (GPU)
- **Requirements:** 48GB RAM, 24GB VRAM recommended

## Usage

After installing a model:

```bash
# Set as default
jarvis config set agents.defaults.model ollama/llama3.2:3b

# Or use directly
jarvis message send "Your prompt" --model ollama/llama3.2:3b

# Or in conversation
jarvis chat --model ollama/llama3.2:3b
```

## Common Tasks

### Check Status
```bash
jarvis local-models status
```

### Change Model
```bash
# Install new model
jarvis local-models install qwen2.5-72b

# Switch to it
jarvis config set agents.defaults.model ollama/qwen2.5:72b
```

### Free Up Space
```bash
# List installed models
jarvis local-models list --installed

# Remove unused models
jarvis local-models uninstall llama-3.2-3b
```

### Troubleshooting

**Problem: "Ollama not found"**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or on macOS
brew install ollama
```

**Problem: "Out of memory"**
```bash
# Try a smaller model
jarvis local-models install llama-3.2-3b

# Or check your resources
jarvis local-models info
```

**Problem: "Ollama not running"**
```bash
# Start Ollama server
ollama serve
```

## Direct Ollama Commands

```bash
# List models
ollama list

# Pull a model manually
ollama pull llama3.2:3b

# Remove a model
ollama rm llama3.2:3b

# Test a model
ollama run llama3.2:3b "Hello!"

# Check Ollama status
curl http://localhost:11434/api/tags
```

## Benefits

- 🔒 **100% Private** - Everything runs on your machine
- 💰 **$0 Cost** - No per-token charges
- ⚡ **Fast** - No network latency
- 🌐 **Offline** - Works without internet
- 🎯 **Control** - Pick your models and settings

## Full Documentation

📖 See [LOCAL_MODELS_GUIDE.md](docs/LOCAL_MODELS_GUIDE.md) for complete documentation.

## Model Catalog

| Model | Size | RAM | VRAM | Best For |
|-------|------|-----|------|----------|
| Llama 3.2 3B | 3B | 4GB | 2GB | Fast tasks |
| DeepSeek R1 8B | 8B | 8GB | 4GB | Reasoning |
| Llama 3.1 8B | 8B | 8GB | 4GB | General purpose |
| Phi-4 | 14B | 12GB | 8GB | Balanced |
| Mistral Small | 22B | 16GB | 12GB | Quality |
| Gemma 2 27B | 27B | 20GB | 16GB | Instructions |
| Llama 3.3 70B | 70B | 48GB | 24GB | Best quality |
| Qwen 2.5 72B | 72B | 48GB | 24GB | Multilingual |

## Example Script

Run the included example:

```bash
# See system info and recommendations
node examples/local-models-example.ts
```

## Support

- Issues: https://github.com/deathamongstlife/jarvis/issues
- Docs: https://docs.jarvis.ai/local-models
- Discord: https://discord.gg/jarvis
