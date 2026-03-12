# J.A.R.V.I.S. Fork Preparation Plan

## Overview

This document outlines the steps to create a hard fork of Jarvis as "J.A.R.V.I.S." (Just A Rather Very Intelligent System) with all stability improvements from the comprehensive upgrade campaign.

## Current Status

✅ **Branch Created**: `feature/jarvis-upgrade-complete`
✅ **Commit Created**: `fb95da6ef7` - feat: Jarvis → J.A.R.V.I.S. Complete Upgrade
✅ **Changes Staged**: 98 files changed, 17,603 insertions(+), 80 deletions(-)
✅ **Issues Fixed**: 102+ critical bugs across all major components
✅ **Documentation**: 17 comprehensive guides (1.1 MB)

## Phase 1: Repository Setup

### 1.1 Create New Repository

```bash
# On GitHub, create new repository: deathamongstlife/jarvis
# Initialize as empty (no README, no .gitignore)
```

### 1.2 Clone and Setup

```bash
# Clone the new repository
git clone git@github.com:deathamongstlife/jarvis.git
cd jarvis

# Add Jarvis as upstream remote
git remote add jarvis git@github.com:jarvis/jarvis.git

# Fetch all branches
git fetch jarvis

# Create main branch from our feature branch
git checkout -b main jarvis/feature/jarvis-upgrade-complete
```

## Phase 2: Rebranding (Critical Files)

### 2.1 Package Configuration

Files to update:
- [ ] `package.json` - Change name: "jarvis" → "jarvis"
- [ ] `package.json` - Update description, author, repository URLs
- [ ] `apps/*/package.json` - Update all app package names
- [ ] `extensions/*/package.json` - Update extension package names

### 2.2 Documentation

Files to update:
- [ ] `README.md` - Rebrand header, badges, links
- [ ] `CONTRIBUTING.md` - Update contribution guidelines
- [ ] `SECURITY.md` - Update security policy
- [ ] `CHANGELOG.md` - Add fork notice at top
- [ ] `docs/**/*.md` - Update all references to Jarvis → J.A.R.V.I.S.

### 2.3 Code References

Search and replace in code files:
- [ ] `jarvis` → `jarvis` (package imports)
- [ ] `Jarvis` → `J.A.R.V.I.S.` (UI text, logs)
- [ ] `JARVIS_` → `JARVIS_` (environment variables)
- [ ] Repository URLs in all files

Files to search:
```bash
# Find all TypeScript/JavaScript files with "jarvis"
grep -r "jarvis" src/ --include="*.ts" --include="*.js" | wc -l

# Find all documentation files with "Jarvis"
grep -r "Jarvis" docs/ --include="*.md" | wc -l

# Find environment variable references
grep -r "JARVIS_" src/ --include="*.ts" | wc -l
```

### 2.4 Configuration

Files to update:
- [ ] `.github/workflows/*.yml` - Update workflow names
- [ ] `tsconfig.json` - Update paths if needed
- [ ] `vitest.config.ts` - Update test configuration
- [ ] All `*.config.ts` files

### 2.5 Binary and CLI

Files to update:
- [ ] `src/cli/index.ts` - Update CLI banner
- [ ] `src/cli/version.ts` - Update version display
- [ ] Binary name references in scripts
- [ ] Installation scripts

## Phase 3: Branding Assets

### 3.1 Visual Identity

Update:
- [ ] Logo files (if any)
- [ ] Icon files for apps
- [ ] Favicon for web UI
- [ ] macOS app icon
- [ ] iOS/Android app icons

### 3.2 UI Text

Files to search and update:
- [ ] `ui/src/**/*.ts` - All UI component text
- [ ] `apps/macos/Sources/**/*.swift` - macOS app UI
- [ ] `apps/ios/Sources/**/*.swift` - iOS app UI
- [ ] `apps/android/**/*.kt` - Android app UI

## Phase 4: Dependency Management

### 4.1 Internal Dependencies

Update all `workspace:*` references:
- [ ] Review all `package.json` files
- [ ] Update internal package references
- [ ] Verify no broken dependencies

### 4.2 External Dependencies

Keep all external dependencies as-is unless:
- [ ] Security vulnerabilities found
- [ ] Version conflicts after rename
- [ ] New features require updates

## Phase 5: Testing

### 5.1 Build Verification

```bash
# Install dependencies
npm install  # or pnpm install

# Run type checking
npm run tsgo

# Run build
npm run build

# Run tests
npm test

# Run linting
npm run check
```

### 5.2 Functional Testing

Test all major features:
- [ ] Gateway startup/shutdown
- [ ] Cron job execution
- [ ] Telegram integration
- [ ] Discord integration
- [ ] Session management
- [ ] Agent spawning
- [ ] Tool execution
- [ ] Web UI functionality

### 5.3 Platform Testing

Test on all platforms:
- [ ] macOS (Intel + ARM)
- [ ] Linux (Ubuntu, Debian, Arch)
- [ ] Windows (if supported)
- [ ] Docker containers
- [ ] iOS (if applicable)
- [ ] Android (if applicable)

## Phase 6: Documentation Update

### 6.1 Installation Guides

Update all installation documentation:
- [ ] `docs/install/` - Update install commands
- [ ] README installation section
- [ ] Docker setup instructions
- [ ] Platform-specific guides

### 6.2 Configuration Guides

Update configuration documentation:
- [ ] Environment variable names
- [ ] Config file examples
- [ ] Default paths
- [ ] Service names

### 6.3 API Documentation

Update API references:
- [ ] CLI command documentation
- [ ] Tool documentation
- [ ] Plugin/extension API
- [ ] REST API (if any)

## Phase 7: Release Preparation

### 7.1 Version Strategy

Initial J.A.R.V.I.S. release:
- Version: `1.0.0-jarvis.1`
- Tag: `v1.0.0-jarvis.1`
- Based on: Jarvis commit `daf8afc954` + J.A.R.V.I.S. improvements

### 7.2 Changelog

Create J.A.R.V.I.S. changelog:
```markdown
# J.A.R.V.I.S. v1.0.0-jarvis.1

## About J.A.R.V.I.S.

J.A.R.V.I.S. (Just A Rather Very Intelligent System) is a hard fork of Jarvis,
enhanced with 102+ critical bug fixes and reliability improvements.

## What's Improved from Jarvis

- Gateway stability fixes (5 critical issues)
- Cron system reliability (15+ issues fixed)
- Telegram integration improvements (8+ fixes)
- Agent Control Protocol enhancements (12+ fixes)
- Channel extension reliability (20+ fixes)
- Web UI enhancements (30+ new features)
- Infrastructure improvements (10+ enhancements)

For detailed list of fixes, see CAMPAIGN_SUMMARY.md
```

### 7.3 Release Notes

Prepare comprehensive release notes:
- [ ] Feature highlights
- [ ] Breaking changes (none expected)
- [ ] Migration guide from Jarvis
- [ ] Known issues
- [ ] Future roadmap

## Phase 8: Repository Configuration

### 8.1 GitHub Settings

Configure repository:
- [ ] Description: "J.A.R.V.I.S. - Just A Rather Very Intelligent System (Enhanced Jarvis fork)"
- [ ] Topics: `ai`, `agent`, `chatbot`, `typescript`, `jarvis-fork`
- [ ] License: Maintain Jarvis license
- [ ] Branch protection rules
- [ ] Issue templates
- [ ] PR templates

### 8.2 CI/CD Setup

Configure GitHub Actions:
- [ ] Build workflow
- [ ] Test workflow
- [ ] Release workflow
- [ ] Docker build workflow
- [ ] Documentation deployment

### 8.3 Community Files

Add/update:
- [ ] CODE_OF_CONDUCT.md
- [ ] CONTRIBUTING.md
- [ ] SECURITY.md
- [ ] SUPPORT.md
- [ ] Issue templates
- [ ] PR template

## Phase 9: Initial Release

### 9.1 Pre-Release Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] No broken links
- [ ] Version numbers updated
- [ ] Changelog complete
- [ ] License file present
- [ ] Attribution to Jarvis clear

### 9.2 Tag and Release

```bash
# Create annotated tag
git tag -a v1.0.0-jarvis.1 -m "J.A.R.V.I.S. v1.0.0-jarvis.1 - Initial Release"

# Push to GitHub
git push origin main
git push origin v1.0.0-jarvis.1
```

### 9.3 GitHub Release

Create GitHub release:
- [ ] Title: "J.A.R.V.I.S. v1.0.0-jarvis.1 - Initial Release"
- [ ] Description: Full changelog and improvements
- [ ] Attachments: Binaries (if built)
- [ ] Mark as pre-release initially

### 9.4 NPM Publishing (Optional)

If publishing to NPM:
```bash
# Update package name to @jarvis/core or similar
npm publish --access public
```

## Phase 10: Post-Fork Maintenance

### 10.1 Upstream Tracking

Setup upstream sync:
```bash
# Add Jarvis as upstream
git remote add upstream git@github.com:jarvis/jarvis.git

# Fetch upstream changes periodically
git fetch upstream

# Selectively merge or cherry-pick improvements
git cherry-pick <commit-hash>
```

### 10.2 Community Building

- [ ] Announce fork on social media
- [ ] Create Discord/Slack community
- [ ] Write blog post about improvements
- [ ] Reach out to Jarvis community
- [ ] Maintain good relationship with upstream

### 10.3 Documentation Maintenance

Keep documentation up-to-date:
- [ ] Regular updates to README
- [ ] Changelog for each release
- [ ] Migration guides
- [ ] Troubleshooting guides

## Critical Files for Rebranding

### High Priority (Must Change)

```
package.json                          # Project name, description, URLs
README.md                             # Main documentation
src/cli/index.ts                      # CLI banner and help text
src/cli/version.ts                    # Version display
docs/README.md                        # Documentation index
CHANGELOG.md                          # Add fork notice
```

### Medium Priority (Should Change)

```
apps/macos/Sources/Jarvis/Info.plist          # macOS app metadata
apps/ios/Sources/Info.plist                     # iOS app metadata
apps/android/app/build.gradle.kts               # Android app metadata
ui/src/**/*.ts                                  # UI text references
src/gateway/server.impl.ts                      # Gateway logging
src/agents/acp-spawn.ts                         # Agent spawning logs
```

### Low Priority (Can Wait)

```
docs/**/*.md                          # All documentation files
test/**/*.ts                          # Test descriptions
scripts/**/*                          # Script comments
.github/**/*                          # GitHub templates
```

## Search Patterns for Rebranding

### Pattern 1: Package Name
```bash
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "jarvis" {} \;
```

### Pattern 2: Display Name
```bash
find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "Jarvis" {} \;
```

### Pattern 3: Environment Variables
```bash
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.sh" \) -exec grep -l "JARVIS_" {} \;
```

### Pattern 4: URLs
```bash
find . -type f -exec grep -l "github.com/deathamongstlife/jarvis" {} \;
```

### Pattern 5: CLI Commands
```bash
find . -type f \( -name "*.md" -o -name "*.sh" \) -exec grep -l "jarvis gateway\|jarvis cron\|jarvis config" {} \;
```

## Estimated Effort

### Phase 1-2 (Setup & Core Rebranding): 4-6 hours
- Repository setup: 1 hour
- Package configuration: 1-2 hours
- Code references: 2-3 hours

### Phase 3-4 (Assets & Dependencies): 2-3 hours
- Visual assets: 1-2 hours
- UI text updates: 1 hour
- Dependency verification: 0.5 hours

### Phase 5-6 (Testing & Documentation): 6-8 hours
- Build verification: 1 hour
- Functional testing: 3-4 hours
- Documentation updates: 2-3 hours

### Phase 7-9 (Release): 2-3 hours
- Changelog preparation: 1 hour
- Release notes: 0.5 hours
- GitHub release: 0.5 hour
- Publishing: 1 hour

### Total Estimated Time: 14-20 hours

## Risk Mitigation

### Risk 1: Broken Build
- **Mitigation**: Incremental testing after each rebranding step
- **Fallback**: Git revert to last working state

### Risk 2: Missed References
- **Mitigation**: Comprehensive grep searches
- **Fallback**: Runtime testing to catch missed references

### Risk 3: Dependency Conflicts
- **Mitigation**: Lock file verification
- **Fallback**: Fresh npm install in clean environment

### Risk 4: License Issues
- **Mitigation**: Maintain Jarvis attribution
- **Fallback**: Consult legal if needed

### Risk 5: Community Backlash
- **Mitigation**: Clear communication about fork reasons
- **Fallback**: Private fork if needed

## Success Criteria

✅ Repository created and configured
✅ All tests passing
✅ Build succeeds on all platforms
✅ Documentation complete and accurate
✅ No Jarvis references (except attribution)
✅ Initial release published
✅ Community informed
✅ Upstream relationship maintained

## Next Steps

1. **Get approval** for fork creation
2. **Create GitHub repository**: deathamongstlife/jarvis
3. **Run automated rebranding script** (create if needed)
4. **Manual review** of all changes
5. **Comprehensive testing** on all platforms
6. **Initial release** as v1.0.0-jarvis.1
7. **Announce to community**

## Notes

- This is a **hard fork**, not a temporary branch
- Maintain clear attribution to Jarvis project
- Keep good relationship with upstream
- Focus on stability improvements as key differentiator
- Consider eventual upstream contribution of fixes
- Document fork rationale clearly

## Attribution

J.A.R.V.I.S. is based on Jarvis by the Jarvis team.
All original work remains under Jarvis's license.
Improvements and enhancements are contributed by the J.A.R.V.I.S. team.

GitHub: https://github.com/deathamongstlife/jarvis
License: See LICENSE file for details
