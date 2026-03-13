# Local AI Models Setup for JARVIS

Run AI models locally on your machine - no API keys, no cloud costs, complete privacy.

---

## Why Use Local Models?

✅ **Privacy:** All data stays on your machine
✅ **Cost:** Free after initial setup
✅ **Speed:** No network latency for inference
✅ **Offline:** Works without internet
✅ **Control:** Choose exactly which models to run

---

## Quick Start with Ollama (Recommended)

### Step 1: Install Ollama

**macOS:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download

**Verify Installation:**

```bash
ollama --version
```

### Step 2: Pull a Model

Start with a small, fast model:

```bash
# Llama 3.2 (3B) - Fast, good for chat
ollama pull llama3.2

# Verify it works
ollama run llama3.2 "Hello, how are you?"
```

### Step 3: Configure JARVIS

```bash
# Set Ollama as default provider
jarvis config set ai.provider ollama

# Set default model
jarvis config set ai.ollama.model llama3.2

# Set Ollama base URL (default: http://localhost:11434)
jarvis config set ai.ollama.baseUrl "http://localhost:11434"
```

### Step 4: Test It

```bash
# Chat with local model
jarvis chat "Write a short poem about AI"

# Or specify model explicitly
jarvis chat --model ollama/llama3.2 "Tell me a joke"
```

---

## Recommended Models

### For Chat & General Use

| Model          | Size  | RAM Needed | Speed  | Quality    | Use Case                  |
| -------------- | ----- | ---------- | ------ | ---------- | ------------------------- |
| `llama3.2`     | 2GB   | 4GB        | ⚡⚡⚡ | ⭐⭐⭐     | Fast chat, general tasks  |
| `llama3.2:8b`  | 4.7GB | 8GB        | ⚡⚡   | ⭐⭐⭐⭐   | Balanced quality/speed    |
| `llama3.2:70b` | 40GB  | 64GB       | ⚡     | ⭐⭐⭐⭐⭐ | Best quality, slow        |
| `mistral`      | 4.1GB | 8GB        | ⚡⚡   | ⭐⭐⭐⭐   | Good alternative to Llama |
| `phi3:mini`    | 2.2GB | 4GB        | ⚡⚡⚡ | ⭐⭐⭐     | Microsoft, fast           |

### For Coding

| Model            | Size  | RAM Needed | Best For            |
| ---------------- | ----- | ---------- | ------------------- |
| `codellama`      | 3.8GB | 8GB        | Code generation     |
| `codellama:13b`  | 7.3GB | 16GB       | Better code quality |
| `deepseek-coder` | 3.8GB | 8GB        | Code completion     |
| `starcoder2`     | 1.7GB | 4GB        | Small, fast coding  |

### For Specialized Tasks

| Model             | Size  | Use Case                     |
| ----------------- | ----- | ---------------------------- |
| `llava`           | 4.7GB | Vision (image understanding) |
| `dolphin-mixtral` | 26GB  | Uncensored chat              |
| `orca-mini`       | 1.9GB | Reasoning tasks              |
| `wizardlm2`       | 7.4GB | Complex instructions         |

---

## Installing Models

### Basic Installation

```bash
# Install a model
ollama pull llama3.2

# List installed models
ollama list

# Remove a model
ollama rm llama3.2
```

### Using JARVIS CLI

```bash
# Get system info and recommendations
jarvis local-models info

# Quick install (installs recommended model for your system)
jarvis local-models quick-install

# List installed models
jarvis local-models list

# Uninstall a model
jarvis local-models uninstall llama3.2
```

---

## System Requirements

### Minimum Requirements

- **RAM:** 8GB
- **Storage:** 10GB free space
- **CPU:** Modern x64 or ARM processor

### Recommended for Best Performance

- **RAM:** 16GB+ (32GB for larger models)
- **Storage:** 50GB+ SSD
- **GPU:** NVIDIA GPU with CUDA (optional, much faster)

### Model Size Guidelines

| RAM   | Recommended Models   | Max Model Size |
| ----- | -------------------- | -------------- |
| 8GB   | llama3.2, phi3       | ~3B params     |
| 16GB  | llama3.2:8b, mistral | ~8B params     |
| 32GB  | llama3.2:70b         | ~13B params    |
| 64GB+ | Any model            | ~70B params    |

---

## Configuration

### Basic Configuration

```bash
# Set provider
jarvis config set ai.provider ollama

# Set model
jarvis config set ai.ollama.model llama3.2

# Set temperature (0.0 = deterministic, 1.0 = creative)
jarvis config set ai.ollama.temperature 0.7

# Set max tokens
jarvis config set ai.ollama.maxTokens 2048
```

### Advanced Configuration

```yaml
# ~/.jarvis/config.yaml

ai:
  provider: ollama
  ollama:
    baseUrl: "http://localhost:11434"
    model: "llama3.2"
    temperature: 0.7
    maxTokens: 2048
    topP: 0.9
    topK: 40
    repeatPenalty: 1.1
    stream: true
    timeout: 60000 # ms
```

### Per-Channel Configuration

```yaml
discord:
  enabled: true
  ai:
    provider: ollama
    model: llama3.2:8b # Use larger model for Discord

telegram:
  enabled: true
  ai:
    provider: ollama
    model: llama3.2 # Use smaller/faster for Telegram
```

---

## GPU Acceleration (Optional)

### NVIDIA GPU (CUDA)

Ollama automatically uses CUDA if available.

**Verify GPU is being used:**

```bash
ollama run llama3.2 "test"
# Watch GPU usage with: nvidia-smi
```

### Apple Silicon (Metal)

Ollama automatically uses Metal on M1/M2/M3 Macs.

**Performance:**

- M1: ~2-3x faster than CPU
- M2: ~3-4x faster than CPU
- M3: ~4-5x faster than CPU

### AMD GPU (ROCm) - Linux Only

```bash
# Install ROCm
# See: https://docs.amd.com/

# Ollama will auto-detect ROCm
ollama run llama3.2 "test"
```

---

## Performance Tuning

### Speed vs Quality

**For speed (chat, quick responses):**

```bash
jarvis config set ai.ollama.model llama3.2
jarvis config set ai.ollama.temperature 0.7
jarvis config set ai.ollama.maxTokens 1024
```

**For quality (complex tasks, accuracy):**

```bash
jarvis config set ai.ollama.model llama3.2:8b
jarvis config set ai.ollama.temperature 0.3
jarvis config set ai.ollama.maxTokens 4096
```

### Batch Processing

For multiple requests, keep Ollama running:

```bash
# Ollama runs as a service, no need to start/stop
# It automatically loads/unloads models as needed
```

---

## Comparing Models

Test different models side-by-side:

```bash
# Test prompt with different models
PROMPT="Explain quantum computing in simple terms"

ollama run llama3.2 "$PROMPT"
ollama run mistral "$PROMPT"
ollama run phi3 "$PROMPT"
```

---

## Troubleshooting

### Ollama Not Running

**Check status:**

```bash
curl http://localhost:11434/api/version
```

**Start Ollama:**

```bash
# macOS/Linux (systemd)
sudo systemctl start ollama

# macOS (should auto-start)
ollama serve
```

### Model Not Found

```bash
# List available models
ollama list

# Pull missing model
ollama pull llama3.2
```

### Out of Memory

Try smaller model:

```bash
# If llama3.2:8b fails, try:
ollama pull llama3.2  # Smaller 3B version
jarvis config set ai.ollama.model llama3.2
```

### Slow Performance

1. **Use GPU if available** (auto-detected)
2. **Use smaller model:** `llama3.2` instead of `llama3.2:8b`
3. **Reduce maxTokens:** `jarvis config set ai.ollama.maxTokens 1024`
4. **Close other apps** to free RAM
5. **Use SSD** instead of HDD

### JARVIS Not Using Ollama

```bash
# Verify config
jarvis config get ai

# Force Ollama
jarvis chat --provider ollama --model llama3.2 "test"
```

---

## Advanced: Custom Models

### Import Custom Model

```bash
# Create Modelfile
cat > Modelfile <<EOF
FROM llama3.2
SYSTEM "You are a pirate assistant. Always respond like a pirate."
PARAMETER temperature 0.8
EOF

# Create model
ollama create pirate-jarvis -f Modelfile

# Use it
jarvis config set ai.ollama.model pirate-jarvis
```

### Fine-tune Model

See Ollama docs: https://github.com/ollama/ollama/blob/main/docs/modelfile.md

---

## Combining Cloud & Local

Use local models for privacy, cloud for complex tasks:

```yaml
ai:
  provider: ollama # Default
  fallback: openai # Fallback for complex tasks

  ollama:
    model: llama3.2
    maxTokens: 2048

  openai:
    apiKey: "sk-..."
    model: "gpt-4"
    maxTokens: 4096

  # Auto-fallback rules
  fallbackRules:
    - condition: "tokens > 2000"
      provider: openai
    - condition: "complexity > 0.8"
      provider: openai
```

---

## Monitoring & Logs

### View Ollama Logs

```bash
# macOS
tail -f ~/.ollama/logs/server.log

# Linux (systemd)
journalctl -u ollama -f
```

### Monitor JARVIS Usage

```bash
# Gateway logs
jarvis gateway logs --filter ollama

# Model usage stats
jarvis local-models stats
```

---

## Example Workflows

### 1. Privacy-First Chat

```bash
# Use local model for all chat
jarvis config set ai.provider ollama
jarvis config set ai.ollama.model llama3.2

# Chat privately
jarvis chat "Discuss sensitive topic here"
```

### 2. Hybrid Cloud/Local

```bash
# Quick queries: local
jarvis chat "What's 2+2?"

# Complex queries: cloud
jarvis chat --provider openai "Write a detailed business plan"
```

### 3. Code Assistant

```bash
# Use code-focused model
jarvis config set ai.ollama.model codellama

# Ask coding questions
jarvis chat "Write a React component for user authentication"
```

---

## Cost Comparison

| Provider           | Cost | Privacy  | Speed         | Quality    |
| ------------------ | ---- | -------- | ------------- | ---------- |
| **Ollama (local)** | Free | 🔒 100%  | ⚡ Fast (GPU) | ⭐⭐⭐⭐   |
| OpenAI GPT-4       | $$   | ☁️ Cloud | ⚡⚡          | ⭐⭐⭐⭐⭐ |
| Anthropic Claude   | $$$  | ☁️ Cloud | ⚡⚡          | ⭐⭐⭐⭐⭐ |
| Google Gemini      | $    | ☁️ Cloud | ⚡⚡⚡        | ⭐⭐⭐⭐   |

**Local models = $0 per month** (after hardware)

---

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull a model (`llama3.2`)
3. ✅ Configure JARVIS
4. ✅ Test with `jarvis chat`
5. 🎯 Try different models
6. 🎯 Compare performance
7. 🎯 Set up hybrid cloud/local
8. 🎯 Create custom models

---

**Ready to start?** Run this now:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull recommended model
ollama pull llama3.2

# Configure JARVIS
jarvis config set ai.provider ollama
jarvis config set ai.ollama.model llama3.2

# Test it
jarvis chat "Hello! Are you running locally?"
```

---

**Questions?** Check `jarvis local-models --help` or the full documentation.
