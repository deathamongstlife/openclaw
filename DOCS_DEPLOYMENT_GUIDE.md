# Jarvis Documentation Deployment Guide

This guide explains how to deploy Jarvis documentation to `docs.jarvis.allyapp.cc` following Jarvis's documentation pattern.

## Overview

The Jarvis documentation will be hosted at:

- **Docs URL:** `https://docs.jarvis.allyapp.cc`
- **Install Script:** `https://jarvis.allyapp.cc/install.sh`

## Option 1: GitHub Pages (Recommended)

### Prerequisites

- GitHub repository: `deathamongstlife/jarvis`
- Domain: `jarvis.allyapp.cc` with DNS access

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set source to:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/docs`

### Step 2: Configure Custom Domain

1. In GitHub Pages settings, add custom domain:

   ```
   docs.jarvis.allyapp.cc
   ```

2. Wait for DNS check to complete

### Step 3: DNS Configuration

Add these DNS records to `allyapp.cc`:

```dns
# For docs subdomain
Type: CNAME
Name: docs.jarvis.allyapp.cc
Value: deathamongstlife.github.io
TTL: 3600

# For root domain (install script)
Type: CNAME
Name: jarvis.allyapp.cc
Value: deathamongstlife.github.io
TTL: 3600
```

### Step 4: Verify CNAME File

The `docs/CNAME` file should contain:

```
docs.jarvis.allyapp.cc
```

✅ Already updated in this repository.

### Step 5: Create Root CNAME for Install Script

Create a separate repo or use the same repo with a different branch for `jarvis.allyapp.cc`:

**Option A: Same Repo, Different Branch**

```bash
# Create gh-pages branch for root domain
git checkout --orphan gh-pages
git rm -rf .
echo "jarvis.allyapp.cc" > CNAME
cp install.sh .
git add CNAME install.sh
git commit -m "Add install script for jarvis.allyapp.cc"
git push origin gh-pages
```

Then in GitHub Pages settings:

- Set source branch to `gh-pages`
- Add custom domain: `jarvis.allyapp.cc`

**Option B: Separate Repo**
Create a new repo `jarvis-installer`:

```bash
mkdir jarvis-installer
cd jarvis-installer
echo "jarvis.allyapp.cc" > CNAME
cp /path/to/jarvis/install.sh .
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/deathamongstlife/jarvis-installer.git
git push -u origin main
```

Enable GitHub Pages for that repo with custom domain `jarvis.allyapp.cc`.

## Option 2: Mintlify (Like Jarvis)

Jarvis appears to use Mintlify for documentation hosting. To use Mintlify:

### Step 1: Install Mintlify

```bash
npm install -g mintlify
```

### Step 2: Initialize Mintlify in Docs

```bash
cd docs
mintlify init
```

This creates `mint.json` configuration file.

### Step 3: Configure mint.json

Create `docs/mint.json`:

```json
{
  "name": "Jarvis Documentation",
  "logo": {
    "dark": "/assets/logo-dark.svg",
    "light": "/assets/logo-light.svg"
  },
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#FF4D4D",
    "light": "#00E5CC",
    "dark": "#E63946",
    "anchors": {
      "from": "#FF4D4D",
      "to": "#00E5CC"
    }
  },
  "topbarLinks": [
    {
      "name": "Support",
      "url": "https://discord.gg/jarvis"
    }
  ],
  "topbarCtaButton": {
    "name": "Get Started",
    "url": "https://jarvis.allyapp.cc/install.sh"
  },
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["install/getting-started", "start/tutorial", "start/faq"]
    },
    {
      "group": "Channels",
      "pages": [
        "channels/whatsapp",
        "channels/telegram",
        "channels/discord",
        "channels/slack",
        "channels/imessage",
        "channels/signal"
      ]
    },
    {
      "group": "Configuration",
      "pages": ["config/reference", "config/models", "config/routing"]
    }
  ],
  "footerSocials": {
    "github": "https://github.com/deathamongstlife/jarvis",
    "discord": "https://discord.gg/jarvis"
  }
}
```

### Step 4: Deploy to Mintlify

1. Sign up at https://mintlify.com
2. Connect your GitHub repository
3. Configure custom domain: `docs.jarvis.allyapp.cc`
4. Mintlify will provide DNS records to add

Typical Mintlify DNS setup:

```dns
Type: CNAME
Name: docs.jarvis.allyapp.cc
Value: cname.vercel-dns.com (or Mintlify's CNAME)
TTL: 3600
```

### Step 5: Update Links

Update all doc references in the codebase to point to the new domain.

Already done by the rebranding script:

- ✅ `docs.jarvis.ai` → `docs.jarvis.allyapp.cc`

## Option 3: Static Site Deployment (Netlify/Vercel)

### Netlify Deployment

1. **Create `netlify.toml` in repo root:**

```toml
[build]
  publish = "docs"
  command = "echo 'Static docs deployment'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy:**
   - Connect GitHub repo to Netlify
   - Set custom domain: `docs.jarvis.allyapp.cc`
   - Netlify provides DNS records

3. **DNS Configuration:**

```dns
Type: CNAME
Name: docs.jarvis.allyapp.cc
Value: <your-site-name>.netlify.app
TTL: 3600
```

### Vercel Deployment

1. **Create `vercel.json`:**

```json
{
  "buildCommand": "echo 'Static docs'",
  "outputDirectory": "docs",
  "framework": null
}
```

2. **Deploy:**
   - Connect GitHub repo to Vercel
   - Set custom domain: `docs.jarvis.allyapp.cc`

3. **DNS:**

```dns
Type: CNAME
Name: docs.jarvis.allyapp.cc
Value: cname.vercel-dns.com
TTL: 3600
```

## Option 4: Custom Server (Advanced)

If you have your own server for `allyapp.cc`:

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name docs.jarvis.allyapp.cc;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name docs.jarvis.allyapp.cc;

    ssl_certificate /etc/letsencrypt/live/docs.jarvis.allyapp.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/docs.jarvis.allyapp.cc/privkey.pem;

    root /var/www/jarvis/docs;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Serve markdown as HTML (if using a static site generator)
    location ~ \.md$ {
        try_files $uri.html $uri/ =404;
    }
}

# Install script domain
server {
    listen 80;
    listen [::]:80;
    server_name jarvis.allyapp.cc;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jarvis.allyapp.cc;

    ssl_certificate /etc/letsencrypt/live/jarvis.allyapp.cc/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jarvis.allyapp.cc/privkey.pem;

    root /var/www/jarvis/public;
    index index.html;

    # Serve install script
    location = /install.sh {
        alias /var/www/jarvis/install.sh;
        add_header Content-Type text/plain;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName docs.jarvis.allyapp.cc
    Redirect permanent / https://docs.jarvis.allyapp.cc/
</VirtualHost>

<VirtualHost *:443>
    ServerName docs.jarvis.allyapp.cc
    DocumentRoot /var/www/jarvis/docs

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/docs.jarvis.allyapp.cc/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/docs.jarvis.allyapp.cc/privkey.pem

    <Directory /var/www/jarvis/docs>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>

# Install script domain
<VirtualHost *:443>
    ServerName jarvis.allyapp.cc
    DocumentRoot /var/www/jarvis/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/jarvis.allyapp.cc/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/jarvis.allyapp.cc/privkey.pem

    Alias /install.sh /var/www/jarvis/install.sh
    <Files "install.sh">
        ForceType text/plain
    </Files>
</VirtualHost>
```

## Recommended Approach

**For Quick Setup:** Use **GitHub Pages** (Option 1)

- ✅ Free
- ✅ Easy to configure
- ✅ Automatic HTTPS
- ✅ Good performance with CDN

**For Professional Documentation:** Use **Mintlify** (Option 2)

- ✅ Beautiful UI
- ✅ Search functionality
- ✅ Versioning support
- ✅ Analytics built-in
- ✅ OpenAPI/API docs support

## Testing the Deployment

Once deployed, test:

```bash
# Test install script
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# Test full installation
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

## SSL/HTTPS Setup

All options above provide automatic HTTPS. If using custom server:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d jarvis.allyapp.cc -d docs.jarvis.allyapp.cc
```

## Monitoring

Set up monitoring for:

- [ ] SSL certificate expiration
- [ ] DNS resolution
- [ ] Website uptime
- [ ] Install script accessibility

## Next Steps

1. **Choose deployment method** (GitHub Pages recommended to start)
2. **Configure DNS** records at your domain provider
3. **Deploy docs** to chosen platform
4. **Test installation** with `curl -fsSL https://jarvis.allyapp.cc/install.sh | bash`
5. **Update README** with new docs URL
6. **Announce** the new domain to users

## Troubleshooting

### DNS not resolving

```bash
# Check DNS propagation
dig docs.jarvis.allyapp.cc
nslookup docs.jarvis.allyapp.cc

# Check CNAME
cat docs/CNAME
```

### 404 on GitHub Pages

- Verify CNAME file exists in `/docs` directory
- Check GitHub Pages settings
- Wait for deployment (can take 5-10 minutes)

### SSL issues

- GitHub Pages: Automatic after DNS verification
- Custom server: Run certbot
- Mintlify/Netlify/Vercel: Automatic

## Files Updated

✅ `install.sh` - Updated to use `jarvis.allyapp.cc`
✅ `docs/CNAME` - Updated to `docs.jarvis.allyapp.cc`
✅ All doc references updated by rebranding script

---

**Need Help?** File an issue on GitHub or reach out on Discord.
