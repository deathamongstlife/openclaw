# JARVIS Quick Start

Welcome to JARVIS - your personal AI assistant! 🤖⚡

---

## 🚀 Getting Started in 3 Steps

### 1️⃣ Install & Build

```bash
# Install dependencies
pnpm install  # or: npm install

# Build the project
pnpm build

# Verify installation
pnpm jarvis --version
```

### 2️⃣ Fix Gateway (if you see `/client/id` error)

```bash
# Run the fix script
./fix-gateway-client-id.sh

# Or manually:
jarvis config set gateway.clientId cli
rm -rf ~/.jarvis/credentials/
```

### 3️⃣ Start Gateway

```bash
jarvis gateway run
```

---

## 📚 Detailed Guides

### Core Setup

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete installation and configuration guide
- **[fix-gateway-client-id.sh](./fix-gateway-client-id.sh)** - Script to fix gateway connection issues

### Integrations

- **[DISCORD_SETUP.md](./DISCORD_SETUP.md)** - Set up Discord bot (5 minutes)
- **[LOCAL_MODELS_SETUP.md](./LOCAL_MODELS_SETUP.md)** - Run AI models locally with Ollama

---

## ⚡ Quick Commands

```bash
# Gateway
jarvis gateway run                    # Start gateway
jarvis gateway status                 # Check status
jarvis gateway logs                   # View logs

# Chat
jarvis chat "Hello!"                  # Chat with AI
jarvis chat --model ollama/llama3.2   # Use local model

# Configuration
jarvis config get                     # View all config
jarvis config set KEY VALUE           # Set config value
jarvis config schema                  # View config schema

# Channels
jarvis channels status                # Check channel status
jarvis discord setup                  # Discord setup wizard
jarvis telegram setup                 # Telegram setup wizard

# Local Models
jarvis local-models info              # System info & recommendations
jarvis local-models list              # List installed models
jarvis local-models quick-install     # Install recommended model

# Diagnostics
jarvis doctor                         # Run diagnostics
jarvis --help                         # Show help
```

---

## 🔧 Common Issues & Fixes

### Gateway won't start: `/client/id` error

**Fix:**

```bash
./fix-gateway-client-id.sh
```

**What it does:**

- Migrates config from `~/.openclaw` to `~/.jarvis`
- Updates openclaw references to jarvis
- Clears cached credentials
- Sets valid client ID

### Discord bot not responding

**Checklist:**

1. ✅ Token configured: `jarvis config get discord.token`
2. ✅ Intents enabled in Discord Developer Portal
3. ✅ Bot invited to server with correct permissions
4. ✅ Gateway running: `jarvis gateway status`

**Fix:**

```bash
jarvis channels status
jarvis gateway logs --filter discord
```

See [DISCORD_SETUP.md](./DISCORD_SETUP.md) for detailed setup.

### Local models not working

**Fix:**

```bash
# Check Ollama is running
curl http://localhost:11434/api/version

# Install Ollama if needed
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Configure JARVIS
jarvis config set ai.provider ollama
jarvis config set ai.ollama.model llama3.2
```

See [LOCAL_MODELS_SETUP.md](./LOCAL_MODELS_SETUP.md) for detailed setup.

---

## 🎯 What to Do Next

### 1. Set Up Your First Channel

**Discord** (easiest):

```bash
# Follow DISCORD_SETUP.md
jarvis config set discord.token "YOUR_TOKEN"
jarvis config set discord.enabled true
jarvis gateway run
```

**Telegram, Slack, Signal:** See channel-specific docs

### 2. Choose Your AI Provider

**Local (free, private):**

```bash
# Follow LOCAL_MODELS_SETUP.md
ollama pull llama3.2
jarvis config set ai.provider ollama
```

**Cloud (OpenAI, Anthropic, etc.):**

```bash
jarvis config set ai.provider openai
jarvis config set ai.openai.apiKey "sk-..."
```

### 3. Test It

```bash
# Test gateway
jarvis gateway status

# Test AI
jarvis chat "Hello!"

# Test channels
# Send message to bot in Discord/Telegram/etc.
```

### 4. Explore Advanced Features

- 🎨 **Web UI:** `jarvis web start`
- 🤖 **Agents:** Multi-agent workflows
- 🛠️ **Skills:** Extend bot capabilities
- ⏰ **Cron:** Scheduled tasks
- 🔒 **Secrets:** Secure credential management

---

## 📖 Documentation Structure

```
.
├── QUICK_START.md           ← You are here
├── SETUP_GUIDE.md           ← Complete setup guide
├── DISCORD_SETUP.md         ← Discord bot setup
├── LOCAL_MODELS_SETUP.md    ← Local AI models
├── fix-gateway-client-id.sh ← Fix script
├── README.md                ← Project overview
└── docs/                    ← Full documentation
    ├── channels/            ← Channel-specific docs
    ├── configuration/       ← Config reference
    ├── deployment/          ← Deployment guides
    └── ...
```

---

## 🆘 Getting Help

### In this repository:

1. **Read the guides** above
2. **Run diagnostics:** `jarvis doctor`
3. **Check logs:** `jarvis gateway logs`
4. **Check status:** `jarvis gateway status`

### Community:

- 📝 **Issues:** [GitLab Issues](https://git.allyapp.cc/everest/j.a.r.v.i.s/issues)
- 💬 **Discussions:** Check repository discussions
- 📚 **Docs:** See `docs/` directory

### Quick Debug Commands:

```bash
jarvis doctor                    # Run diagnostics
jarvis gateway status            # Gateway status
jarvis channels status           # Channel status
jarvis config get                # View config
jarvis gateway logs              # View logs
jarvis gateway logs --filter discord  # Discord-specific logs
```

---

## 🎨 JARVIS Theme

After rebranding, JARVIS now features:

- ⚡ Arc Reactor blue color scheme (#00D9FF, #4FC3F7, #0088FF)
- 🎯 Futuristic HUD-style UI
- 🌟 Glowing effects and smooth animations
- 🌙 Dark/Light themes with high contrast

---

## ✅ Checklist

- [ ] Install dependencies (`pnpm install`)
- [ ] Build project (`pnpm build`)
- [ ] Fix gateway if needed (`./fix-gateway-client-id.sh`)
- [ ] Start gateway (`jarvis gateway run`)
- [ ] Set up first channel (Discord, Telegram, etc.)
- [ ] Choose AI provider (local or cloud)
- [ ] Test chat (`jarvis chat "Hello!"`)
- [ ] Explore web UI (`jarvis web start`)

---

**Ready?** Start with:

```bash
# Quick install
pnpm install && pnpm build

# Fix gateway (if needed)
./fix-gateway-client-id.sh

# Start gateway
pnpm jarvis gateway run
```

Then follow [DISCORD_SETUP.md](./DISCORD_SETUP.md) or [LOCAL_MODELS_SETUP.md](./LOCAL_MODELS_SETUP.md)!

---

**Need more help?** Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for the complete guide.
