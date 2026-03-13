#!/bin/bash
#
# Fix gateway /client/id error after openclaw → jarvis rebranding
#

set -e

echo "🔧 JARVIS Gateway Client ID Fix"
echo "================================"
echo ""

# Check if config directory exists
if [ ! -d "$HOME/.jarvis" ]; then
    echo "⚠️  ~/.jarvis directory not found. Creating..."
    mkdir -p "$HOME/.jarvis"
fi

# Check for old openclaw config
if [ -d "$HOME/.openclaw" ]; then
    echo "📦 Found old ~/.openclaw directory"
    read -p "   Migrate to ~/.jarvis? (y/n): " migrate
    if [ "$migrate" = "y" ]; then
        echo "   Copying config..."
        cp -r "$HOME/.openclaw/"* "$HOME/.jarvis/" 2>/dev/null || true
        echo "   ✅ Migrated"
    fi
fi

# Check config.yaml
CONFIG_FILE="$HOME/.jarvis/config.yaml"

if [ -f "$CONFIG_FILE" ]; then
    echo "📝 Found config at $CONFIG_FILE"

    # Check for openclaw references
    if grep -q "openclaw" "$CONFIG_FILE" 2>/dev/null; then
        echo "   ⚠️  Found 'openclaw' references in config"

        # Backup
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        echo "   💾 Created backup: $CONFIG_FILE.backup.*"

        # Replace openclaw with jarvis
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's/openclaw/jarvis/g' "$CONFIG_FILE"
            sed -i '' 's/OpenClaw/Jarvis/g' "$CONFIG_FILE"
        else
            # Linux
            sed -i 's/openclaw/jarvis/g' "$CONFIG_FILE"
            sed -i 's/OpenClaw/Jarvis/g' "$CONFIG_FILE"
        fi

        echo "   ✅ Updated config file"
    else
        echo "   ✅ No openclaw references found"
    fi
else
    echo "ℹ️  No existing config file found (this is normal for new installs)"
fi

# Clear credentials cache
CREDS_DIR="$HOME/.jarvis/credentials"
if [ -d "$CREDS_DIR" ]; then
    echo "🗑️  Clearing cached credentials..."
    rm -rf "$CREDS_DIR"
    mkdir -p "$CREDS_DIR"
    echo "   ✅ Credentials cleared"
fi

# Clear sessions cache (optional)
read -p "🗑️  Clear session cache? This will log out all sessions (y/n): " clear_sessions
if [ "$clear_sessions" = "y" ]; then
    SESSIONS_DIR="$HOME/.jarvis/sessions"
    if [ -d "$SESSIONS_DIR" ]; then
        rm -rf "$SESSIONS_DIR"
        mkdir -p "$SESSIONS_DIR"
        echo "   ✅ Sessions cleared"
    fi
fi

echo ""
echo "✨ Fix complete!"
echo ""
echo "Next steps:"
echo "1. Start the gateway: jarvis gateway run"
echo "2. Or configure client ID manually: jarvis config set gateway.clientId cli"
echo ""
echo "Valid client IDs:"
echo "  - cli"
echo "  - jarvis-macos"
echo "  - jarvis-ios"
echo "  - jarvis-android"
echo "  - webchat-ui"
echo "  - jarvis-control-ui"
echo ""
