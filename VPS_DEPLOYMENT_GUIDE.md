# VPS Deployment Guide for Jarvis

Host Jarvis documentation and install script on your own VPS.

## Prerequisites

- VPS with root/sudo access
- Ubuntu/Debian (recommended) or other Linux distribution
- Domain: `jarvis.allyapp.cc` with DNS control
- At least 1GB RAM, 10GB disk space

## Quick Start

```bash
# 1. Clone repository to VPS
git clone https://github.com/deathamongstlife/jarvis.git /var/www/jarvis

# 2. Run automated setup script
cd /var/www/jarvis
sudo bash setup-vps.sh

# 3. Add DNS records (see below)

# 4. Test
curl https://jarvis.allyapp.cc/install.sh
```

## Option 1: Nginx (Recommended)

### Step 1: Install Nginx

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 2: Install Certbot (SSL/HTTPS)

```bash
# Install Certbot for Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Deploy Jarvis Files

```bash
# Create web directory
sudo mkdir -p /var/www/jarvis
sudo chown -R $USER:$USER /var/www/jarvis

# Clone or copy repository
git clone https://github.com/deathamongstlife/jarvis.git /var/www/jarvis

# Or if already cloned locally, use rsync:
# rsync -avz --exclude 'node_modules' --exclude '.git' \
#   ./ user@your-vps:/var/www/jarvis/
```

### Step 4: Configure Nginx

Create Nginx configuration for documentation:

```bash
sudo nano /etc/nginx/sites-available/jarvis-docs
```

Add this configuration:

```nginx
# Documentation site (docs.jarvis.allyapp.cc)
server {
    listen 80;
    listen [::]:80;
    server_name docs.jarvis.allyapp.cc;

    root /var/www/jarvis/docs;
    index index.html index.htm;

    # Logging
    access_log /var/log/nginx/jarvis-docs-access.log;
    error_log /var/log/nginx/jarvis-docs-error.log;

    # Main location
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Markdown files served as HTML (if using static site generator)
    location ~ \.md$ {
        try_files $uri.html $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Custom 404
    error_page 404 /404.html;
}
```

Create Nginx configuration for install script:

```bash
sudo nano /etc/nginx/sites-available/jarvis-install
```

Add this configuration:

```nginx
# Install script site (jarvis.allyapp.cc)
server {
    listen 80;
    listen [::]:80;
    server_name jarvis.allyapp.cc;

    root /var/www/jarvis/public;
    index index.html;

    # Logging
    access_log /var/log/nginx/jarvis-install-access.log;
    error_log /var/log/nginx/jarvis-install-error.log;

    # Serve install script
    location = /install.sh {
        alias /var/www/jarvis/install.sh;
        add_header Content-Type text/plain;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Step 5: Enable Sites

```bash
# Enable configurations
sudo ln -s /etc/nginx/sites-available/jarvis-docs /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/jarvis-install /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 6: Configure DNS

Add these DNS records to `allyapp.cc`:

```dns
Type: A
Name: docs.jarvis
Value: <your-vps-ip>
TTL: 3600

Type: A
Name: jarvis
Value: <your-vps-ip>
TTL: 3600
```

Verify DNS propagation:

```bash
dig docs.jarvis.allyapp.cc +short
dig jarvis.allyapp.cc +short
# Should return your VPS IP
```

### Step 7: Enable SSL with Let's Encrypt

```bash
# Get SSL certificates for both domains
sudo certbot --nginx -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx config to:
- Redirect HTTP to HTTPS
- Add SSL certificates
- Set up auto-renewal

### Step 8: Create Public Directory and Landing Page

```bash
# Create public directory
mkdir -p /var/www/jarvis/public

# Create simple landing page
cat > /var/www/jarvis/public/index.html <<'EOF'
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
    h1 { font-size: 4rem; margin-bottom: 1rem; }
    .tagline { font-size: 1.5rem; margin-bottom: 3rem; opacity: 0.9; }
    .install {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
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
    }
    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
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
EOF
```

### Step 9: Test Deployment

```bash
# Test install script
curl -I https://jarvis.allyapp.cc/install.sh
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# Test from another machine
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

## Option 2: Apache

### Install Apache

```bash
sudo apt update
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2
```

### Configure Apache

Create virtual host for docs:

```bash
sudo nano /etc/apache2/sites-available/jarvis-docs.conf
```

```apache
<VirtualHost *:80>
    ServerName docs.jarvis.allyapp.cc
    DocumentRoot /var/www/jarvis/docs

    <Directory /var/www/jarvis/docs>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/jarvis-docs-error.log
    CustomLog ${APACHE_LOG_DIR}/jarvis-docs-access.log combined
</VirtualHost>
```

Create virtual host for install script:

```bash
sudo nano /etc/apache2/sites-available/jarvis-install.conf
```

```apache
<VirtualHost *:80>
    ServerName jarvis.allyapp.cc
    DocumentRoot /var/www/jarvis/public

    <Directory /var/www/jarvis/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /install.sh /var/www/jarvis/install.sh
    <Files "install.sh">
        ForceType text/plain
    </Files>

    ErrorLog ${APACHE_LOG_DIR}/jarvis-install-error.log
    CustomLog ${APACHE_LOG_DIR}/jarvis-install-access.log combined
</VirtualHost>
```

Enable sites and SSL:

```bash
# Enable sites
sudo a2ensite jarvis-docs
sudo a2ensite jarvis-install

# Enable SSL module
sudo a2enmod ssl rewrite

# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Get certificates
sudo certbot --apache -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc

# Reload Apache
sudo systemctl reload apache2
```

## Option 3: Caddy (Simplest - Auto SSL)

### Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

```caddy
# Documentation site
docs.jarvis.allyapp.cc {
    root * /var/www/jarvis/docs
    file_server
    encode gzip

    # Try files, then directories, then 404
    try_files {path} {path}.html {path}/ =404

    # Custom error page
    handle_errors {
        @404 {
            expression {http.error.status_code} == 404
        }
        rewrite @404 /404.html
        file_server
    }
}

# Install script site
jarvis.allyapp.cc {
    root * /var/www/jarvis/public
    file_server
    encode gzip

    # Serve install script
    handle /install.sh {
        root * /var/www/jarvis
        file_server
        header Content-Type text/plain
    }
}
```

### Start Caddy

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

**That's it!** Caddy automatically handles:
- ✅ SSL certificates (Let's Encrypt)
- ✅ HTTP to HTTPS redirect
- ✅ Certificate renewal

## Automated Setup Script

Create `setup-vps.sh` in your repository:

```bash
#!/bin/bash
set -euo pipefail

# Jarvis VPS Deployment Script
# Usage: sudo bash setup-vps.sh

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

echo "🚀 Setting up Jarvis on VPS..."

# Detect package manager
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "❌ Unsupported package manager"
    exit 1
fi

# Update system
echo "📦 Updating system..."
if [[ "$PKG_MANAGER" == "apt" ]]; then
    apt update && apt upgrade -y
else
    yum update -y
fi

# Ask user for web server choice
echo ""
echo "Choose web server:"
echo "1) Nginx (recommended)"
echo "2) Apache"
echo "3) Caddy (easiest - auto SSL)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "📦 Installing Nginx..."
        apt install nginx certbot python3-certbot-nginx -y
        WEB_SERVER="nginx"
        ;;
    2)
        echo "📦 Installing Apache..."
        apt install apache2 certbot python3-certbot-apache -y
        WEB_SERVER="apache"
        ;;
    3)
        echo "📦 Installing Caddy..."
        apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
        apt update
        apt install caddy -y
        WEB_SERVER="caddy"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create directories
echo "📁 Creating directories..."
mkdir -p /var/www/jarvis/public
mkdir -p /var/www/jarvis/docs

# Copy files (assumes script is run from repo root)
if [ -d "docs" ]; then
    cp -r docs/* /var/www/jarvis/docs/
fi

if [ -f "install.sh" ]; then
    cp install.sh /var/www/jarvis/
    chmod +x /var/www/jarvis/install.sh
fi

# Create landing page if doesn't exist
if [ ! -f "/var/www/jarvis/public/index.html" ]; then
    cat > /var/www/jarvis/public/index.html <<'HTMLEOF'
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Jarvis</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px;">
<h1>🤖 Jarvis</h1>
<p>Your personal AI assistant</p>
<pre style="background:#f5f5f5;padding:20px;">curl -fsSL https://jarvis.allyapp.cc/install.sh | bash</pre>
<a href="https://docs.jarvis.allyapp.cc">Documentation</a>
</body></html>
HTMLEOF
fi

# Configure web server
echo "⚙️  Configuring $WEB_SERVER..."

if [ "$WEB_SERVER" == "nginx" ]; then
    # Nginx configuration already shown above
    # Copy configs from templates or create them
    echo "Nginx configuration required - see VPS_DEPLOYMENT_GUIDE.md"

elif [ "$WEB_SERVER" == "apache" ]; then
    # Apache configuration already shown above
    echo "Apache configuration required - see VPS_DEPLOYMENT_GUIDE.md"

elif [ "$WEB_SERVER" == "caddy" ]; then
    cat > /etc/caddy/Caddyfile <<'CADDYEOF'
docs.jarvis.allyapp.cc {
    root * /var/www/jarvis/docs
    file_server
    encode gzip
}

jarvis.allyapp.cc {
    root * /var/www/jarvis/public
    file_server
    encode gzip
    handle /install.sh {
        root * /var/www/jarvis
        file_server
    }
}
CADDYEOF

    systemctl reload caddy
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add DNS A records pointing to this server's IP"
echo "2. Configure SSL (see guide for your web server)"
echo "3. Test: curl https://jarvis.allyapp.cc/install.sh"
echo ""
```

Make it executable:

```bash
chmod +x setup-vps.sh
```

## Continuous Deployment with Git Hooks

Set up automatic updates when you push to Git:

```bash
# On your VPS, in /var/www/jarvis
cat > .git/hooks/post-merge <<'EOF'
#!/bin/bash
# Auto-deploy on git pull

echo "🔄 Deploying Jarvis updates..."

# Copy docs
cp -r docs/* /var/www/jarvis/docs/

# Copy install script
cp install.sh /var/www/jarvis/
chmod +x /var/www/jarvis/install.sh

# Reload web server
if systemctl is-active nginx; then
    systemctl reload nginx
elif systemctl is-active apache2; then
    systemctl reload apache2
elif systemctl is-active caddy; then
    systemctl reload caddy
fi

echo "✅ Deployment complete!"
EOF

chmod +x .git/hooks/post-merge
```

Then deploy updates with:

```bash
cd /var/www/jarvis
git pull
```

## Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status
```

## Monitoring and Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/jarvis-*-access.log
sudo tail -f /var/log/nginx/jarvis-*-error.log

# Apache logs
sudo tail -f /var/log/apache2/jarvis-*-access.log
sudo tail -f /var/log/apache2/jarvis-*-error.log

# Caddy logs
sudo journalctl -u caddy -f

# Check SSL certificate expiry
sudo certbot certificates
```

## Troubleshooting

### Port 80/443 Already in Use

```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or nginx, or whatever
```

### Permission Denied

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/jarvis

# Fix permissions
sudo chmod -R 755 /var/www/jarvis
```

### DNS Not Resolving

```bash
# Check DNS from VPS
dig docs.jarvis.allyapp.cc
nslookup jarvis.allyapp.cc

# Wait for propagation (up to 24 hours)
```

### SSL Certificate Fails

```bash
# Verify DNS points to your server
# Verify port 80 is open
# Check Nginx/Apache config is correct
sudo certbot certificates
sudo certbot renew --dry-run
```

## Performance Optimization

### Enable Gzip Compression (Nginx)

Add to your Nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
```

### Enable Caching

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Summary

Your Jarvis deployment will be live at:
- 📚 **Docs:** `https://docs.jarvis.allyapp.cc`
- 📥 **Install:** `https://jarvis.allyapp.cc/install.sh`

**Recommended Setup:** Caddy (easiest) or Nginx (most popular)

**All done!** Test with: `curl -fsSL https://jarvis.allyapp.cc/install.sh | bash`
