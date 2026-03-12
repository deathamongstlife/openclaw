# GitLab Pages Quick Start for Jarvis

**Goal:** Deploy Jarvis docs and install script to `docs.jarvis.allyapp.cc` and `jarvis.allyapp.cc` using GitLab Pages.

## Step 1: Update GitLab CI Configuration

You have **two options**:

### Option A: Replace Existing .gitlab-ci.yml (Recommended)

```bash
# Backup current file
cp .gitlab-ci.yml .gitlab-ci.yml.backup

# Use the Pages configuration
cp .gitlab-ci-pages.yml .gitlab-ci.yml

# Commit
git add .gitlab-ci.yml
git commit -m "Enable GitLab Pages for Jarvis"
git push origin main
```

### Option B: Merge Pages Job into Existing .gitlab-ci.yml

Add this `pages` job to your existing `.gitlab-ci.yml`:

```yaml
# Add 'deploy' to stages if not present
stages:
  - build
  - test
  - deploy  # Add this

# Add the pages job
pages:
  stage: deploy
  script:
    - mkdir -p public
    - cp -r docs/* public/
    - cp install.sh public/install.sh
  artifacts:
    paths:
      - public
  only:
    - main
  environment:
    name: production
    url: https://docs.jarvis.allyapp.cc
```

## Step 2: Push and Verify Pipeline

```bash
# Push changes
git push origin main

# Wait 1-2 minutes, then check pipeline
# Go to: Your Project → CI/CD → Pipelines
# Look for green checkmark on 'pages' job
```

## Step 3: Access Pages Settings

1. Go to your GitLab project
2. Navigate to: **Settings** → **Pages**
3. You should see: "Your pages are served under: https://[username].gitlab.io/jarvis"

## Step 4: Add Custom Domains

1. In **Settings → Pages**, click **"New Domain"**

2. **For docs.jarvis.allyapp.cc:**
   - Domain: `docs.jarvis.allyapp.cc`
   - Leave certificate blank (we'll use automatic)
   - Click "Create New Domain"

3. **For jarvis.allyapp.cc:**
   - Click "New Domain" again
   - Domain: `jarvis.allyapp.cc`
   - Leave certificate blank
   - Click "Create New Domain"

## Step 5: Configure DNS

Add these DNS records to your `allyapp.cc` domain registrar:

### For GitLab.com:

```
Type: CNAME
Name: docs.jarvis
Value: <your-username>.gitlab.io
TTL: 3600

Type: CNAME
Name: jarvis
Value: <your-username>.gitlab.io
TTL: 3600
```

**Example** (if your GitLab username is "deathamongstlife"):
```
Type: CNAME
Name: docs.jarvis
Value: deathamongstlife.gitlab.io
TTL: 3600

Type: CNAME
Name: jarvis
Value: deathamongstlife.gitlab.io
TTL: 3600
```

### For Self-Hosted GitLab:

Ask your GitLab admin for the Pages domain or IP, then:

```
Type: CNAME
Name: docs.jarvis
Value: pages.your-gitlab-instance.com
TTL: 3600

Type: CNAME
Name: jarvis
Value: pages.your-gitlab-instance.com
TTL: 3600
```

**OR** (if admin provides IP address):

```
Type: A
Name: docs.jarvis
Value: <IP address from admin>
TTL: 3600

Type: A
Name: jarvis
Value: <IP address from admin>
TTL: 3600
```

## Step 6: Enable HTTPS

1. Go back to **Settings → Pages → Domains**
2. Click on `docs.jarvis.allyapp.cc`
3. Check: **"Automatic certificate management using Let's Encrypt"**
4. Click **"Save Changes"**
5. Repeat for `jarvis.allyapp.cc`
6. Wait 1-5 minutes for certificate provisioning

## Step 7: Test

```bash
# Wait for DNS propagation (5-30 minutes)
# Check DNS
dig docs.jarvis.allyapp.cc
dig jarvis.allyapp.cc

# Test install script
curl -I https://jarvis.allyapp.cc/install.sh

# Test docs
curl -I https://docs.jarvis.allyapp.cc

# Test full installation
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

## Troubleshooting

### "Pages are not enabled on this instance"

**For Self-Hosted GitLab:**

You need to ask your GitLab administrator to enable Pages. Send them this:

```
Hi [Admin Name],

Could you please enable GitLab Pages on our instance?

I need to deploy documentation for the Jarvis project.

Documentation: https://docs.gitlab.com/ee/administration/pages/

Thank you!
```

**For GitLab.com:**
Pages should already be enabled. If not, contact GitLab support.

### Pipeline Fails

1. **Check logs:**
   - CI/CD → Pipelines → Click failed pipeline → Click failed job

2. **Common issues:**
   - Missing `docs/` directory → Verify it exists
   - Missing `install.sh` → Verify it exists
   - Permissions issue → Check file permissions

3. **Fix:**
   ```bash
   # Verify files exist
   ls -la docs/
   ls -la install.sh

   # Re-run pipeline
   git commit --allow-empty -m "Trigger pipeline"
   git push origin main
   ```

### Custom Domain Shows 404

1. **Verify domain is added in Settings → Pages → Domains**
2. **Check DNS propagation:**
   ```bash
   dig docs.jarvis.allyapp.cc
   # Should return GitLab Pages IP or CNAME
   ```
3. **Wait up to 24 hours for DNS**
4. **Try accessing via GitLab's default URL first:**
   `https://[username].gitlab.io/jarvis`

### SSL Certificate Not Working

1. **Check domain is verified** (Settings → Pages → Domains → should have green checkmark)
2. **Wait 5-10 minutes** after enabling Let's Encrypt
3. **Try disabling and re-enabling** "Automatic certificate management"
4. **Verify DNS is correct** (must point to GitLab Pages)

## DNS Provider Specific Instructions

### Cloudflare

1. Go to DNS settings for `allyapp.cc`
2. Add CNAME record:
   - Name: `docs.jarvis`
   - Target: `<username>.gitlab.io`
   - Proxy status: **DNS only** (gray cloud, NOT orange)
   - TTL: Auto
3. Add CNAME record:
   - Name: `jarvis`
   - Target: `<username>.gitlab.io`
   - Proxy status: **DNS only** (gray cloud)
   - TTL: Auto

### Namecheap

1. Go to Advanced DNS
2. Add CNAME Record:
   - Host: `docs.jarvis`
   - Value: `<username>.gitlab.io`
   - TTL: Automatic
3. Add CNAME Record:
   - Host: `jarvis`
   - Value: `<username>.gitlab.io`
   - TTL: Automatic

### GoDaddy

1. Go to DNS Management
2. Add CNAME:
   - Name: `docs.jarvis`
   - Value: `<username>.gitlab.io`
   - TTL: 1 Hour
3. Add CNAME:
   - Name: `jarvis`
   - Value: `<username>.gitlab.io`
   - TTL: 1 Hour

## What Gets Deployed

After successful deployment, your Pages will serve:

- **Root (`/`):** Landing page with install instructions
- **Docs (`/docs/` or custom domain):** All documentation from `docs/` folder
- **Install script (`/install.sh`):** The install script

## Verification Checklist

- [ ] `.gitlab-ci.yml` has `pages` job
- [ ] Pipeline completed successfully (green checkmark)
- [ ] Pages URL accessible: `https://[username].gitlab.io/jarvis`
- [ ] Custom domains added in Settings → Pages
- [ ] DNS records configured
- [ ] DNS propagation complete (check with `dig`)
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] `https://docs.jarvis.allyapp.cc` works
- [ ] `https://jarvis.allyapp.cc/install.sh` works
- [ ] Full install command works

## Next Steps

Once deployed:

1. **Update README** with new install command
2. **Test installation** on a fresh system
3. **Monitor pipeline** for any failures
4. **Set up monitoring** (optional)

## Support

- **GitLab Pages Docs:** https://docs.gitlab.com/ee/user/project/pages/
- **Full Guide:** See `GITLAB_PAGES_DEPLOYMENT.md`
- **Issues:** File an issue on your GitLab project

---

**Ready to deploy!** Follow the 7 steps above and you'll be live in ~30 minutes. 🚀
