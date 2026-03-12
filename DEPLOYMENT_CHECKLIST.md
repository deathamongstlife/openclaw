# Jarvis Deployment Checklist

Complete guide to deploying Jarvis with custom domains.

## 🎯 Goals

- ✅ Install script available at: `https://jarvis.allyapp.cc/install.sh`
- ✅ Documentation available at: `https://docs.jarvis.allyapp.cc`
- ✅ Full rebranding from OpenClaw → Jarvis complete

## 📋 Pre-Deployment Checklist

### 1. Repository Status

- [x] Rebranding complete (2,749 files updated)
- [x] Install script created and updated (`install.sh`)
- [x] Docs CNAME updated (`docs/CNAME`)
- [ ] All tests passing (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Repository pushed to GitHub

### 2. Domain Setup

- [ ] DNS access to `allyapp.cc` domain
- [ ] Ability to add CNAME records

### 3. GitHub Repository

- [ ] Repository renamed to `jarvis` (from `openclaw`)
- [ ] Repository is public (for GitHub Pages)
- [ ] GitHub Pages enabled

## 🚀 Deployment Steps

### Step 1: DNS Configuration

Add these DNS records to your `allyapp.cc` domain:

```dns
# Documentation subdomain
Type: CNAME
Name: docs.jarvis
Host: @
Value: deathamongstlife.github.io
TTL: 3600

# Install script subdomain
Type: CNAME
Name: jarvis
Host: @
Value: deathamongstlife.github.io
TTL: 3600
```

**DNS Provider Examples:**

**Cloudflare:**
1. Go to DNS settings
2. Add CNAME record: `docs.jarvis` → `deathamongstlife.github.io`
3. Add CNAME record: `jarvis` → `deathamongstlife.github.io`
4. Ensure proxy status is "DNS only" (gray cloud)

**Namecheap:**
1. Go to Advanced DNS
2. Add CNAME Record:
   - Host: `docs.jarvis`
   - Value: `deathamongstlife.github.io`
3. Add CNAME Record:
   - Host: `jarvis`
   - Value: `deathamongstlife.github.io`

**GoDaddy:**
1. Go to DNS Management
2. Add CNAME:
   - Name: `docs.jarvis`
   - Value: `deathamongstlife.github.io`
3. Add CNAME:
   - Name: `jarvis`
   - Value: `deathamongstlife.github.io`

### Step 2: GitHub Pages Setup

#### For Documentation (docs.jarvis.allyapp.cc)

1. **Go to GitHub repository settings:**
   ```
   https://github.com/deathamongstlife/jarvis/settings/pages
   ```

2. **Configure source:**
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/docs`

3. **Add custom domain:**
   - Custom domain: `docs.jarvis.allyapp.cc`
   - Check "Enforce HTTPS" after DNS propagates

4. **Verify CNAME file:**
   ```bash
   cat docs/CNAME
   # Should output: docs.jarvis.allyapp.cc
   ```

#### For Install Script (jarvis.allyapp.cc)

**Option A: Same repo, gh-pages branch**

Run the setup script:
```bash
./setup-docs-deployment.sh
# Choose option 2
```

**Option B: Separate repository**

Run the setup script:
```bash
./setup-docs-deployment.sh
# Choose option 3
```

Then enable GitHub Pages for that repo.

### Step 3: Verification

Wait for DNS propagation (5-30 minutes typically), then test:

```bash
# Test DNS resolution
dig docs.jarvis.allyapp.cc
dig jarvis.allyapp.cc

# Test install script availability
curl -I https://jarvis.allyapp.cc/install.sh

# Test docs availability
curl -I https://docs.jarvis.allyapp.cc

# Test actual installation (in a VM or container)
curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
```

### Step 4: Update Repository

Update README and other references:

```bash
# Update README with new URLs
# Update CONTRIBUTING.md
# Update any hardcoded URLs in code

git add .
git commit -m "Update deployment URLs to jarvis.allyapp.cc"
git push origin main
```

## 📦 npm Package Deployment

### Step 1: Update package.json

Verify these fields:

```json
{
  "name": "jarvis",
  "version": "2026.3.9",
  "description": "Your own personal AI assistant",
  "bin": {
    "jarvis": "./dist/cli/index.js"
  },
  "homepage": "https://jarvis.allyapp.cc",
  "repository": {
    "type": "git",
    "url": "https://github.com/deathamongstlife/jarvis.git"
  }
}
```

### Step 2: Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish --access public

# Verify
npm view jarvis
```

### Step 3: Deprecate old package (optional)

If you were using the `openclaw` package:

```bash
npm deprecate openclaw "Package renamed to jarvis. Install with: npm install jarvis"
```

## 🔍 Testing Checklist

After deployment, verify:

### Install Script

- [ ] `curl -fsSL https://jarvis.allyapp.cc/install.sh` returns the script
- [ ] Script contains "Jarvis" (not "OpenClaw")
- [ ] Installation works: `curl -fsSL https://jarvis.allyapp.cc/install.sh | bash`
- [ ] HTTPS works (no certificate warnings)

### Documentation

- [ ] `https://docs.jarvis.allyapp.cc` loads successfully
- [ ] All pages render correctly
- [ ] Internal links work
- [ ] Search works (if using Mintlify)
- [ ] No "openclaw" references visible

### Package

- [ ] `npm install -g jarvis` works
- [ ] `jarvis --version` shows correct version
- [ ] `jarvis --help` works
- [ ] All CLI commands function

## 🐛 Troubleshooting

### DNS Issues

**Problem:** Domain not resolving

**Solution:**
```bash
# Check DNS propagation
dig +short docs.jarvis.allyapp.cc
nslookup docs.jarvis.allyapp.cc

# Check for errors
dig docs.jarvis.allyapp.cc +trace

# Wait for propagation (can take up to 24 hours)
# Use: https://dnschecker.org
```

### GitHub Pages 404

**Problem:** Getting 404 on GitHub Pages

**Solutions:**
1. Verify CNAME file exists and contains correct domain
2. Check GitHub Pages settings are correct
3. Wait 5-10 minutes for GitHub to build
4. Check GitHub Actions tab for deployment status
5. Ensure repository is public

### SSL Certificate Errors

**Problem:** HTTPS showing certificate errors

**Solutions:**
1. Wait for GitHub to provision certificate (can take 1-24 hours)
2. Ensure DNS is correctly configured
3. Temporarily disable "Enforce HTTPS" in GitHub Pages settings
4. Re-add custom domain in GitHub Pages settings

### Install Script Not Found

**Problem:** 404 when accessing install.sh

**Solutions:**
1. Verify install.sh is in correct location
2. Check GitHub Pages is serving from correct branch/folder
3. Verify CNAME is correct
4. Check file is committed and pushed

## 📊 Monitoring

Set up monitoring for:

1. **Uptime Monitoring:**
   - Use UptimeRobot or StatusCake
   - Monitor: `https://jarvis.allyapp.cc/install.sh`
   - Monitor: `https://docs.jarvis.allyapp.cc`

2. **SSL Certificate Monitoring:**
   - Expiry: GitHub Pages auto-renews
   - Check monthly via: `https://www.ssllabs.com/ssltest/`

3. **DNS Monitoring:**
   - Use DNSCheck or similar
   - Alert on DNS changes

## 🎉 Post-Deployment

### Announce the Launch

1. **Update README:**
   ```markdown
   ## Installation

   \`\`\`bash
   curl -fsSL https://jarvis.allyapp.cc/install.sh | bash
   \`\`\`

   ## Documentation

   Visit [docs.jarvis.allyapp.cc](https://docs.jarvis.allyapp.cc)
   ```

2. **Social Media:**
   - Tweet/post about the launch
   - Include install command
   - Link to docs

3. **Community:**
   - Post in Discord/Slack
   - Update pinned messages
   - Update bot messages

### Analytics (Optional)

Add to your docs (if using Mintlify or custom):

1. **Google Analytics:**
   ```html
   <!-- Add to docs/index.html or mint.json -->
   ```

2. **Plausible/Fathom:**
   ```html
   <!-- Privacy-friendly analytics -->
   ```

## 📁 Files Created/Updated

This deployment created:

- ✅ `install.sh` - Rebranded install script
- ✅ `docs/CNAME` - Updated to docs.jarvis.allyapp.cc
- ✅ `DOCS_DEPLOYMENT_GUIDE.md` - Full deployment guide
- ✅ `setup-docs-deployment.sh` - Automated setup script
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file
- ✅ `REBRANDING_COMPLETE_SUMMARY.md` - Rebranding summary
- ✅ `INSTALL_SCRIPT_README.md` - Install script documentation

## 🆘 Need Help?

- 📖 Read: `DOCS_DEPLOYMENT_GUIDE.md` for detailed instructions
- 🔧 Run: `./setup-docs-deployment.sh` for guided setup
- 💬 Ask: File an issue on GitHub
- 🐛 Bug: Check the troubleshooting section above

---

**Ready to deploy?** Follow the steps above in order. Good luck! 🚀
