# Jarvis → Jarvis Rebranding Guide

This guide provides step-by-step instructions for rebranding the Jarvis repository to Jarvis.

## Scripts Provided

Two rebranding scripts are available:

1. **`rebrand-jarvis-to-jarvis.sh`** - Bash script for simple find/replace
2. **`rebrand-advanced.py`** - Python script with advanced pattern matching

## Quick Start

### Option 1: Bash Script (Simpler, Faster)

```bash
# Dry run (see what would change)
DRY_RUN=true ./rebrand-jarvis-to-jarvis.sh

# Apply changes
DRY_RUN=false ./rebrand-jarvis-to-jarvis.sh
```

### Option 2: Python Script (More Precise)

```bash
# Dry run (see what would change)
./rebrand-advanced.py --verbose

# Apply changes
./rebrand-advanced.py --no-dry-run

# Specify different directory
./rebrand-advanced.py /path/to/jarvis --no-dry-run
```

## What Gets Changed

Both scripts handle the following replacements:

### Text Replacements

| Pattern | Replacement | Example |
|---------|------------|---------|
| `Jarvis` | `Jarvis` | Title case (docs, UI) |
| `jarvis` | `jarvis` | Lowercase (code, commands) |
| `JARVIS` | `JARVIS` | All caps (env vars, constants) |
| `jarvis` | `jarvis` | camelCase (rare) |

### Special Patterns (Python script only)

| Pattern | Replacement | Description |
|---------|------------|-------------|
| `@jarvis/*` | `@jarvis/*` | npm scoped packages |
| `jarvis.ai` | `jarvis.ai` | Domain names |
| `docs.jarvis.ai` | `docs.jarvis.ai` | Documentation domain |
| `github.com/deathamongstlife/jarvis` | `github.com/deathamongstlife/jarvis` | GitHub URLs |
| `~/.jarvis/` | `~/.jarvis/` | Config directories |
| `JARVIS_*` | `JARVIS_*` | Environment variables |
| `jarvis-gateway` | `jarvis-gateway` | Binary names |
| `jarvis-cli` | `jarvis-cli` | CLI binary |

## Files Automatically Excluded

Both scripts skip:

- Binary files (`.png`, `.jpg`, `.pdf`, `.dylib`, `.so`, etc.)
- Build artifacts (`dist/`, `build/`, `coverage/`)
- Dependencies (`node_modules/`, `.pnpm/`)
- Version control (`.git/`)
- Archives (`.zip`, `.tar.gz`, etc.)

## Step-by-Step Rebranding Process

### 1. Backup Your Repository

```bash
# Create a backup branch
git checkout -b backup-before-rebrand
git push origin backup-before-rebrand

# Return to main
git checkout main
```

### 2. Run Dry Run First

```bash
# Using bash script
DRY_RUN=true ./rebrand-jarvis-to-jarvis.sh | tee dry-run-output.txt

# OR using Python script
./rebrand-advanced.py -v | tee dry-run-output.txt
```

Review the output to ensure changes look correct.

### 3. Apply Rebranding

```bash
# Using bash script
DRY_RUN=false ./rebrand-jarvis-to-jarvis.sh

# OR using Python script
./rebrand-advanced.py --no-dry-run
```

### 4. Review Changes

```bash
# See all changed files
git status

# Review diffs
git diff

# Check specific file types
git diff -- '*.ts' '*.json' '*.md'
```

### 5. Manual Updates Required

Some items need manual attention:

#### A. Package.json

```json
{
  "name": "jarvis",  // Changed from "jarvis"
  "description": "Your own personal AI assistant...",
  "bin": {
    "jarvis": "./dist/cli/index.js"  // Changed from "jarvis"
  }
}
```

#### B. GitHub Repository

1. Go to repository settings
2. Rename: `jarvis` → `jarvis`
3. Update description
4. Update topics/tags

#### C. NPM Package (if published)

```bash
# Publish under new name
npm publish --access public

# Deprecate old package
npm deprecate jarvis "Package renamed to jarvis. Please use 'jarvis' instead."
```

#### D. Documentation URLs

Update any hardcoded URLs:
- `jarvis.ai` → `jarvis.ai`
- `docs.jarvis.ai` → `docs.jarvis.ai`

#### E. CI/CD Configuration

Update in `.github/workflows/*.yml`:
- Docker image names
- Artifact names
- Release names

### 6. Test Everything

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm tsgo

# Run linting
pnpm check

# Run tests
pnpm test

# Build
pnpm build

# Test CLI
./dist/cli/index.js --version
```

### 7. Search for Remaining References

```bash
# Case-insensitive search
git grep -i "jarvis"

# Check specific patterns
git grep -E "(Jarvis|jarvis|JARVIS)"

# Check in package files
git grep "jarvis" -- "*.json" "*.yml" "*.yaml"
```

### 8. Commit Changes

```bash
# Stage all changes
git add .

# Create commit
git commit -m "Rebrand: Jarvis → Jarvis

- Replace all instances of jarvis/Jarvis/JARVIS with jarvis/Jarvis/JARVIS
- Update package names, binaries, and configuration
- Update documentation and README
- Preserve functionality and API compatibility where possible"

# Push
git push origin main
```

## Common Issues

### Issue: Scripts report "command not found"

**Solution:**
```bash
chmod +x rebrand-jarvis-to-jarvis.sh
chmod +x rebrand-advanced.py
```

### Issue: Python script fails with "No module named..."

**Solution:**
```bash
# The script uses only standard library, no dependencies needed
# Ensure Python 3.6+ is installed
python3 --version
```

### Issue: Too many changes, need to revert

**Solution:**
```bash
# Reset all changes
git reset --hard HEAD

# Or restore from backup branch
git checkout backup-before-rebrand
git checkout -b main-rebrand-attempt-2
```

### Issue: Build fails after rebranding

**Solution:**
```bash
# Clean all build artifacts
rm -rf node_modules dist build coverage .next .turbo
pnpm install
pnpm build
```

## Post-Rebranding Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] CLI works (`./dist/cli/index.js --help`)
- [ ] Documentation updated
- [ ] README updated
- [ ] Package.json updated
- [ ] GitHub repository renamed
- [ ] CI/CD workflows pass
- [ ] No remaining "jarvis" references (except in CHANGELOG/history)
- [ ] Docker images rebuilt (if applicable)
- [ ] NPM package published under new name (if applicable)

## Preserving History

Some references to "Jarvis" should be preserved:

- `CHANGELOG.md` - Historical releases
- `CONTRIBUTING.md` - Attribution to original project
- Git commit history
- License/copyright notices (if forked)

## Getting Help

If you encounter issues:

1. Check the dry-run output first
2. Review git diffs carefully
3. Test incrementally (build, test, run)
4. Keep the backup branch until everything works

## Script Output Example

```
═══════════════════════════════════════════════════════════
  Jarvis → Jarvis Advanced Rebranding
═══════════════════════════════════════════════════════════
Repository: /workspace/jarvis
Dry run: False
Verbose: True

Scanning for files to rebrand...

✓ Changed: README.md (23 replacements)
✓ Changed: package.json (8 replacements)
✓ Changed: src/cli/index.ts (45 replacements)
...

═══════════════════════════════════════════════════════════
  Rebranding Summary
═══════════════════════════════════════════════════════════
Files changed: 1,247
Total replacements: 30,620

Changes by pattern:
  lowercase: 18,432
  title case: 9,876
  uppercase: 1,234
  npm scoped packages: 543
  environment variables: 321
  GitHub repo: 214

Rebranding complete!
═══════════════════════════════════════════════════════════
```

## Notes

- Both scripts are idempotent (safe to run multiple times)
- Dry runs are recommended before applying changes
- Review all changes before committing
- Test thoroughly after rebranding
- Update external services (CI/CD, registries, etc.)
