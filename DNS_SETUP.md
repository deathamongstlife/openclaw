# DNS Setup for Jarvis

Add these DNS records to your `allyapp.cc` domain.

## Your VPS IP: `85.10.205.112`

## DNS Records to Add

### Record 1: Documentation

```
Type: A
Name: docs.jarvis
Host: @
Value: 85.10.205.112
TTL: 3600
```

### Record 2: Install Script & Landing Page

```
Type: A
Name: jarvis
Host: @
Value: 85.10.205.112
TTL: 3600
```

## Provider-Specific Instructions

### Cloudflare

1. Go to **DNS** tab
2. Click **Add record**
3. **Type:** A
4. **Name:** `docs.jarvis`
5. **IPv4 address:** `85.10.205.112`
6. **Proxy status:** DNS only (gray cloud)
7. **TTL:** Auto
8. Click **Save**

Repeat for `jarvis` (without `docs.`)

### Namecheap

1. Go to **Advanced DNS**
2. Click **Add New Record**
3. **Type:** A Record
4. **Host:** `docs.jarvis`
5. **Value:** `85.10.205.112`
6. **TTL:** 3600
7. Click **Save**

Repeat for `jarvis`

### GoDaddy

1. Go to **DNS Management**
2. Click **Add**
3. **Type:** A
4. **Name:** `docs.jarvis`
5. **Value:** `85.10.205.112`
6. **TTL:** 1 Hour
7. Click **Save**

Repeat for `jarvis`

### Other Providers

Add two A records:
- `docs.jarvis.allyapp.cc` → `85.10.205.112`
- `jarvis.allyapp.cc` → `85.10.205.112`

## Verify DNS Propagation

Wait 5-30 minutes, then test:

```bash
# Check DNS resolution
dig docs.jarvis.allyapp.cc +short
# Should return: 85.10.205.112

dig jarvis.allyapp.cc +short
# Should return: 85.10.205.112

# Alternative method
nslookup docs.jarvis.allyapp.cc
nslookup jarvis.allyapp.cc
```

## Check Propagation Worldwide

Use online tools:
- https://dnschecker.org
- https://www.whatsmydns.net

Enter: `docs.jarvis.allyapp.cc` and `jarvis.allyapp.cc`

## After DNS Propagates

Caddy will automatically:
- ✅ Get SSL certificates from Let's Encrypt
- ✅ Redirect HTTP to HTTPS
- ✅ Renew certificates automatically

Test your deployment:

```bash
# Test HTTPS
curl -I https://jarvis.allyapp.cc/install.sh

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# View install script
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20
```

## Troubleshooting

### DNS not resolving after 30 minutes

Check your DNS provider's propagation time (some can take up to 24 hours).

### "SSL handshake failed" error

DNS might not be propagated yet. Caddy needs working DNS to get SSL certificates. Wait and try again.

### Wrong IP returned

Clear your DNS cache:

```bash
# Linux
sudo systemd-resolve --flush-caches

# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns
```

---

**Your IP:** `85.10.205.112`
**Domains:** `jarvis.allyapp.cc` and `docs.jarvis.allyapp.cc`
