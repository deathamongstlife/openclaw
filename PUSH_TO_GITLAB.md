# Push to GitLab Instructions

The rebrand and deployment setup is complete. Now push to your GitLab repository.

## What's Been Done

✅ Complete rebranding: OpenClaw → Jarvis (2,765 files changed)
✅ VPS deployment scripts created
✅ GitLab CI/CD configuration added
✅ All changes committed locally

## Ready to Push

**Branch:** `readme-jarvis-rebrand`
**GitLab Remote:** `https://git.allyapp.cc/everest/j.a.r.v.i.s.git`
**Commits:** 2 commits ready to push

### Commits to be pushed:

1. **Complete OpenClaw → Jarvis rebranding and VPS deployment setup**
   - 2,765 files changed
   - Full rebranding
   - All deployment scripts and guides

2. **Add comprehensive GitLab CI/CD configuration**
   - GitLab CI pipeline
   - Docker, npm, Pages jobs

## Push from VPS or Local Machine

On your machine with GitLab credentials configured:

```bash
# Navigate to repository
cd /opt/jarvis

# Add remote if not already added
git remote add gitlab https://git.allyapp.cc/everest/j.a.r.v.i.s.git

# Fetch latest
git fetch origin

# Push the branch
git push gitlab readme-jarvis-rebrand

# Or push to main
git push gitlab readme-jarvis-rebrand:main
```

## Alternative: Use SSH

If you have SSH keys configured:

```bash
# Update remote to use SSH
git remote set-url gitlab git@git.allyapp.cc:everest/j.a.r.v.i.s.git

# Push
git push gitlab readme-jarvis-rebrand
```

## Alternative: Use Personal Access Token

```bash
# Create token at: https://git.allyapp.cc/-/profile/personal_access_tokens
# Scopes needed: api, write_repository

# Push with token
git push https://oauth2:<your-token>@git.allyapp.cc/everest/j.a.r.v.i.s.git readme-jarvis-rebrand
```

## After Pushing

### 1. Merge Request (Recommended)

Create a merge request on GitLab:

```
https://git.allyapp.cc/everest/j.a.r.v.i.s/-/merge_requests/new?merge_request[source_branch]=readme-jarvis-rebrand
```

### 2. Direct Push to Main (Alternative)

```bash
git push gitlab readme-jarvis-rebrand:main
```

## Verify GitLab CI

After pushing, check the pipeline:

```
https://git.allyapp.cc/everest/j.a.r.v.i.s/-/pipelines
```

The pipeline will run:
- ✅ Install dependencies
- ✅ Lint and typecheck
- ✅ Run tests
- ✅ Build project
- ✅ Deploy to GitLab Pages (on main branch)

## Enable GitLab Pages

After the pipeline runs:

1. Go to **Settings → Pages**
2. Add custom domains:
   - `docs.jarvis.allyapp.cc`
   - `jarvis.allyapp.cc`
3. Add DNS records (see `DNS_SETUP.md`)

## Files to Review

Before pushing, you may want to review:

- `.gitlab-ci.yml` - GitLab CI configuration
- `install.sh` - Rebranded installer
- `deploy-jarvis-caddy.sh` - VPS deployment script
- `DEPLOY_NOW.md` - Quick deployment guide

## Summary

All rebranding and deployment setup is complete and committed locally.

**To deploy:**
1. Push to GitLab from authenticated machine
2. Pipeline will run automatically
3. Deploy to VPS using `deploy-jarvis-caddy.sh`

---

**Need to sync to VPS?**

```bash
# From your VPS
cd /opt/jarvis
git fetch --all
git checkout readme-jarvis-rebrand
git pull

# Then deploy
sudo bash deploy-jarvis-caddy.sh
```
