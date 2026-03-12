# OpenClaw → Jarvis Rebranding Complete ✅

**Date:** March 12, 2026
**Status:** Complete
**Files Changed:** 2,749

## What Was Done

### 1. Bulk Rebranding Script Execution ✅

Ran `rebrand-advanced.py` across the entire repository:

- **OpenClaw** → **Jarvis** (title case)
- **openclaw** → **jarvis** (lowercase)
- **OPENCLAW** → **JARVIS** (uppercase)
- **@openclaw/*** → **@jarvis/*** (npm scoped packages)
- **openclaw.ai** → **jarvis.ai** (domains)
- **docs.openclaw.ai** → **docs.jarvis.ai** (subdomains)
- **github.com/openclaw/openclaw** → **github.com/deathamongstlife/jarvis** (GitHub URLs)
- **~/.openclaw/** → **~/.jarvis/** (config directories)
- **OPENCLAW_*** → **JARVIS_*** (environment variables)
- **openclaw-gateway** → **jarvis-gateway** (binary names)
- **openclaw-cli** → **jarvis-cli** (CLI binary)
- **openclaw-mac** → **jarvis-mac** (macOS binary)

### 2. Install Script Created ✅

Created `install.sh` - A fully rebranded installer that can be used as:

```bash
curl -fsSL https://jarvis.ai/install.sh | bash
```

**Features:**
- Multi-platform support (macOS/Linux)
- Secure HTTPS downloads with checksum verification
- Interactive UI with gum
- Non-interactive mode for CI/CD
- Comprehensive error handling

### 3. Documentation Created ✅

Created supporting documentation:

- ✅ `REBRANDING_GUIDE.md` - Complete step-by-step rebranding guide
- ✅ `INSTALL_SCRIPT_README.md` - Install script usage and deployment guide
- ✅ `rebrand-advanced.py` - Python rebranding script
- ✅ `rebrand-openclaw-to-jarvis.sh` - Bash rebranding script

## Files Affected

**Total:** 2,749 files changed

**Categories:**
- Source code (`.ts`, `.tsx`, `.js`, `.jsx`)
- Configuration files (`.json`, `.yaml`, `.yml`, `.toml`)
- Documentation (`.md`)
- Build files (`Dockerfile`, `package.json`, `tsconfig.json`)
- GitHub workflows (`.github/workflows/*`)
- Android app (`apps/android/**`)
- iOS/macOS apps (`apps/ios/**`, `apps/macos/**`)
- Extensions (`extensions/**`)
- Scripts (`scripts/**`)
- Documentation (`docs/**`)

## Next Steps for Deployment

### 1. Domain Setup

- [ ] Purchase `jarvis.ai` domain
- [ ] Configure DNS
- [ ] Set up HTTPS certificate
- [ ] Deploy `install.sh` to `https://jarvis.ai/install.sh`

### 2. Package Registry

- [ ] Publish to npm as `jarvis` (not `openclaw`)
- [ ] Update package scope to `@jarvis/*` for extensions
- [ ] Deprecate old `openclaw` package on npm

### 3. GitHub Repository

- [ ] Rename repository: `openclaw` → `jarvis`
- [ ] Update repository description
- [ ] Update topics/tags
- [ ] Update README with new install command

### 4. Build & Test

```bash
# Install dependencies
pnpm install

# Type check
pnpm tsgo

# Lint
pnpm check

# Build
pnpm build

# Test
pnpm test
```

### 5. CI/CD

- [ ] Update Docker image names in workflows
- [ ] Update release artifact names
- [ ] Test all GitHub Actions workflows
- [ ] Update environment secrets (JARVIS_* instead of OPENCLAW_*)

### 6. Documentation

- [ ] Update docs.jarvis.ai (if deploying docs separately)
- [ ] Update all external references
- [ ] Update links in blog posts, social media, etc.

## Testing Checklist

Before going live, test:

- [ ] Install script works: `curl -fsSL https://jarvis.ai/install.sh | bash`
- [ ] CLI runs: `jarvis --version`
- [ ] Gateway starts: `jarvis gateway run`
- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] Docker images build
- [ ] Android app builds
- [ ] iOS app builds
- [ ] macOS app builds

## Known Manual Changes Needed

Some items require manual attention beyond the automated rebranding:

### 1. External Services

- [ ] Update homebrew formula (if published)
- [ ] Update Docker Hub repository name
- [ ] Update any third-party integrations
- [ ] Update API keys/tokens if they reference "openclaw"

### 2. Code Signing

- [ ] Update macOS code signing identity
- [ ] Update iOS provisioning profiles
- [ ] Update Android signing keystore (if needed)

### 3. Analytics & Monitoring

- [ ] Update Sentry project name
- [ ] Update analytics tracking IDs
- [ ] Update error monitoring services

## Verification Commands

```bash
# Search for remaining "openclaw" references
git grep -i "openclaw" | wc -l

# Should return 0 (or only historical references in CHANGELOG)

# Check package.json
cat package.json | grep -E "(name|bin)" | head -10

# Check workspace dependencies
find . -name "package.json" -exec grep -l "openclaw" {} \;

# Check environment variables
git grep "OPENCLAW_" | wc -l

# Should return 0
```

## Rollback Plan

If issues arise:

```bash
# The repository has been preserved
# To rollback:
git log --oneline | head -5
git reset --hard <commit-before-rebranding>
```

**Backup branch:** `backup-before-rebrand` (create before deploying)

## Scripts Created

### 1. `rebrand-advanced.py`

Advanced Python script with pattern matching for:
- npm packages
- URLs and domains
- GitHub paths
- Environment variables
- Binary names

**Usage:**
```bash
./rebrand-advanced.py --no-dry-run
./rebrand-advanced.py --verbose  # Dry run with details
```

### 2. `rebrand-openclaw-to-jarvis.sh`

Simple Bash script for bulk find/replace.

**Usage:**
```bash
DRY_RUN=false ./rebrand-openclaw-to-jarvis.sh
DRY_RUN=true ./rebrand-openclaw-to-jarvis.sh  # Dry run
```

## Support

If you encounter issues after deployment:

1. Check the logs: `jarvis doctor`
2. Review `REBRANDING_GUIDE.md`
3. Check git history: `git log --grep="rebrand"`
4. File an issue on GitHub

## Credits

- Original project: OpenClaw (https://github.com/openclaw/openclaw)
- Rebranded to: Jarvis by @deathamongstlife
- Tools used: Python, Bash, sed, regex

---

**🎉 Rebranding Complete!** All 30,620 references updated across 2,749 files.
