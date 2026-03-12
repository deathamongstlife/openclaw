# VPS Deployment - Quick Start Guide

Deploy Jarvis docs and install script on your VPS in 5 minutes.

## Prerequisites

- VPS with Ubuntu/Debian
- Root/sudo access
- Domain: `jarvis.allyapp.cc`

## Quick Deploy (3 Commands)

```bash
# 1. Clone repo to VPS
git clone https://github.com/deathamongstlife/jarvis.git /var/www/jarvis

# 2. Run setup script
cd /var/www/jarvis
sudo bash setup-vps.sh

# 3. Add DNS records (see output from script)
```

## DNS Setup

Add these A records to `allyapp.cc`:

```
Type: A
Name: docs.jarvis
Value: <your-vps-ip>

Type: A
Name: jarvis
Value: <your-vps-ip>
```

## Get SSL Certificate (if not using Caddy)

After DNS propagates:

```bash
# For Nginx
sudo certbot --nginx -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc

# For Apache
sudo certbot --apache -d docs.jarvis.allyapp.cc -d jarvis.allyapp.cc
```

## Test

```bash
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20
curl -I https://docs.jarvis.allyapp.cc
```

## Manual Setup

If you prefer manual setup, see **VPS_DEPLOYMENT_GUIDE.md** for:
- Nginx configuration
- Apache configuration
- Caddy configuration (easiest - auto SSL)
- Firewall setup
- Monitoring
- Troubleshooting

## File Locations

- **Docs:** `/var/www/jarvis/docs/`
- **Install script:** `/var/www/jarvis/install.sh`
- **Landing page:** `/var/www/jarvis/public/index.html`
- **Logs:** `/var/log/nginx/` or `/var/log/apache2/`

## Update Deployment

```bash
cd /var/www/jarvis
git pull
sudo cp -r docs/* /var/www/jarvis/docs/
sudo cp install.sh /var/www/jarvis/
sudo systemctl reload nginx  # or apache2, or caddy
```

## Troubleshooting

**DNS not resolving?**
```bash
dig docs.jarvis.allyapp.cc +short
# Wait 5-30 minutes for propagation
```

**Permission errors?**
```bash
sudo chown -R www-data:www-data /var/www/jarvis
sudo chmod -R 755 /var/www/jarvis
```

**Web server not starting?**
```bash
# Check status
sudo systemctl status nginx  # or apache2, or caddy

# Check logs
sudo journalctl -u nginx -f
```

---

**Full documentation:** VPS_DEPLOYMENT_GUIDE.md
