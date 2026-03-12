# 🎯 J.A.R.V.I.S. Rebranding Status

## ✅ Completed
- ✅ README.md fully rebranded (command examples changed to `jarvis`)
- ✅ README.md credits preserved (references to upstream OpenClaw kept)
- ✅ Discord skill documentation updated
- ✅ Discord implementation with dual permission checking
- ✅ GitLab CI/CD configuration migrated
- ✅ Installation guide created (INSTALL_FROM_SOURCE.md)
- ✅ Binary renamed: openclaw.mjs → jarvis.mjs
- ✅ Podman env renamed: openclaw.podman.env → jarvis.podman.env
- ✅ package.json fully rebranded (name, bin, URLs)
- ✅ Android package name: ai.openclaw.app → ai.jarvis.app
- ✅ iOS bundle ID prefix: ai.openclaw → ai.jarvis
- ✅ .pre-commit-config.yaml updated (cache paths and header)
- ✅ Quick-start installation script created (install-jarvis.sh)

## ⚠️ Still References "openclaw"

These files still contain `openclaw` references and should be updated for complete rebranding:

### Critical Files (Core Functionality)

1. **package.json**
   - `name`: "openclaw" → Should be "jarvis"
   - `homepage`: GitHub URLs → GitLab URLs
   - `repository.url`: GitHub → GitLab
   - Binary name: `"jarvis": "jarvis.mjs"` (rename from openclaw.mjs)

2. **AGENTS.md** (Agent Guidelines)
   - Contains many CLI examples with `openclaw` commands
   - Documentation URLs reference docs.openclaw.ai
   - Should update to `jarvis` command and jarvis-ai.dev URLs

3. **CHANGELOG.md**
   - Historically accurate, could stay as-is OR
   - Add note at top: "Historical entries preserved from OpenClaw upstream"

4. **CAMPAIGN_SUMMARY.md**
   - Contains old repository reference
   - Should update to reflect J.A.R.V.I.S. identity

### Configuration Files

5. **.pre-commit-config.yaml**
   - Header comment and cache paths
   - Path: `/var/tmp/openclaw-compile-cache` → `/var/tmp/jarvis-compile-cache`

6. **.gitlab-ci.yml**
   - Already migrated but contains some env var names with OPENCLAW prefix
   - Variables like `OPENCLAW_TEST_WORKERS` → Could stay or rebrand to `JARVIS_*`

### iOS/macOS/Android Apps

7. **package.json scripts**
   - `android:run`: Uses `ai.openclaw.app` package name
   - `ios:*` scripts: Reference "OpenClaw" project names
   - `mac:open`: Opens `OpenClaw.app`

8. **Android Package Name**
   - Current: `ai.openclaw.app`
   - Should be: `ai.jarvis.app` OR `cc.allyapp.jarvis`
   - Files to update:
     - `apps/android/app/build.gradle.kts`
     - `apps/android/app/src/main/AndroidManifest.xml`

9. **iOS Bundle Identifier**
   - Current: Likely `ai.openclaw.ios`
   - Should be: `ai.jarvis.ios` OR `cc.allyapp.jarvis`
   - Files to update:
     - `apps/ios/project.yml`
     - `apps/ios/Sources/Info.plist`

### Binary/Executable Names

10. **CLI Entry Point**
    - Current: `openclaw.mjs`
    - Should rename to: `jarvis.mjs`
    - Update all references in package.json

## 🚧 Recommended Rebranding Strategy

### Phase 1: Core CLI (Highest Priority)
```bash
# 1. Rename main executable
mv openclaw.mjs jarvis.mjs

# 2. Update package.json
- name: "jarvis"
- bin: { "jarvis": "jarvis.mjs" }
- Update all script commands

# 3. Update AGENTS.md examples
Replace all `openclaw` CLI commands with `jarvis`
```

### Phase 2: Mobile Apps
```bash
# Android
1. Change package name in build.gradle.kts
2. Update AndroidManifest.xml
3. Rename directory structure: com/openclaw/app → ai/jarvis/app
4. Update all imports

# iOS
1. Update bundle identifier in project.yml
2. Update Info.plist files
3. Rename Xcode scheme if needed
```

### Phase 3: Documentation & Config
```bash
# Update documentation
1. AGENTS.md - Replace commands and URLs
2. CAMPAIGN_SUMMARY.md - Update repo references
3. .pre-commit-config.yaml - Update paths

# Update URLs
- docs.openclaw.ai → docs.jarvis-ai.dev
- openclaw.ai → jarvis-ai.cc (or equivalent)
```

## 📋 Quick Rebrand Script

Here's what needs to be run for complete rebranding:

```bash
#!/bin/bash
# Complete J.A.R.V.I.S. Rebranding

# 1. Rename main executable
git mv openclaw.mjs jarvis.mjs

# 2. Update package.json (manual editing required)
# - name: "jarvis"
# - bin.jarvis: "jarvis.mjs"
# - homepage: GitLab URL
# - repository.url: GitLab URL

# 3. Update AGENTS.md
sed -i 's/openclaw /jarvis /g' AGENTS.md
sed -i 's/`openclaw /`jarvis /g' AGENTS.md
sed -i 's/docs.openclaw.ai/docs.jarvis-ai.dev/g' AGENTS.md
sed -i 's/openclaw.ai/jarvis-ai.cc/g' AGENTS.md

# 4. Android package rename (requires more complex refactoring)
# This should be done carefully with IDE refactoring tools

# 5. iOS bundle ID update
# Update in project.yml and regenerate Xcode project

# 6. Update cache paths
sed -i 's/openclaw-compile-cache/jarvis-compile-cache/g' .pre-commit-config.yaml

# 7. Commit changes
git add -A
git commit -m "feat: Complete rebranding to J.A.R.V.I.S."
```

## ⚠️ Important Notes

### What to Keep as "openclaw"

These should **NOT** be changed:

1. **README.md Credits Section**
   - "Built on OpenClaw" (upstream acknowledgment)
   - "fork of OpenClaw" (factually accurate)
   - GitHub links to `openclaw/openclaw` (upstream reference)

2. **Git History**
   - Historical commit messages
   - Old branch names (already merged)

3. **External References**
   - Any hardcoded references to the upstream OpenClaw project
   - Historical changelog entries (unless you add a header note)

### Breaking Changes

Rebranding these will cause breaking changes:

1. **Package Name Change**
   - Users who installed `npm install -g openclaw` won't get updates
   - Need migration path: deprecate `openclaw` package, publish as `jarvis`

2. **Config File Location**
   - Current: `~/.openclaw/`
   - New: `~/.jarvis/`
   - Need migration tool: `jarvis migrate-config`

3. **Android Package Name**
   - Existing users will see it as a new app
   - Cannot update existing installation
   - Need clear communication about reinstalling

4. **iOS Bundle ID**
   - Same issue as Android
   - Will appear as completely new app

## 🎯 Recommendation

For your first complete build from source:

### Option A: Full Rebrand (Clean Slate)
- Do all rebranding now
- No legacy baggage
- Clear J.A.R.V.I.S. identity
- Users install fresh

### Option B: Gradual Rebrand (Safer)
- Keep binary name `openclaw` initially
- Rebrand UI/docs/branding only
- Allows testing before breaking changes
- Migrate in v2.0

### Option C: Fork Identity (Recommended for Now)
- Keep `openclaw` as CLI name internally
- Brand as "JARVIS" in UI/docs/apps
- Document as "J.A.R.V.I.S. (powered by OpenClaw)"
- Easier for users who know OpenClaw

## 📊 Current Status Summary

| Component | Status | Priority |
|-----------|--------|----------|
| README.md | ✅ Complete | - |
| CLI Commands (user-facing) | ✅ Complete | - |
| Discord Skill | ✅ Complete | - |
| GitLab CI | ✅ Complete | - |
| Installation Guide | ✅ Complete | - |
| package.json | ✅ Complete | - |
| Binary name | ✅ jarvis.mjs | - |
| AGENTS.md | ⚠️ Not done | 🟡 Medium |
| Android package | ✅ Complete | - |
| iOS bundle ID | ✅ Complete | - |
| Config paths | ⚠️ ~/.openclaw/ | 🟢 Low |
| Cache paths | ✅ Complete | - |

---

## ✅ Next Steps

1. **Review** this document
2. **Decide** on rebranding strategy (A, B, or C above)
3. **Execute** the chosen strategy
4. **Test** the installation from source
5. **Document** any breaking changes
6. **Communicate** to users if deployed

---

Built with ❤️ by the J.A.R.V.I.S. team
