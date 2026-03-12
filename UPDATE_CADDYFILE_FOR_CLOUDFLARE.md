# Update Caddyfile for Cloudflare Proxy (Option 1)

You chose **Option 1: Let Cloudflare Handle SSL** with `tls internal` directive.

## Current Status

Your existing Caddyfile already has Jarvis configuration, but it's missing the `tls internal` directive needed for Cloudflare proxy compatibility.

## Steps to Update

### 1. Replace Jarvis Configuration in Caddyfile

Edit `/etc/caddy/Caddyfile` and replace the existing Jarvis blocks with the updated version:

```bash
sudo nano /etc/caddy/Caddyfile
```

**Find and replace this section:**

```caddy
# Jarvis Configuration - Added Thu Mar 12 02:23:33 PM EDT 2026
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
```

**With this updated version:**

```caddy
# Jarvis Configuration - Updated for Cloudflare Proxy
# Added: Thu Mar 12 02:23:33 PM EDT 2026
# Updated: For Cloudflare SSL/TLS Full mode

# Jarvis Documentation
docs.jarvis.allyapp.cc {
	tls internal
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
	tls internal
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
```

**Key Changes:**

- Added `tls internal` to both `docs.jarvis.allyapp.cc` and `jarvis.allyapp.cc` blocks
- This tells Caddy to generate self-signed certificates for internal use
- Cloudflare will handle the public-facing SSL/TLS

### 2. Validate Configuration

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

Expected output:

```
Valid configuration
```

### 3. Reload Caddy

```bash
sudo systemctl reload caddy
```

Or if reload doesn't work:

```bash
sudo systemctl restart caddy
```

### 4. Check Caddy Status

```bash
sudo systemctl status caddy
```

Should show `active (running)`.

### 5. Configure Cloudflare SSL/TLS Settings

**CRITICAL:** Set Cloudflare SSL/TLS mode to **"Full"** (not "Full (strict)"):

1. Go to your Cloudflare dashboard
2. Select domain: **allyapp.cc**
3. Navigate to **SSL/TLS** tab
4. Set **SSL/TLS encryption mode** to: **Full**
   - ✅ **Full** = Cloudflare ↔ Origin server (encrypted, allows self-signed certs)
   - ❌ Not "Flexible" (insecure)
   - ❌ Not "Full (strict)" (requires valid CA cert)

### 6. Ensure DNS Records Are Correct

Verify A records in Cloudflare:

```
Type: A
Name: docs.jarvis
Value: 85.10.205.112
Proxy: ✅ Proxied (orange cloud)

Type: A
Name: jarvis
Value: 85.10.205.112
Proxy: ✅ Proxied (orange cloud)
```

### 7. Test Deployment

Wait 2-3 minutes for Caddy to reload, then test:

```bash
# Test HTTPS
curl -I https://jarvis.allyapp.cc
curl -I https://docs.jarvis.allyapp.cc
curl -I https://jarvis.allyapp.cc/install.sh

# Should return 200 OK
```

### 8. Test Install Script

```bash
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20
```

Should show the Jarvis install script content.

## Troubleshooting

### If Sites Don't Load

1. **Check Caddy logs:**

   ```bash
   sudo journalctl -u caddy -n 50 --no-pager
   ```

2. **Check Cloudflare SSL/TLS mode:**
   Must be set to "Full" (not "Flexible" or "Full (strict)")

3. **Verify DNS propagation:**

   ```bash
   dig docs.jarvis.allyapp.cc +short
   dig jarvis.allyapp.cc +short
   ```

   Both should return: `85.10.205.112`

4. **Check if Caddy is listening:**

   ```bash
   sudo ss -tlnp | grep caddy
   ```

   Should show `:80` and `:443`

5. **Restart Caddy if needed:**
   ```bash
   sudo systemctl restart caddy
   sudo systemctl status caddy
   ```

## Summary

✅ **What `tls internal` does:**

- Caddy generates self-signed certificates for internal communication
- Cloudflare handles public SSL/TLS termination
- Cloudflare → Caddy connection is encrypted (SSL/TLS Full mode)

✅ **Benefits:**

- Cloudflare DDoS protection active (orange cloud)
- Cloudflare CDN caching works
- SSL certificate management handled by Cloudflare
- No Let's Encrypt rate limits

✅ **Final URLs:**

- 🏠 https://jarvis.allyapp.cc
- 📥 https://jarvis.allyapp.cc/install.sh
- 📚 https://docs.jarvis.allyapp.cc

---

**Ready to deploy!** Just follow the 8 steps above.
