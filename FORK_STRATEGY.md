# J.A.R.V.I.S. Fork Strategy

## Executive Summary

This document outlines the complete strategy for forking Jarvis into J.A.R.V.I.S. (Just A Rather Very Intelligent System), maintaining all 102+ critical bug fixes while establishing an independent development path.

## 1. Repository Setup

### 1.1 Initial Fork Creation

```bash
# Step 1: Fork on GitHub
# Go to: https://github.com/deathamongstlife/jarvis
# Click "Fork" → Create new organization "jarvis-ai" (or use personal account)
# Repository name: "jarvis"

# Step 2: Clone the fork
git clone https://github.com/YOUR_USERNAME/jarvis.git
cd jarvis

# Step 3: Add upstream remote
git remote add upstream https://github.com/deathamongstlife/jarvis.git
git remote -v

# Step 4: Create development branch
git checkout -b develop
git push -u origin develop
```

### 1.2 Branch Protection Rules

Configure on GitHub Settings → Branches:

- **main**: Production releases only
  - Require pull request reviews (2 reviewers)
  - Require status checks to pass
  - Require branches to be up to date
  - Include administrators

- **develop**: Active development
  - Require pull request reviews (1 reviewer)
  - Require status checks to pass
  - Allow force pushes (for rebasing)

- **feature/\***: Feature branches
  - No protection (delete after merge)

## 2. Rebranding Strategy

### 2.1 Critical Files for Rebranding

#### Package Configuration
```
package.json                           - name, description, repository URLs
apps/android/app/build.gradle.kts     - applicationId, versionName
apps/ios/Sources/Info.plist           - CFBundleIdentifier, CFBundleName
apps/macos/Sources/Jarvis/Resources/Info.plist - Bundle IDs
```

#### Documentation
```
README.md                              - Primary documentation
README_JARVIS.md                       - J.A.R.V.I.S.-specific guide
CHANGELOG.md                           - Release history
docs/**/*.md                           - All documentation files
```

#### Source Code
```
src/cli/banner.ts                      - ASCII art banner
src/cli/version.ts                     - Version display
src/gateway/server.impl.ts             - Server identification
src/tui/header.ts                      - TUI header
ui/src/ui/views/dashboard.ts           - Dashboard branding
```

#### Configuration
```
.github/workflows/*.yml                - CI/CD pipeline names
.github/ISSUE_TEMPLATE/*.yml           - Issue templates
.github/pull_request_template.md       - PR template
SECURITY.md                            - Security policy
CODE_OF_CONDUCT.md                     - Community guidelines
```

### 2.2 Rebranding Script

Create `scripts/rebrand-to-jarvis.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "Starting J.A.R.V.I.S. rebranding process..."

# Function to replace text in files
replace_in_file() {
  local file=$1
  local search=$2
  local replace=$3

  if [[ -f "$file" ]]; then
    sed -i.bak "s|${search}|${replace}|g" "$file"
    rm "${file}.bak"
    echo "✓ Updated: $file"
  fi
}

# Package name changes
replace_in_file "package.json" '"name": "jarvis"' '"name": "jarvis"'
replace_in_file "package.json" '"jarvis"' '"jarvis"'
replace_in_file "package.json" 'jarvis/jarvis' 'jarvis-ai/jarvis'

# Android app ID
replace_in_file "apps/android/app/build.gradle.kts" \
  'applicationId = "ai.jarvis.app"' \
  'applicationId = "ai.jarvis.app"'

# iOS bundle ID
replace_in_file "apps/ios/Sources/Info.plist" \
  'ai.jarvis.app' \
  'ai.jarvis.app'

# macOS bundle ID
replace_in_file "apps/macos/Sources/Jarvis/Resources/Info.plist" \
  'ai.jarvis' \
  'ai.jarvis'

# Update all markdown files
find docs -name "*.md" -type f | while read -r file; do
  replace_in_file "$file" "Jarvis" "J.A.R.V.I.S."
  replace_in_file "$file" "jarvis" "jarvis"
done

# Update README
replace_in_file "README.md" "Jarvis" "J.A.R.V.I.S."
replace_in_file "README.md" "jarvis/jarvis" "jarvis-ai/jarvis"

# Update GitHub templates
find .github -name "*.yml" -o -name "*.md" | while read -r file; do
  replace_in_file "$file" "Jarvis" "J.A.R.V.I.S."
  replace_in_file "$file" "jarvis/jarvis" "jarvis-ai/jarvis"
done

echo "✓ Rebranding complete!"
echo "Please review changes with: git diff"
```

### 2.3 Phased Rebranding Approach

**Phase 1: Documentation Only** (Week 1)
- Update README.md, CHANGELOG.md
- Update all docs/**/*.md files
- Update GitHub templates
- Test documentation builds

**Phase 2: Configuration** (Week 2)
- Update package.json
- Update app bundle identifiers
- Update CI/CD pipelines
- Test local builds

**Phase 3: Source Code** (Week 3)
- Update CLI banners and branding
- Update UI components
- Update server identification
- Test full application

**Phase 4: Release** (Week 4)
- Final testing on all platforms
- Create v1.0.0-jarvis.1 release
- Update npm package (if publishing)
- Announce fork

## 3. Branching Strategy

### 3.1 Git Flow Model

```
main (stable releases)
  ↑
develop (active development)
  ↑
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (production fixes)
release/* (release candidates)
```

### 3.2 Branch Naming Convention

```
feature/issue-number-short-description
bugfix/issue-number-short-description
hotfix/issue-number-short-description
release/v1.0.0-jarvis.1
```

Examples:
```
feature/dashboard-analytics
bugfix/telegram-polling-stall
hotfix/security-patch-cve-2026-1234
release/v2026.3.15-jarvis.1
```

### 3.3 Commit Message Format

Follow Conventional Commits with J.A.R.V.I.S. attribution:

```
<type>(<scope>): <subject>

<body>

<footer>

Co-Authored-By: J.A.R.V.I.S. AI <ai@jarvis.dev>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example:
```
feat(dashboard): add real-time session monitoring

Implements WebSocket-based real-time session updates with:
- Live session count tracking
- Active agent monitoring
- Channel health indicators

Fixes #123

Co-Authored-By: J.A.R.V.I.S. AI <ai@jarvis.dev>
```

## 4. Upstream Synchronization

### 4.1 Regular Sync Strategy

**Weekly upstream check:**
```bash
# Update upstream
git fetch upstream

# Review changes
git log develop..upstream/main --oneline

# Create sync branch
git checkout -b sync/upstream-$(date +%Y%m%d) develop
git merge upstream/main

# Resolve conflicts (prioritize J.A.R.V.I.S. changes)
# Test thoroughly
# Create PR to develop
```

### 4.2 Selective Cherry-Picking

For critical security fixes:
```bash
# Cherry-pick specific commits
git cherry-pick <commit-sha>

# Create hotfix branch
git checkout -b hotfix/upstream-security-patch main
git cherry-pick <security-commit-sha>
git push origin hotfix/upstream-security-patch

# Create PR to main for immediate release
```

### 4.3 Conflict Resolution Policy

1. **J.A.R.V.I.S. features take precedence** - Our enhancements are preserved
2. **Upstream bug fixes are integrated** - Security and stability improvements
3. **Breaking changes are evaluated** - May require adaptation period
4. **Documentation is merged carefully** - Maintain J.A.R.V.I.S. branding

## 5. Release Process

### 5.1 Version Numbering

Format: `YYYY.M.D-jarvis.N`

Examples:
- `2026.3.15-jarvis.1` - First J.A.R.V.I.S. release on March 15, 2026
- `2026.3.15-jarvis.2` - Second release same day
- `2026.4.1-jarvis.1` - April 1st release

### 5.2 Release Checklist

**Pre-release:**
- [ ] All tests pass (`pnpm test`)
- [ ] Build successful on all platforms
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in all files
- [ ] Security audit clean (`pnpm audit`)

**Release:**
- [ ] Create release branch: `release/v2026.3.15-jarvis.1`
- [ ] Final testing on release branch
- [ ] Merge to main
- [ ] Create Git tag: `git tag -a v2026.3.15-jarvis.1 -m "Release v2026.3.15-jarvis.1"`
- [ ] Push tag: `git push origin v2026.3.15-jarvis.1`
- [ ] Create GitHub release with changelog
- [ ] Build and upload artifacts (macOS .dmg, .zip, .dSYM.zip)

**Post-release:**
- [ ] Merge main back to develop
- [ ] Update documentation site
- [ ] Announce release (Discord, Twitter, etc.)
- [ ] Monitor for critical issues

### 5.3 Release Channels

**Stable** (`main` branch)
- Production-ready releases
- Thoroughly tested
- npm tag: `latest`

**Beta** (`develop` branch)
- Pre-release testing
- New features
- npm tag: `beta`

**Nightly** (automated builds)
- Latest develop commits
- Experimental features
- npm tag: `nightly`

## 6. Testing Strategy

### 6.1 Test Levels

**Unit Tests**
```bash
pnpm test                    # Run all tests
pnpm test:coverage          # With coverage report
```

**Integration Tests**
```bash
pnpm test:live              # Live API tests
pnpm test:docker:live-models # Docker-based tests
```

**End-to-End Tests**
```bash
pnpm test:docker:onboard    # Onboarding flow
```

**Platform Tests**
- macOS: `scripts/package-mac-app.sh`
- iOS: Xcode build + TestFlight
- Android: `./gradlew assembleRelease`

### 6.2 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: J.A.R.V.I.S. CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: pnpm install
      - run: pnpm check
      - run: pnpm build
      - run: pnpm test:coverage

  build-macos:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: scripts/package-mac-app.sh
      - uses: actions/upload-artifact@v4
        with:
          name: macos-app
          path: dist/*.zip
```

## 7. Documentation Maintenance

### 7.1 Documentation Structure

```
docs/
├── architecture/          # System design
├── channels/             # Channel-specific guides
├── dashboard/            # Dashboard features
├── gateway/              # Gateway configuration
├── install/              # Installation guides
├── platforms/            # Platform-specific docs
├── reference/            # API reference
└── testing.md           # Testing guide
```

### 7.2 Documentation Standards

- Use J.A.R.V.I.S. branding consistently
- Include code examples for all features
- Keep screenshots up-to-date
- Maintain versioned documentation
- Link to GitHub issues for context

### 7.3 Mintlify Integration

Update `mint.json` for docs.jarvis.ai:

```json
{
  "name": "J.A.R.V.I.S.",
  "logo": {
    "dark": "/logo/dark.svg",
    "light": "/logo/light.svg"
  },
  "favicon": "/favicon.svg",
  "colors": {
    "primary": "#0D9373",
    "light": "#07C983",
    "dark": "#0D9373"
  }
}
```

## 8. Community Management

### 8.1 Communication Channels

- **GitHub Discussions**: Technical Q&A, feature requests
- **Discord**: Real-time support, community chat
- **Twitter**: Announcements, updates
- **Blog**: Long-form updates, tutorials

### 8.2 Contribution Guidelines

Create `CONTRIBUTING.md`:

```markdown
# Contributing to J.A.R.V.I.S.

## Code of Conduct
We follow the Contributor Covenant Code of Conduct.

## Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `pnpm check` and `pnpm test`
6. Submit a pull request

## Commit Messages
Follow Conventional Commits format.

## Code Style
- TypeScript strict mode
- ESLint + Prettier (via Oxlint/Oxfmt)
- Comprehensive JSDoc comments
```

### 8.3 Issue Management

**Labels:**
- `bug` - Something isn't working
- `feature` - New feature request
- `documentation` - Documentation improvements
- `security` - Security-related issues
- `upstream` - Related to Jarvis upstream
- `jarvis-specific` - J.A.R.V.I.S.-only features

**Issue Templates:**
- Bug report
- Feature request
- Documentation improvement
- Security vulnerability

## 9. Security Considerations

### 9.1 Security Policy

Update `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2026.x-jarvis.x   | :white_check_mark: |
| < 2026.x-jarvis.x | :x:                |

## Reporting a Vulnerability

Email: security@jarvis.ai
GPG Key: [link to public key]

Expected response time: 48 hours
```

### 9.2 Dependency Management

**Weekly security audits:**
```bash
pnpm audit                  # Check for vulnerabilities
pnpm update                # Update dependencies
pnpm dedupe               # Optimize dependency tree
```

**Automated Dependabot:**
- Enable on GitHub Settings → Security
- Auto-merge minor/patch updates
- Manual review for major updates

## 10. Backup and Recovery

### 10.1 Backup Strategy

**Daily automated backups:**
- GitHub repository (automatic)
- npm package registry
- Documentation site
- CI/CD artifacts

**Manual backups:**
- Release artifacts (.zip, .dmg, .dSYM)
- Signing certificates (secure storage)
- API keys and secrets (1Password)

### 10.2 Disaster Recovery

**Repository corruption:**
```bash
# Restore from GitHub
git clone https://github.com/jarvis-ai/jarvis.git
cd jarvis
git fetch --all
git checkout main
```

**Lost signing certificates:**
- Restore from secure backup
- Regenerate if necessary
- Update Apple Developer Portal

## 11. Legal Considerations

### 11.1 License Compliance

J.A.R.V.I.S. inherits Jarvis's license (verify in LICENSE file).

**Requirements:**
- Maintain original copyright notices
- Attribute Jarvis as upstream source
- Document all modifications
- Comply with license terms

### 11.2 Attribution

Add to README.md:

```markdown
## Attribution

J.A.R.V.I.S. is a fork of [Jarvis](https://github.com/deathamongstlife/jarvis),
enhanced with 102+ critical bug fixes and advanced features.

Original work Copyright (c) 2024 Jarvis Contributors
Modifications Copyright (c) 2026 J.A.R.V.I.S. Team

Licensed under [LICENSE TYPE] (see LICENSE file)
```

## 12. Migration Checklist

### 12.1 Pre-Fork Checklist

- [x] Review all Jarvis issues (102+ fixes applied)
- [x] Document all changes (92+ KB documentation)
- [x] Create comprehensive test suite
- [x] Prepare rebranding scripts
- [ ] Set up J.A.R.V.I.S. GitHub organization
- [ ] Configure CI/CD pipelines
- [ ] Set up documentation hosting

### 12.2 Fork Creation Checklist

- [ ] Fork repository on GitHub
- [ ] Run rebranding script
- [ ] Update all configuration files
- [ ] Test builds on all platforms
- [ ] Update documentation
- [ ] Configure branch protection
- [ ] Set up issue templates
- [ ] Create initial release

### 12.3 Post-Fork Checklist

- [ ] Announce fork publicly
- [ ] Set up community channels
- [ ] Publish npm package
- [ ] Deploy documentation site
- [ ] Monitor for issues
- [ ] Establish upstream sync schedule
- [ ] Create roadmap for future development

## 13. Future Roadmap

### 13.1 Short-term (3 months)

- Complete rebranding
- Stabilize fork
- Establish community
- First stable release (v2026.3.15-jarvis.1)

### 13.2 Medium-term (6 months)

- Advanced dashboard features
- Mobile app improvements
- Performance optimizations
- Enhanced security

### 13.3 Long-term (12 months)

- Plugin ecosystem
- Cloud hosting option
- Enterprise features
- Multi-tenant support

## 14. Contact and Support

**Project Maintainers:**
- Lead Developer: [Your Name] <your.email@jarvis.ai>

**Community:**
- Discord: https://discord.gg/jarvis
- GitHub Discussions: https://github.com/jarvis-ai/jarvis/discussions
- Twitter: @jarvis_ai

**Commercial Support:**
- Email: support@jarvis.ai
- Enterprise: enterprise@jarvis.ai

---

**Document Version:** 1.0
**Last Updated:** 2026-03-11
**Status:** Ready for Implementation
