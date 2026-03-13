#!/bin/bash
set -e

# Lavalink One-Liner Installer for JARVIS Discord Bot
# This script installs Lavalink, ffmpeg, and configures systemd for continuous operation

LAVALINK_VERSION="4.0.7"
LAVALINK_URL="https://github.com/lavalink-devs/Lavalink/releases/download/${LAVALINK_VERSION}/Lavalink.jar"
INSTALL_DIR="/opt/lavalink"
CONFIG_FILE="${INSTALL_DIR}/application.yml"
SERVICE_FILE="/etc/systemd/system/lavalink.service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Lavalink Installer for JARVIS Discord Bot${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for root/sudo privileges
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    echo "Usage: sudo bash install-lavalink.sh"
    exit 1
fi

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
else
    echo -e "${RED}Error: No supported package manager found (apt-get, yum, or dnf)${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] Installing dependencies (Java JRE 17+, ffmpeg, curl)...${NC}"

if [ "$PKG_MANAGER" = "apt-get" ]; then
    apt-get update -qq
    apt-get install -y openjdk-17-jre-headless ffmpeg curl wget
elif [ "$PKG_MANAGER" = "yum" ] || [ "$PKG_MANAGER" = "dnf" ]; then
    $PKG_MANAGER install -y java-17-openjdk-headless ffmpeg curl wget
fi

# Verify Java installation
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java installation failed${NC}"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}Error: Java 17 or higher is required (found version $JAVA_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed (Java $(java -version 2>&1 | awk -F '"' '/version/ {print $2}'))${NC}"

echo -e "${YELLOW}[2/6] Creating installation directory at ${INSTALL_DIR}...${NC}"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${GREEN}✓ Directory created${NC}"

echo -e "${YELLOW}[3/6] Downloading Lavalink ${LAVALINK_VERSION}...${NC}"

# Download Lavalink.jar (skip if already exists)
if [ -f "Lavalink.jar" ]; then
    echo -e "${YELLOW}  Lavalink.jar already exists, skipping download${NC}"
else
    wget -q --show-progress "$LAVALINK_URL" -O Lavalink.jar

    if [ ! -f "Lavalink.jar" ]; then
        echo -e "${RED}Error: Failed to download Lavalink.jar${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Lavalink downloaded successfully${NC}"
fi

echo -e "${YELLOW}[4/6] Creating application.yml configuration...${NC}"

# Create application.yml (only if it doesn't exist)
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}  application.yml already exists, backing up to application.yml.backup${NC}"
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
fi

cat > "$CONFIG_FILE" << 'EOF'
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  server:
    password: "youshallnotpass"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
    filters:
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: LOW
    trackStuckThresholdMs: 10000
    useSeekGhosting: true
    youtubePlaylistLoadLimit: 6
    playerUpdateInterval: 5
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true
    gc-warnings: true

metrics:
  prometheus:
    enabled: false
    endpoint: /metrics

sentry:
  dsn: ""
  environment: ""

logging:
  file:
    path: ./logs/

  level:
    root: INFO
    lavalink: INFO

  logback:
    rollingpolicy:
      max-file-size: 25MB
      max-history: 7
EOF

echo -e "${GREEN}✓ Configuration created${NC}"

echo -e "${YELLOW}[5/6] Creating systemd service...${NC}"

# Create systemd service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Lavalink Music Server for JARVIS Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/java -Xmx2G -jar ${INSTALL_DIR}/Lavalink.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lavalink

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Systemd service created${NC}"

echo -e "${YELLOW}[6/6] Starting and enabling Lavalink service...${NC}"

# Reload systemd daemon
systemctl daemon-reload

# Enable service to start on boot
systemctl enable lavalink.service

# Start the service
systemctl restart lavalink.service

# Wait for service to start
sleep 3

# Check service status
if systemctl is-active --quiet lavalink.service; then
    echo -e "${GREEN}✓ Lavalink service started successfully!${NC}"
else
    echo -e "${RED}Warning: Service may not have started properly${NC}"
    echo "Check logs with: sudo journalctl -u lavalink.service -f"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Installation Complete! ⚡${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Connection Details for JARVIS:${NC}"
echo -e "  • URL: ${YELLOW}localhost:2333${NC}"
echo -e "  • Password: ${YELLOW}youshallnotpass${NC}"
echo ""
echo -e "${GREEN}Environment Variables (add to your shell profile):${NC}"
echo -e "  export LAVALINK_URL=\"localhost:2333\""
echo -e "  export LAVALINK_AUTH=\"youshallnotpass\""
echo ""
echo -e "${GREEN}Service Commands:${NC}"
echo -e "  • Status: ${YELLOW}sudo systemctl status lavalink${NC}"
echo -e "  • Stop: ${YELLOW}sudo systemctl stop lavalink${NC}"
echo -e "  • Start: ${YELLOW}sudo systemctl start lavalink${NC}"
echo -e "  • Restart: ${YELLOW}sudo systemctl restart lavalink${NC}"
echo -e "  • Logs: ${YELLOW}sudo journalctl -u lavalink -f${NC}"
echo ""
echo -e "${GREEN}Configuration Files:${NC}"
echo -e "  • Config: ${YELLOW}${CONFIG_FILE}${NC}"
echo -e "  • Service: ${YELLOW}${SERVICE_FILE}${NC}"
echo -e "  • Logs: ${YELLOW}${INSTALL_DIR}/logs/${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "  1. Configure JARVIS Discord bot to connect to Lavalink"
echo "  2. Set environment variables (LAVALINK_URL, LAVALINK_AUTH)"
echo "  3. Restart JARVIS gateway"
echo "  4. Test music playback with /music command"
echo ""
echo -e "${GREEN}The service will automatically start on system reboot! ⚡✨${NC}"
echo ""
