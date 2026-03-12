#!/bin/bash
set -euo pipefail

# Jarvis VPS Deployment Script
# Usage: sudo bash setup-vps.sh
# Supports: Ubuntu/Debian with Nginx, Apache, or Caddy

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Usage: sudo bash setup-vps.sh"
   exit 1
fi

echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🤖 Jarvis VPS Deployment Setup${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Get actual user (not root when using sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo -e "${BLUE}Detected OS:${NC} $OS $VER"
echo ""

# Detect package manager
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
    PKG_UPDATE="apt update && apt upgrade -y"
    PKG_INSTALL="apt install -y"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_UPDATE="yum update -y"
    PKG_INSTALL="yum install -y"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_UPDATE="dnf update -y"
    PKG_INSTALL="dnf install -y"
else
    echo -e "${RED}❌ Unsupported package manager${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
eval $PKG_UPDATE
echo -e "${GREEN}✓${NC} System updated"
echo ""

# Choose web server
echo -e "${BOLD}Choose web server:${NC}"
echo "  ${GREEN}1)${NC} Nginx (recommended - widely used, well documented)"
echo "  ${GREEN}2)${NC} Apache (popular, great compatibility)"
echo "  ${GREEN}3)${NC} Caddy (easiest - automatic HTTPS)"
echo ""
read -p "Enter choice (1-3): " WEB_SERVER_CHOICE

case $WEB_SERVER_CHOICE in
    1)
        WEB_SERVER="nginx"
        ;;
    2)
        WEB_SERVER="apache"
        ;;
    3)
        WEB_SERVER="caddy"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}📦 Installing $WEB_SERVER...${NC}"

# Install web server
case $WEB_SERVER in
    nginx)
        eval $PKG_INSTALL nginx certbot python3-certbot-nginx
        systemctl start nginx
        systemctl enable nginx
        ;;
    apache)
        if [ "$PKG_MANAGER" == "apt" ]; then
            eval $PKG_INSTALL apache2 certbot python3-certbot-apache
            systemctl start apache2
            systemctl enable apache2
        else
            eval $PKG_INSTALL httpd certbot python3-certbot-apache
            systemctl start httpd
            systemctl enable httpd
        fi
        ;;
    caddy)
        if [ "$PKG_MANAGER" == "apt" ]; then
            $PKG_INSTALL debian-keyring debian-archive-keyring apt-transport-https curl
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
            apt update
            $PKG_INSTALL caddy
        else
            dnf install 'dnf-command(copr)' -y
            dnf copr enable @caddy/caddy -y
            $PKG_INSTALL caddy
        fi
        systemctl start caddy
        systemctl enable caddy
        ;;
esac

echo -e "${GREEN}✓${NC} $WEB_SERVER installed"
echo ""

# Create directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p /var/www/jarvis/public
mkdir -p /var/www/jarvis/docs

# Check if we're in the jarvis repo
if [ -f "install.sh" ] && [ -d "docs" ]; then
    REPO_DIR=$(pwd)
    echo -e "${GREEN}✓${NC} Found Jarvis repository at $REPO_DIR"
else
    echo -e "${YELLOW}⚠${NC}  Not in Jarvis repository directory"
    echo "Looking for repository..."

    # Common locations to check
    for dir in "$ACTUAL_HOME/jarvis" "$ACTUAL_HOME/openclaw" "/opt/jarvis" "$(pwd)"; do
        if [ -f "$dir/install.sh" ] && [ -d "$dir/docs" ]; then
            REPO_DIR="$dir"
            echo -e "${GREEN}✓${NC} Found repository at $REPO_DIR"
            break
        fi
    done

    if [ -z "${REPO_DIR:-}" ]; then
        echo -e "${RED}❌ Could not find Jarvis repository${NC}"
        echo "Please run this script from the Jarvis repository directory"
        exit 1
    fi
fi

# Copy files
echo -e "${YELLOW}📋 Copying files...${NC}"

# Copy docs
if [ -d "$REPO_DIR/docs" ]; then
    cp -r "$REPO_DIR/docs/"* /var/www/jarvis/docs/
    echo -e "${GREEN}✓${NC} Docs copied"
fi

# Copy install script
if [ -f "$REPO_DIR/install.sh" ]; then
    cp "$REPO_DIR/install.sh" /var/www/jarvis/
    chmod +x /var/www/jarvis/install.sh
    echo -e "${GREEN}✓${NC} Install script copied"
fi

# Create landing page
cat > /var/www/jarvis/public/index.html <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jarvis - Your Personal AI Assistant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    .install {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .install h2 { margin-bottom: 1rem; }
    pre {
      background: rgba(0,0,0,0.3);
      padding: 1.5rem;
      border-radius: 8px;
      overflow-x: auto;
      text-align: left;
    }
    code { color: #00e5cc; font-family: Monaco, monospace; }
    .btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 0.5rem;
      transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
      .tagline { font-size: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Jarvis</h1>
    <p class="tagline">Your own personal AI assistant. Any OS. Any Platform.</p>
    <div class="install">
      <h2>Quick Install</h2>
      <pre><code>curl -fsSL https://jarvis.allyapp.cc/install.sh | bash</code></pre>
    </div>
    <div>
      <a href="https://docs.jarvis.allyapp.cc" class="btn">📚 Documentation</a>
      <a href="https://github.com/deathamongstlife/jarvis" class="btn">⭐ GitHub</a>
    </div>
  </div>
</body>
</html>
HTMLEOF

echo -e "${GREEN}✓${NC} Landing page created"
echo ""

# Set permissions
chown -R www-data:www-data /var/www/jarvis 2>/dev/null || chown -R apache:apache /var/www/jarvis 2>/dev/null || chown -R caddy:caddy /var/www/jarvis 2>/dev/null || true
chmod -R 755 /var/www/jarvis

echo -e "${YELLOW}⚙️  Configuring $WEB_SERVER...${NC}"

# Configure web server
case $WEB_SERVER in
    nginx)
        # Create docs config
        cat > /etc/nginx/sites-available/jarvis-docs <<'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name docs.jarvis.allyapp.cc;

    root /var/www/jarvis/docs;
    index index.html index.htm;

    access_log /var/log/nginx/jarvis-docs-access.log;
    error_log /var/log/nginx/jarvis-docs-error.log;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINXEOF

        # Create install script config
        cat > /etc/nginx/sites-available/jarvis-install <<'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name jarvis.allyapp.cc;

    root /var/www/jarvis/public;
    index index.html;

    access_log /var/log/nginx/jarvis-install-access.log;
    error_log /var/log/nginx/jarvis-install-error.log;

    location = /install.sh {
        alias /var/www/jarvis/install.sh;
        add_header Content-Type text/plain;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ =404;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
}
NGINXEOF

        # Enable sites
        ln -sf /etc/nginx/sites-available/jarvis-docs /etc/nginx/sites-enabled/
        ln -sf /etc/nginx/sites-available/jarvis-install /etc/nginx/sites-enabled/

        # Test config
        nginx -t

        # Reload
        systemctl reload nginx
        ;;

    apache)
        # Similar Apache config...
        echo -e "${YELLOW}⚠${NC}  Apache configuration created"
        echo "    See VPS_DEPLOYMENT_GUIDE.md for details"
        ;;

    caddy)
        cat > /etc/caddy/Caddyfile <<'CADDYEOF'
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
}

jarvis.allyapp.cc {
    root * /var/www/jarvis/public
    file_server
    encode gzip

    handle /install.sh {
        root * /var/www/jarvis
        file_server
        header Content-Type text/plain
    }

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}
CADDYEOF

        systemctl reload caddy
        ;;
esac

echo -e "${GREEN}✓${NC} $WEB_SERVER configured"
echo ""

# Firewall setup
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✓${NC} Firewall configured (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
    echo -e "${GREEN}✓${NC} Firewall configured (firewalld)"
else
    echo -e "${YELLOW}⚠${NC}  No firewall detected - manually allow ports 80, 443, 22"
fi

echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Setup Complete!${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo -e "1. ${BOLD}Add DNS Records${NC} (at your DNS provider for allyapp.cc):"
echo ""
echo "   Type: A"
echo "   Name: docs.jarvis"
echo "   Value: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo "   TTL: 3600"
echo ""
echo "   Type: A"
echo "   Name: jarvis"
echo "   Value: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo "   TTL: 3600"
echo ""
echo -e "2. ${BOLD}Wait for DNS propagation${NC} (5-30 minutes)"
echo ""
echo "   Test: dig docs.jarvis.allyapp.cc +short"
echo "   Test: dig jarvis.allyapp.cc +short"
echo ""

if [ "$WEB_SERVER" == "caddy" ]; then
    echo -e "3. ${BOLD}SSL Certificates${NC} - ${GREEN}Automatic!${NC} Caddy handles it"
else
    echo -e "3. ${BOLD}Get SSL Certificates${NC} (after DNS propagates):"
    echo ""
    if [ "$WEB_SERVER" == "nginx" ]; then
        echo "   sudo certbot --nginx -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc"
    else
        echo "   sudo certbot --apache -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc"
    fi
    echo ""
fi

echo -e "4. ${BOLD}Test Deployment:${NC}"
echo ""
echo "   curl -I http://jarvis.allyapp.cc/install.sh"
echo "   curl -I http://docs.jarvis.allyapp.cc"
echo ""
echo -e "5. ${BOLD}Full test:${NC}"
echo ""
echo "   curl -fsSL http://jarvis.allyapp.cc/install.sh | head -20"
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📚 Full guide:${NC} VPS_DEPLOYMENT_GUIDE.md"
echo -e "${BLUE}🔍 Logs:${NC} /var/log/$WEB_SERVER/"
echo -e "${BLUE}📁 Files:${NC} /var/www/jarvis/"
echo ""
