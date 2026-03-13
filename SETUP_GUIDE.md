# JARVIS Setup Guide

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm
- Git

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Build the project:**

   ```bash
   pnpm build
   ```

3. **Run Jarvis CLI:**
   ```bash
   pnpm jarvis --help
   # or after global install:
   jarvis --help
   ```

---

## Fixing the `/client/id` Gateway Error

**Problem:** `invalid connect params: at /client/id: must be equal to constant`

**Cause:** The gateway expects a valid client ID from a predefined list. After rebranding from "openclaw" to "jarvis", any old config or cached client IDs may be invalid.

**Valid Client IDs** (from `src/gateway/protocol/client-info.ts`):

- `webchat-ui`
- `jarvis-control-ui`
- `webchat`
- `cli`
- `gateway-client`
- `jarvis-macos`
- `jarvis-ios`
- `jarvis-android`
- `node-host`
- `test`
- `fingerprint`
- `jarvis-probe`

**Solution:**

1. **Check your config:**

   ```bash
   cat ~/.jarvis/config.yaml
   ```

2. **If you see old "openclaw" references, update them:**

   ```bash
   jarvis config set gateway.clientId cli
   # or whatever client type you're using
   ```

3. **Clear cached credentials:**

   ```bash
   rm -rf ~/.jarvis/credentials/
   ```

4. **Restart the gateway:**

   ```bash
   jarvis gateway run
   ```

5. **If connecting from a different client (web UI, mobile app), ensure it's using a valid client ID from the list above.**

---

## Discord Setup

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give it a name (e.g., "JARVIS")
4. Go to the **"Bot"** tab
5. Click **"Add Bot"**
6. **Copy the bot token** (you'll need this)

### 2. Configure Bot Permissions

In the **"Bot"** tab:

- Enable **"Message Content Intent"** (required for reading messages)
- Enable **"Server Members Intent"** (if you need member info)
- Enable **"Presence Intent"** (if you need presence data)

### 3. Invite Bot to Your Server

1. Go to **"OAuth2" → "URL Generator"**
2. Select scopes:
   - `bot`
   - `applications.commands`
3. Select permissions:
   - Read Messages/View Channels
   - Send Messages
   - Send Messages in Threads
   - Embed Links
   - Attach Files
   - Read Message History
   - Add Reactions
   - Use Slash Commands
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### 4. Configure JARVIS

```bash
# Set Discord bot token
jarvis config set discord.token "YOUR_BOT_TOKEN_HERE"

# Enable Discord channel
jarvis config set discord.enabled true

# Set command prefix (optional, default is !)
jarvis config set discord.prefix "!"

# Set allowed channels (optional, leave empty for all)
jarvis config set discord.channels "[]"

# Set allowed users (optional, leave empty for all)
jarvis config set discord.allowedUsers "[]"
```

### 5. Start Gateway with Discord

```bash
jarvis gateway run
```

### 6. Test Your Bot

In Discord, try:

- `@JARVIS hello` - Mention the bot
- `!help` - Use command prefix (if configured)

---

## Using Local Models

JARVIS supports running local AI models via Ollama or other providers.

### Option 1: Ollama (Recommended)

#### Install Ollama

**macOS/Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai](https://ollama.ai)

#### Pull a Model

```bash
# Recommended models:
ollama pull llama3.2         # Fast, 3B params
ollama pull llama3.2:8b      # Balanced, 8B params
ollama pull llama3.2:70b     # Powerful, 70B params
ollama pull codellama        # Code-focused
ollama pull mistral          # Alternative to Llama
```

#### Configure JARVIS to Use Ollama

```bash
# Set default provider to Ollama
jarvis config set ai.provider ollama

# Set Ollama base URL (default: http://localhost:11434)
jarvis config set ai.ollama.baseUrl "http://localhost:11434"

# Set default model
jarvis config set ai.ollama.model llama3.2

# Optional: Set model parameters
jarvis config set ai.ollama.temperature 0.7
jarvis config set ai.ollama.maxTokens 2048
```

#### Check Local Models

```bash
# List installed models
jarvis local-models list

# Get system info and recommendations
jarvis local-models info

# Install recommended model
jarvis local-models quick-install
```

### Option 2: Other Local Providers

JARVIS may support other local model providers. Check:

```bash
jarvis config schema ai
```

Look for supported providers like:

- `ollama`
- `lmstudio`
- `localai`
- `text-generation-webui`

---

## Testing Your Setup

### 1. Check Gateway Status

```bash
jarvis gateway status
```

### 2. Test AI Response

```bash
jarvis chat "Hello, are you working?"
```

### 3. Check Discord Connection

```bash
jarvis channels status
```

Should show Discord as "connected" or "active"

### 4. Test Local Models

```bash
# Chat with local model
jarvis chat --model ollama/llama3.2 "Write a haiku about AI"
```

---

## Common Issues

### Gateway Won't Start

1. **Check for port conflicts:**

   ```bash
   lsof -i :18789
   ```

2. **Check logs:**

   ```bash
   jarvis gateway logs
   ```

3. **Reset config:**
   ```bash
   jarvis config reset
   ```

### Discord Bot Not Responding

1. **Verify token:**

   ```bash
   jarvis config get discord.token
   ```

2. **Check bot is online in Discord**

3. **Verify intents are enabled in Discord Developer Portal**

4. **Check logs:**
   ```bash
   jarvis gateway logs --filter discord
   ```

### Local Models Not Working

1. **Verify Ollama is running:**

   ```bash
   curl http://localhost:11434/api/version
   ```

2. **List available models:**

   ```bash
   ollama list
   ```

3. **Test Ollama directly:**

   ```bash
   ollama run llama3.2 "Hello"
   ```

4. **Check JARVIS config:**
   ```bash
   jarvis config get ai
   ```

---

## Configuration Files

- Main config: `~/.jarvis/config.yaml`
- Credentials: `~/.jarvis/credentials/`
- Sessions: `~/.jarvis/sessions/`
- Logs: `~/.jarvis/logs/`

---

## Getting Help

1. **Check documentation:**

   ```bash
   jarvis --help
   jarvis gateway --help
   jarvis config --help
   ```

2. **View config schema:**

   ```bash
   jarvis config schema
   ```

3. **Run doctor for diagnostics:**
   ```bash
   jarvis doctor
   ```

---

## Next Steps

1. ✅ Fix gateway connection
2. ✅ Set up Discord bot
3. ✅ Install local models
4. 🎯 Configure channels (Telegram, Slack, etc.)
5. 🎯 Set up web UI
6. 🎯 Configure agents and skills
7. 🎯 Explore advanced features

---

**Note:** This guide assumes you've completed the rebranding from "openclaw" to "jarvis". If you encounter references to "openclaw" in config files or logs, update them to "jarvis".
