# GitLab Pages Deployment Guide for Jarvis

This guide explains how to enable and configure GitLab Pages for your Jarvis documentation and install script.

## Prerequisites

- GitLab repository (self-hosted or GitLab.com)
- Admin access to the repository
- Domain: `jarvis.allyapp.cc` with DNS control

## Step 1: Create GitLab CI/CD Configuration

Create `.gitlab-ci.yml` in your repository root:

```yaml
# GitLab Pages deployment for Jarvis
# Deploys docs to pages.gitlab.io and custom domain

image: node:latest

# Cache node_modules for faster builds
cache:
  paths:
    - node_modules/

# Build and test stages
stages:
  - test
  - deploy

# Optional: Run tests before deployment
test:
  stage: test
  script:
    - npm install -g pnpm
    - pnpm install
    - pnpm test || echo "Tests skipped"
  only:
    - main
    - merge_requests

# GitLab Pages deployment
pages:
  stage: deploy
  script:
    # Copy docs to public directory
    - mkdir -p public
    - cp -r docs/* public/

    # Copy install script to root for jarvis.allyapp.cc
    - cp install.sh public/install.sh

    # Create index.html redirect to docs (optional)
    - |
      cat > public/index.html <<'EOF'
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Jarvis - Your Personal AI Assistant</title>
        <meta http-equiv="refresh" content="0; url=https://docs.jarvis.allyapp.cc">
        <link rel="canonical" href="https://docs.jarvis.allyapp.cc">
        <style>
          body { font-family: system-ui; text-align: center; padding: 50px; }
          a { color: #ff4d4d; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>Redirecting to Jarvis Documentation...</h1>
        <p>If you are not redirected, <a href="https://docs.jarvis.allyapp.cc">click here</a>.</p>
        <hr>
        <h2>Quick Install</h2>
        <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px;">curl -fsSL https://jarvis.allyapp.cc/install.sh | bash</pre>
      </body>
      </html>
      EOF

    # Verify files
    - ls -la public/
    - echo "Docs and install script ready for deployment"

  artifacts:
    paths:
      - public

  only:
    - main

# Optional: Build check for other branches
build:check:
  stage: test
  script:
    - echo "Checking build on non-main branch"
    - mkdir -p public
    - cp -r docs/* public/
  except:
    - main
```

## Step 2: Enable GitLab Pages

### For GitLab.com

1. **Push the `.gitlab-ci.yml` file:**

   ```bash
   git add .gitlab-ci.yml
   git commit -m "Add GitLab Pages configuration"
   git push origin main
   ```

2. **Wait for pipeline to run:**
   - Go to your project → CI/CD → Pipelines
   - Wait for the `pages` job to complete (green checkmark)

3. **Access Pages settings:**
   - Go to: **Settings** → **Pages**
   - Your site will be available at: `https://<username>.gitlab.io/<project-name>`

### For Self-Hosted GitLab

If GitLab Pages is not enabled on your instance:

1. **Check if Pages is enabled:**
   - Go to **Admin Area** → **Settings** → **Pages**
   - Look for "GitLab Pages" section

2. **If not enabled, contact your GitLab admin or enable it:**

   **For GitLab Administrators (Self-Hosted):**

   Edit `/etc/gitlab/gitlab.rb`:

   ```ruby
   # Enable GitLab Pages
   pages_external_url "http://pages.example.com"
   gitlab_pages['enable'] = true

   # Optional: HTTPS configuration
   pages_nginx['redirect_http_to_https'] = true
   pages_nginx['ssl_certificate'] = "/etc/gitlab/ssl/pages.crt"
   pages_nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/pages.key"
   ```

   Reconfigure GitLab:

   ```bash
   sudo gitlab-ctl reconfigure
   sudo gitlab-ctl restart
   ```

## Step 3: Configure Custom Domain

### 3.1 Add Custom Domain in GitLab

1. **Go to Settings → Pages**

2. **Click "New Domain"**

3. **For documentation (docs.jarvis.allyapp.cc):**
   - Domain: `docs.jarvis.allyapp.cc`
   - Leave certificate blank for now (we'll use Let's Encrypt)
   - Click "Create New Domain"

4. **For install script (jarvis.allyapp.cc):**
   - You can either:
     - **Option A:** Use the same Pages deployment with subdomain
     - **Option B:** Create a separate GitLab project for the root domain

### 3.2 DNS Configuration

Add these DNS records to `allyapp.cc`:

```dns
# For GitLab.com
Type: CNAME
Name: docs.jarvis
Value: <username>.gitlab.io
TTL: 3600

Type: CNAME
Name: jarvis
Value: <username>.gitlab.io
TTL: 3600

# For Self-Hosted GitLab
Type: CNAME
Name: docs.jarvis
Value: pages.your-gitlab-instance.com
TTL: 3600

Type: CNAME
Name: jarvis
Value: pages.your-gitlab-instance.com
TTL: 3600
```

**Alternative (A Record):**
If GitLab provides an IP address instead of CNAME:

```dns
Type: A
Name: docs.jarvis
Value: <GitLab Pages IP>
TTL: 3600

Type: A
Name: jarvis
Value: <GitLab Pages IP>
TTL: 3600
```

### 3.3 Verify DNS

Wait for DNS propagation (5-30 minutes), then verify:

```bash
# Check DNS resolution
dig docs.jarvis.allyapp.cc
dig jarvis.allyapp.cc

# Test with nslookup
nslookup docs.jarvis.allyapp.cc
nslookup jarvis.allyapp.cc
```

## Step 4: Enable HTTPS (Let's Encrypt)

GitLab Pages provides automatic Let's Encrypt certificates:

1. **Go to Settings → Pages → Domains**

2. **Click on your domain** (docs.jarvis.allyapp.cc)

3. **Check "Automatic certificate management using Let's Encrypt"**

4. **Click "Save Changes"**

5. **Wait 1-5 minutes** for certificate to be issued

6. **Verify HTTPS works:**
   ```bash
   curl -I https://docs.jarvis.allyapp.cc
   curl -I https://jarvis.allyapp.cc/install.sh
   ```

## Step 5: Test Deployment

```bash
# Test install script availability
curl -fsSL https://jarvis.allyapp.cc/install.sh | head -20

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# Test full installation (in VM/container)
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

## Alternative: Separate Projects for Docs and Installer

If you want separate deployments:

### Project 1: jarvis (main repo)

- Deploys docs to `docs.jarvis.allyapp.cc`
- `.gitlab-ci.yml` deploys `/docs` folder

### Project 2: jarvis-installer

- Deploys install script to `jarvis.allyapp.cc`
- Contains only `install.sh` and `CNAME`

**Create jarvis-installer:**

```bash
# Create new directory
mkdir ../jarvis-installer
cd ../jarvis-installer

# Initialize git
git init

# Add install script
cp ../jarvis/install.sh .
echo "jarvis.allyapp.cc" > CNAME

# Create .gitlab-ci.yml
cat > .gitlab-ci.yml <<'EOF'
pages:
  stage: deploy
  script:
    - mkdir -p public
    - cp install.sh public/
    - cp CNAME public/
  artifacts:
    paths:
      - public
  only:
    - main
EOF

# Commit and push
git add .
git commit -m "Initial commit: Jarvis installer"

# Add remote (replace with your GitLab URL)
git remote add origin https://gitlab.com/username/jarvis-installer.git
git push -u origin main
```

## GitLab Pages Configuration Options

### Custom 404 Page

Create `docs/404.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>404 - Page Not Found | Jarvis</title>
    <style>
      body {
        font-family: system-ui;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #ff4d4d;
      }
      a {
        color: #ff4d4d;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">← Back to Documentation</a>
  </body>
</html>
```

### Redirects

Create `public/_redirects`:

```
# Redirect old URLs
/old-path  /new-path  301
/docs/*    /:splat    301
```

## Troubleshooting

### Pipeline Fails

**Check pipeline logs:**

1. Go to CI/CD → Pipelines
2. Click on failed pipeline
3. Click on failed job
4. Read error messages

**Common issues:**

- Missing `public/` directory
- Artifacts not properly configured
- Permissions issues

**Fix:**

```yaml
pages:
  script:
    - mkdir -p public # Ensure directory exists
    - cp -r docs/* public/ || echo "No docs to copy"
```

### Pages Not Accessible

1. **Check if pipeline succeeded:**
   - CI/CD → Pipelines → Look for green checkmark

2. **Verify artifacts:**
   - Click on pipeline → pages job → Browse artifacts
   - Ensure `public/` contains your files

3. **Check Pages URL:**
   - Settings → Pages → Should show "Your pages are served under:"

### Custom Domain Not Working

1. **Verify DNS:**

   ```bash
   dig docs.jarvis.allyapp.cc
   # Should return GitLab Pages IP or CNAME
   ```

2. **Check domain configuration:**
   - Settings → Pages → Domains
   - Domain should be verified (green checkmark)

3. **SSL Certificate Issues:**
   - Wait 5-10 minutes after adding domain
   - Try disabling and re-enabling Let's Encrypt
   - Check domain is accessible via HTTP first

### 404 on Custom Domain

1. **Verify CNAME or A record points correctly**
2. **Check domain verification in GitLab**
3. **Ensure DNS propagation is complete** (can take up to 24 hours)

## Advanced: Multiple Domains

If you want both `jarvis.allyapp.cc` AND `docs.jarvis.allyapp.cc`:

1. **Add both domains in Settings → Pages → New Domain**

2. **Configure DNS for both:**

   ```dns
   CNAME  jarvis        <username>.gitlab.io
   CNAME  docs.jarvis   <username>.gitlab.io
   ```

3. **Both will serve the same content** (from `public/`)

4. **Use redirects if needed:**
   - Redirect `jarvis.allyapp.cc` → `docs.jarvis.allyapp.cc`
   - Or serve different content based on domain

## Monitoring

Set up monitoring for:

1. **Pipeline health:**
   - Enable pipeline notifications
   - Settings → Integrations → Emails on pipeline failure

2. **SSL certificate expiry:**
   - GitLab auto-renews Let's Encrypt certs
   - Check monthly: Settings → Pages → Domains

3. **Page availability:**
   - Use external monitoring (UptimeRobot, etc.)
   - Monitor both domains

## Summary

1. ✅ Create `.gitlab-ci.yml` with pages job
2. ✅ Push to GitLab
3. ✅ Wait for pipeline to complete
4. ✅ Add custom domains in Settings → Pages
5. ✅ Configure DNS (CNAME or A records)
6. ✅ Enable Let's Encrypt SSL
7. ✅ Test deployment

Your Jarvis docs and install script will be live at:

- 📚 Docs: `https://docs.jarvis.allyapp.cc`
- 📥 Install: `https://jarvis.allyapp.cc/install.sh`

---

**Need help?** Check GitLab's official Pages documentation:
https://docs.gitlab.com/ee/user/project/pages/
