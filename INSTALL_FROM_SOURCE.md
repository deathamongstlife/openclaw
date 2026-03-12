# 🚀 J.A.R.V.I.S. Installation from Source

Complete step-by-step guide to install J.A.R.V.I.S. from source, including the Control UI and Android app.

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 22.12.0 or higher
- **pnpm**: Version 10.23.0 or higher
- **Git**: For cloning the repository
- **Operating System**: macOS, Linux, or Windows (via WSL2)

### For Android App
- **Java JDK**: Version 17 (Eclipse Temurin recommended)
- **Android SDK**: Platform 36, Build Tools 36.0.0
- **Android Device/Emulator**: For testing

### Optional
- **Docker**: For containerized deployment
- **Bun**: Alternative to Node.js (faster)

---

## 📥 Step 1: Clone the Repository

```bash
# Clone from GitLab
git clone https://git.allyapp.cc/everest/j.a.r.v.i.s.git
cd j.a.r.v.i.s

# Or if you have SSH configured
git clone git@git.allyapp.cc:everest/j.a.r.v.i.s.git
cd j.a.r.v.i.s
```

---

## 🔧 Step 2: Install Dependencies

### Install pnpm (if not already installed)

```bash
# Using npm
npm install -g pnpm@10.23.0

# Or using Homebrew (macOS/Linux)
brew install pnpm

# Verify installation
pnpm -v  # Should show 10.23.0 or higher
```

### Install Project Dependencies

```bash
# Install all dependencies (this may take 5-10 minutes)
pnpm install

# If you encounter issues, try with frozen lockfile
pnpm install --frozen-lockfile
```

---

## 🏗️ Step 3: Build the Project

### Build Core J.A.R.V.I.S.

```bash
# Build the main project
pnpm build

# Verify build succeeded
ls dist/  # Should contain compiled files
```

### Build Control UI (Web Dashboard)

```bash
# Build the UI
pnpm ui:build

# Or for development with hot reload
pnpm ui:dev
```

The UI will be available at `http://localhost:5173` (development) or served by the gateway (production).

---

## 🤖 Step 4: Build Android App

### Prerequisites Check

```bash
# Verify Java version
java -version  # Should show version 17

# Set ANDROID_HOME (if not already set)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Build Android APK

```bash
# Navigate to Android project
cd apps/android

# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew :app:assembleDebug

# Build release APK (requires signing key)
./gradlew :app:assembleRelease
```

**Output Location:**
- Debug APK: `apps/android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `apps/android/app/build/outputs/apk/release/app-release.apk`

### Install on Device

```bash
# Make sure device is connected via USB or emulator is running
adb devices

# Install the APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Or use the npm script from repo root
cd ../..  # Back to repo root
pnpm android:install
```

---

## ⚙️ Step 5: Configure J.A.R.V.I.S.

### Run Initial Setup

```bash
# Run the onboarding wizard
pnpm jarvis onboard --install-daemon
```

The wizard will guide you through:
1. ✅ Installing the Gateway daemon
2. ✅ Configuring AI model providers
3. ✅ Setting up messaging channels
4. ✅ Creating initial configuration

### Manual Configuration (Alternative)

Create configuration file at `~/.jarvis/config.yaml`:

```yaml
# AI Model Configuration
ai:
  defaultModel: "gpt-4"  # or your preferred model
  providers:
    openai:
      enabled: true
      apiKey: "sk-..."  # Your OpenAI API key

# Gateway Configuration
gateway:
  port: 18789
  host: "127.0.0.1"
  mode: "local"

# Channel Configuration (Discord example)
channels:
  discord:
    enabled: true
    botToken: "YOUR_DISCORD_BOT_TOKEN"
    allowFrom: ["your_user_id"]

# Security
security:
  dmPolicy: "pairing"  # Require pairing for DMs

# Logging
logging:
  level: "info"
  format: "pretty"
```

---

## 🚀 Step 6: Start J.A.R.V.I.S.

### Start the Gateway

```bash
# Start gateway in foreground (for testing)
pnpm jarvis gateway --port 18789 --verbose

# Or start as background daemon
pnpm jarvis gateway --daemon

# Or use the system service (installed during onboarding)
# Gateway will start automatically on system boot
```

### Access the Control UI

1. **Open your browser**: Navigate to `http://localhost:18789`
2. **Dashboard Features:**
   - 📊 Session Browser: View all active conversations
   - 📈 Analytics: Track usage and performance
   - ⚙️ Config Editor: Modify settings in real-time
   - 🔌 Channel Health: Monitor connection status
   - ⏰ Cron Manager: Schedule and monitor automated tasks

---

## 📱 Step 7: Use the Android App

### Connect to Gateway

1. **Open J.A.R.V.I.S. app** on your Android device
2. **Enter Gateway URL**: `http://YOUR_COMPUTER_IP:18789`
   - For local testing: `http://192.168.1.X:18789`
   - For Tailscale: Your Tailscale IP
3. **Authenticate** if required
4. **Start chatting!**

### Troubleshooting Android Connection

```bash
# Check if gateway is accessible from Android device
# On your Android device, open browser and navigate to:
http://YOUR_COMPUTER_IP:18789

# If not accessible, check firewall:
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/jarvis
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /path/to/jarvis

# Linux (ufw)
sudo ufw allow 18789/tcp

# Linux (firewalld)
sudo firewall-cmd --add-port=18789/tcp --permanent
sudo firewall-cmd --reload
```

---

## ✅ Step 8: Verify Installation

### Check Gateway Status

```bash
# Check if gateway is running
pnpm jarvis status

# Check channel status
pnpm jarvis channels status

# Test with a message
pnpm jarvis agent --message "Hello J.A.R.V.I.S.!"
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:extensions

# Check code quality
pnpm check
```

---

## 🎯 Quick Start Examples

### Send Your First Message

```bash
# Via CLI
pnpm jarvis agent --message "What can you help me with?"

# Via Discord (after setup)
# Just @mention the bot in Discord

# Via Telegram (after setup)
# Send a message to your bot
```

### Schedule Automation

```bash
# Schedule a daily morning briefing at 9 AM
pnpm jarvis cron add "0 9 * * *" "agent --message 'Morning briefing' --to telegram"

# List all cron jobs
pnpm jarvis cron list
```

### Use Local Models (Optional)

```bash
# Check system compatibility
pnpm jarvis local-models status

# Install a local model
pnpm jarvis local-models install qwen-2.5-7b

# Use the local model
pnpm jarvis agent --message "Hello!" --model qwen-2.5-7b
```

---

## 🔧 Development Mode

### For Active Development

```bash
# Terminal 1: Start gateway in dev mode
pnpm gateway:dev

# Terminal 2: Start UI in dev mode with hot reload
pnpm ui:dev

# Terminal 3: Watch and rebuild on changes
pnpm build --watch
```

### Android Development

```bash
# Run Android app with instant reload
pnpm android:run

# View Android logs
adb logcat | grep Jarvis
```

---

## 🐛 Troubleshooting

### Common Issues

#### Gateway Won't Start

```bash
# Check if port is in use
lsof -i :18789

# Kill existing process
kill -9 $(lsof -t -i:18789)

# Check logs
tail -f ~/.jarvis/logs/gateway.log
```

#### Build Failures

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules dist
pnpm install
pnpm build
```

#### Android Build Failures

```bash
# Clean Android build
cd apps/android
./gradlew clean
./gradlew :app:assembleDebug

# If SDK issues, install required components
sdkmanager "platforms;android-36" "build-tools;36.0.0"
```

#### UI Not Loading

```bash
# Check if UI is built
ls dist/ui/  # Should contain index.html

# Rebuild UI
pnpm ui:build

# Check gateway serves UI
curl http://localhost:18789
```

---

## 📚 Next Steps

### Essential Reading
- [Configuration Reference](https://docs.jarvis-ai.dev/config/reference)
- [Channel Setup Guides](https://docs.jarvis-ai.dev/channels)
- [Discord Skill Documentation](skills/discord/SKILL.md)
- [Discord New Features](skills/discord/NEW_FEATURES.md)

### Advanced Topics
- [Multi-Agent Routing](https://docs.jarvis-ai.dev/concepts/multi-agent)
- [Custom Skills Development](https://docs.jarvis-ai.dev/development/plugins)
- [Voice Control Setup](https://docs.jarvis-ai.dev/nodes/voice)
- [Docker Deployment](https://docs.jarvis-ai.dev/deployment/docker)

---

## 🆘 Getting Help

### Resources
- **GitLab Issues**: [Report bugs](https://git.allyapp.cc/everest/j.a.r.v.i.s/issues)
- **Documentation**: [docs.jarvis-ai.dev](https://docs.jarvis-ai.dev)
- **Discord**: Join our community server
- **GitLab**: [Repository](https://git.allyapp.cc/everest/j.a.r.v.i.s)

### Before Asking for Help
1. Check logs: `~/.jarvis/logs/`
2. Run diagnostics: `pnpm jarvis doctor`
3. Verify installation: `pnpm jarvis status`
4. Search existing issues on GitLab

---

## 🎉 Success!

You now have:
- ✅ J.A.R.V.I.S. Gateway running
- ✅ Control UI accessible at http://localhost:18789
- ✅ Android app installed and connected
- ✅ Channels configured (Discord, Telegram, etc.)
- ✅ Ready to chat with your AI assistant!

**Welcome to J.A.R.V.I.S.! 🤖**

---

## 📝 Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `pnpm jarvis gateway` | Start the gateway |
| `pnpm jarvis status` | Check system status |
| `pnpm jarvis config show` | View configuration |
| `pnpm jarvis channels status` | Check channel health |
| `pnpm jarvis agent --message "..."` | Send a message |
| `pnpm jarvis cron list` | List scheduled jobs |
| `pnpm jarvis doctor` | Run diagnostics |

### File Locations

| What | Where |
|------|-------|
| Config | `~/.jarvis/config.yaml` |
| Logs | `~/.jarvis/logs/` |
| Sessions | `~/.jarvis/sessions/` |
| Credentials | `~/.jarvis/credentials/` |
| Android APK | `apps/android/app/build/outputs/apk/` |
| UI Build | `dist/ui/` |

### Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Gateway | 18789 | Main control plane & WebSocket |
| UI Dev Server | 5173 | Vite development server |
| Ollama (local models) | 11434 | Local AI model server |

---

Built with ❤️ by the J.A.R.V.I.S. community
