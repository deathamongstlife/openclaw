#!/bin/bash
set -euo pipefail

# Jarvis Caddy Deployment Script
# Deploys from /opt/jarvis using existing Caddy installation
# VPS IP: 85.10.205.112

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🤖 Jarvis Caddy Deployment${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Usage: sudo bash deploy-jarvis-caddy.sh"
   exit 1
fi

REPO_DIR="/opt/jarvis"
WEB_ROOT="/var/www/jarvis"
VPS_IP="85.10.205.112"

# Verify repository exists
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${RED}❌ Repository not found at $REPO_DIR${NC}"
    exit 1
fi

if [ ! -f "$REPO_DIR/install.sh" ]; then
    echo -e "${RED}❌ install.sh not found in $REPO_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found Jarvis repository at $REPO_DIR"
echo ""

# Create web directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p "$WEB_ROOT/public"
mkdir -p "$WEB_ROOT/docs"

# Copy docs
if [ -d "$REPO_DIR/docs" ]; then
    echo -e "${YELLOW}📚 Copying documentation...${NC}"
    cp -r "$REPO_DIR/docs/"* "$WEB_ROOT/docs/"
    echo -e "${GREEN}✓${NC} Documentation copied"
fi

# Copy install script
echo -e "${YELLOW}📥 Copying install script...${NC}"
cp "$REPO_DIR/install.sh" "$WEB_ROOT/"
chmod +x "$WEB_ROOT/install.sh"
echo -e "${GREEN}✓${NC} Install script copied"

# Create landing page
echo -e "${YELLOW}🏠 Creating landing page...${NC}"
cat > "$WEB_ROOT/public/index.html" <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jarvis - Your Personal AI Assistant</title>
  <meta name="description" content="Jarvis - Your own personal AI assistant. Any OS. Any Platform.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container { max-width: 800px; text-align: center; }
    h1 { font-size: 4rem; margin-bottom: 1rem; font-weight: 700; }
    .tagline { font-size: 1.5rem; margin-bottom: 3rem; opacity: 0.9; }
    .install-section {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .install-title { font-size: 1.25rem; margin-bottom: 1rem; font-weight: 600; }
    pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      text-align: left;
    }
    code { color: #00e5cc; font-family: 'Monaco', 'Menlo', monospace; }
    .buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    footer { margin-top: 3rem; opacity: 0.8; font-size: 0.9rem; }
    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
      .tagline { font-size: 1.25rem; }
      pre { font-size: 0.875rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Jarvis</h1>
    <p class="tagline">Your own personal AI assistant. Any OS. Any Platform.</p>

    <div class="install-section">
      <div class="install-title">Quick Install</div>
      <pre><code>curl -fsSL https://jarvis.allyapp.cc/install.sh | bash</code></pre>
    </div>

    <div class="buttons">
      <a href="https://docs.jarvis.allyapp.cc" class="btn">📚 Documentation</a>
      <a href="https://github.com/deathamongstlife/jarvis" class="btn btn-secondary">⭐ GitHub</a>
    </div>

    <footer>
      <p>Built with ❤️ by the Jarvis team</p>
    </footer>
  </div>
</body>
</html>
HTMLEOF

echo -e "${GREEN}✓${NC} Landing page created"

# Create robots.txt
cat > "$WEB_ROOT/public/robots.txt" <<'EOF'
User-agent: *
Allow: /
Sitemap: https://docs.jarvis.allyapp.cc/sitemap.xml
EOF

# Set permissions
chown -R caddy:caddy "$WEB_ROOT" 2>/dev/null || chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true
chmod -R 755 "$WEB_ROOT"

echo -e "${GREEN}✓${NC} Permissions set"
echo ""

# Backup existing Caddyfile
CADDYFILE="/etc/caddy/Caddyfile"
if [ -f "$CADDYFILE" ]; then
    BACKUP_FILE="${CADDYFILE}.backup.$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}📋 Backing up existing Caddyfile to:${NC}"
    echo "    $BACKUP_FILE"
    cp "$CADDYFILE" "$BACKUP_FILE"
fi

echo ""
echo -e "${YELLOW}⚙️  Caddy configuration to add...${NC}"
echo ""
echo -e "${BLUE}Add these blocks to your Caddyfile ($CADDYFILE):${NC}"
echo ""
echo -e "${GREEN}# ─────────────────────────────────────────────────────────${NC}"
cat <<'CADDYEOF'
# Jarvis Documentation
docs.jarvis.allyapp.cc {
    root * /var/www/jarvis/docs
    file_server
    encode gzip

    # Try files with .html extension
    try_files {path} {path}.html {path}/ =404

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    # Custom error page
    handle_errors {
        @404 {
            expression {http.error.status_code} == 404
        }
        rewrite @404 /404.html
        file_server
    }

    # Logging
    log {
        output file /var/log/caddy/jarvis-docs.log
    }
}

# Jarvis Install Script & Landing Page
jarvis.allyapp.cc {
    root * /var/www/jarvis/public
    file_server
    encode gzip

    # Serve install script
    handle /install.sh {
        root * /var/www/jarvis
        file_server
        header Content-Type text/plain
        header Cache-Control "no-cache, must-revalidate"
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }

    # Logging
    log {
        output file /var/log/caddy/jarvis-install.log
    }
}
CADDYEOF
echo -e "${GREEN}# ─────────────────────────────────────────────────────────${NC}"
echo ""

read -p "Would you like me to automatically add this to your Caddyfile? (y/n): " AUTO_ADD

if [[ "$AUTO_ADD" == "y" || "$AUTO_ADD" == "Y" ]]; then
    echo "" >> "$CADDYFILE"
    echo "# Jarvis Configuration - Added $(date)" >> "$CADDYFILE"
    cat >> "$CADDYFILE" <<'CADDYEOF'
# Jarvis Documentation
docs.jarvis.allyapp.cc {
    root * /var/www/jarvis/docs
    file_server
    encode gzip
    try_files {path} {path}.html {path}/ =404
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }
    handle_errors {
        @404 {
            expression {http.error.status_code} == 404
        }
        rewrite @404 /404.html
        file_server
    }
    log {
        output file /var/log/caddy/jarvis-docs.log
    }
}

# Jarvis Install Script & Landing Page
jarvis.allyapp.cc {
    root * /var/www/jarvis/public
    file_server
    encode gzip
    handle /install.sh {
        root * /var/www/jarvis
        file_server
        header Content-Type text/plain
        header Cache-Control "no-cache, must-revalidate"
    }
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
    log {
        output file /var/log/caddy/jarvis-install.log
    }
}
CADDYEOF

    echo -e "${GREEN}✓${NC} Configuration added to Caddyfile"
    echo ""

    # Validate Caddyfile
    echo -e "${YELLOW}🔍 Validating Caddyfile...${NC}"
    if caddy validate --config "$CADDYFILE" 2>&1; then
        echo -e "${GREEN}✓${NC} Caddyfile is valid"

        # Reload Caddy
        echo -e "${YELLOW}🔄 Reloading Caddy...${NC}"
        systemctl reload caddy
        echo -e "${GREEN}✓${NC} Caddy reloaded"
    else
        echo -e "${RED}❌ Caddyfile validation failed${NC}"
        echo "Restoring backup..."
        cp "$BACKUP_FILE" "$CADDYFILE"
        echo -e "${YELLOW}⚠${NC}  Please check your Caddyfile manually"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC}  Skipped automatic configuration"
    echo "Please add the configuration manually to: $CADDYFILE"
    echo "Then run: sudo systemctl reload caddy"
fi

# Create log directory
mkdir -p /var/log/caddy
chown -R caddy:caddy /var/log/caddy 2>/dev/null || chown -R www-data:www-data /var/log/caddy 2>/dev/null || true

echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo -e "1. ${BOLD}Add DNS Records${NC} (at your DNS provider for allyapp.cc):"
echo ""
echo -e "   ${GREEN}Type: A${NC}"
echo -e "   ${GREEN}Name: docs.jarvis${NC}"
echo -e "   ${GREEN}Value: $VPS_IP${NC}"
echo -e "   ${GREEN}TTL: 3600${NC}"
echo ""
echo -e "   ${GREEN}Type: A${NC}"
echo -e "   ${GREEN}Name: jarvis${NC}"
echo -e "   ${GREEN}Value: $VPS_IP${NC}"
echo -e "   ${GREEN}TTL: 3600${NC}"
echo ""
echo -e "2. ${BOLD}Wait for DNS propagation${NC} (5-30 minutes)"
echo ""
echo "   Test DNS:"
echo "   dig docs.jarvis.allyapp.cc +short"
echo "   dig jarvis.allyapp.cc +short"
echo ""
echo -e "3. ${BOLD}SSL Certificates${NC} - ${GREEN}Automatic!${NC}"
echo ""
echo "   Caddy will automatically get Let's Encrypt SSL certificates"
echo "   when your DNS records are live."
echo ""
echo -e "4. ${BOLD}Test Deployment:${NC}"
echo ""
echo "   # After DNS propagates"
echo "   curl -I https://jarvis.allyapp.cc/install.sh"
echo "   curl -I https://docs.jarvis.allyapp.cc"
echo ""
echo "   # Test install script content"
echo "   curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20"
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📁 File locations:${NC}"
echo "   Repository:    $REPO_DIR"
echo "   Web root:      $WEB_ROOT"
echo "   Caddyfile:     $CADDYFILE"
echo "   Backup:        $BACKUP_FILE"
echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo "   View logs:     sudo journalctl -u caddy -f"
echo "   Reload Caddy:  sudo systemctl reload caddy"
echo "   Edit Caddy:    sudo nano $CADDYFILE"
echo ""
echo -e "${BLUE}🔄 Update deployment:${NC}"
echo "   cd $REPO_DIR && git pull"
echo "   sudo bash $REPO_DIR/deploy-jarvis-caddy.sh"
echo ""
