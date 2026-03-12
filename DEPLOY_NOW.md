# Deploy Jarvis NOW - Your Custom Guide

Deploy Jarvis from `/opt/jarvis` using your existing Caddy server.

**VPS IP:** `85.10.205.112`
**Location:** `/opt/jarvis`
**Web Server:** Caddy (existing)

## 🚀 Deploy in 3 Steps

### Step 1: Run Deployment Script

On your VPS:

```bash
cd /opt/jarvis
sudo bash deploy-jarvis-caddy.sh
```

**What it does:**
- ✅ Copies docs to `/var/www/jarvis/docs/`
- ✅ Copies install script to `/var/www/jarvis/install.sh`
- ✅ Creates beautiful landing page
- ✅ Backs up your existing Caddyfile
- ✅ Adds Jarvis configuration to Caddy
- ✅ Reloads Caddy

**Choose:** When prompted, say `y` to automatically add config to Caddyfile.

---

### Step 2: Add DNS Records

Go to your DNS provider for `allyapp.cc` and add:

#### Record 1 - Documentation
```
Type: A
Name: docs.jarvis
Value: 85.10.205.112
TTL: 3600
```

#### Record 2 - Install Script
```
Type: A
Name: jarvis
Value: 85.10.205.112
TTL: 3600
```

**See `DNS_SETUP.md` for provider-specific instructions.**

---

### Step 3: Wait & Test

**Wait:** 5-30 minutes for DNS to propagate

**Test DNS:**
```bash
dig docs.jarvis.allyapp.cc +short
dig jarvis.allyapp.cc +short
# Both should return: 85.10.205.112
```

**Test Deployment:**
```bash
# Test HTTPS (Caddy auto-gets SSL certificate)
curl -I https://jarvis.allyapp.cc/install.sh

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# View install script
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20

# Full test (on another machine)
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

---

## 🎯 What You Get

After deployment, these URLs will be live:

- 🏠 **Landing Page:** https://jarvis.allyapp.cc
  - Beautiful homepage with install instructions

- 📥 **Install Script:** https://jarvis.allyapp.cc/install.sh
  - One-line installer: `curl -fsSL https://jarvis.allyapp.cc/install.sh | bash`

- 📚 **Documentation:** https://docs.jarvis.allyapp.cc
  - All your documentation from `/opt/jarvis/docs/`

---

## 🔄 Update Deployment

When you update Jarvis:

```bash
cd /opt/jarvis
git pull
sudo bash deploy-jarvis-caddy.sh
```

The script will copy updated files and reload Caddy.

---

## 🔍 Useful Commands

```bash
# View Caddy logs
sudo journalctl -u caddy -f

# Check Caddy status
sudo systemctl status caddy

# Reload Caddy config
sudo systemctl reload caddy

# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile

# Validate Caddyfile
caddy validate --config /etc/caddy/Caddyfile

# Check which sites Caddy is serving
sudo caddy list-modules
```

---

## 📁 File Locations

```
Repository:         /opt/jarvis
Web Root:           /var/www/jarvis
Documentation:      /var/www/jarvis/docs/
Install Script:     /var/www/jarvis/install.sh
Landing Page:       /var/www/jarvis/public/index.html
Caddyfile:          /etc/caddy/Caddyfile
Caddy Logs:         /var/log/caddy/
```

---

## ⚡ Quick Troubleshooting

### DNS not resolving?

```bash
# Check DNS propagation
dig docs.jarvis.allyapp.cc +short
# Should return: 85.10.205.112

# Check worldwide propagation
# Visit: https://dnschecker.org
```

### Caddy not working?

```bash
# Check Caddy is running
sudo systemctl status caddy

# Restart Caddy
sudo systemctl restart caddy

# Check for errors
sudo journalctl -u caddy -n 50
```

### SSL certificate not working?

Caddy gets certificates automatically when:
1. ✅ DNS points to your server (85.10.205.112)
2. ✅ Port 80 and 443 are open
3. ✅ Domain is accessible

Just wait 1-5 minutes after DNS propagates.

### Can't access install.sh?

```bash
# Check file exists
ls -la /var/www/jarvis/install.sh

# Check permissions
sudo chmod +x /var/www/jarvis/install.sh

# Check Caddyfile
cat /etc/caddy/Caddyfile | grep -A 10 "jarvis.allyapp.cc"
```

---

## 🎉 Success Checklist

- [ ] Ran `deploy-jarvis-caddy.sh`
- [ ] Added DNS A record for `docs.jarvis.allyapp.cc`
- [ ] Added DNS A record for `jarvis.allyapp.cc`
- [ ] Waited for DNS propagation (5-30 min)
- [ ] Tested: `curl -I https://jarvis.allyapp.cc/install.sh`
- [ ] Tested: `curl -I https://docs.jarvis.allyapp.cc`
- [ ] Install works: `curl -fsSL https://jarvis.allyapp.cc/install.sh | bash`

---

## 📞 Need Help?

- **DNS Setup:** See `DNS_SETUP.md`
- **Full VPS Guide:** See `VPS_DEPLOYMENT_GUIDE.md`
- **Caddy Issues:** `sudo journalctl -u caddy -f`

---

**Ready?** Run: `cd /opt/jarvis && sudo bash deploy-jarvis-caddy.sh` 🚀
