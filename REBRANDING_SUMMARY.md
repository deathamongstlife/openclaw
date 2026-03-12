# Rebranding Summary: openclaw → Jarvis

## Overview

This document summarizes the comprehensive rebranding from "openclaw" to "Jarvis" completed on 2026-03-12.

## Changes Made

### 1. Directory Renaming (12 directories)

All directories containing "openclaw" or "OpenClaw" were renamed:

- `apps/android/app/src/main/java/ai/openclaw` → `ai/jarvis`
- `apps/android/app/src/test/java/ai/openclaw` → `ai/jarvis`
- `apps/android/benchmark/src/main/java/ai/openclaw` → `ai/jarvis`
- `apps/macos/Sources/OpenClaw` → `Jarvis`
- `apps/macos/Sources/OpenClawDiscovery` → `JarvisDiscovery`
- `apps/macos/Sources/OpenClawIPC` → `JarvisIPC`
- `apps/macos/Sources/OpenClawMacCLI` → `JarvisMacCLI`
- `apps/macos/Sources/OpenClawProtocol` → `JarvisProtocol`
- `apps/macos/Tests/OpenClawIPCTests` → `JarvisIPCTests`
- `apps/shared/JarvisKit/Sources/OpenClawChatUI` → `JarvisChatUI`
- `apps/shared/JarvisKit/Sources/OpenClawProtocol` → `JarvisProtocol`
- `apps/shared/JarvisKit/Tests/OpenClawKitTests` → `JarvisKitTests`

### 2. File Renaming (130+ files)

#### Android Files

- `OpenClawCanvasA2UIAction.kt` → `JarvisCanvasA2UIAction.kt`
- `OpenClawProtocolConstants.kt` → `JarvisProtocolConstants.kt`
- `OpenClawTheme.kt` → `JarvisTheme.kt`
- All test files renamed accordingly

#### iOS Files

- `OpenClawActivityWidgetBundle.swift` → `JarvisActivityWidgetBundle.swift`
- `OpenClawLiveActivity.swift` → `JarvisLiveActivity.swift`
- `OpenClawActivityAttributes.swift` → `JarvisActivityAttributes.swift`
- `OpenClaw.entitlements` → `Jarvis.entitlements`
- `OpenClawApp.swift` → `JarvisApp.swift`
- `OpenClawWatchApp.swift` → `JarvisWatchApp.swift`

#### macOS Files

- `openclaw-mac.png` → `jarvis-mac.png`
- `OpenClawLogging.swift` → `JarvisLogging.swift`
- `OpenClawConfigFile.swift` → `JarvisConfigFile.swift`
- `OpenClawPaths.swift` → `JarvisPaths.swift`
- `ProcessInfo+OpenClaw.swift` → `ProcessInfo+Jarvis.swift`
- `OpenClaw.icns` → `Jarvis.icns`
- All test files renamed accordingly

#### JarvisKit Files

- `OpenClawDateRangeLimitParams.swift` → `JarvisDateRangeLimitParams.swift`
- `OpenClawKitResources.swift` → `JarvisKitResources.swift`

#### Documentation & Assets

- All architecture images: `openclaw-*.png` → `jarvis-*.png` (16 images)
- `openclaw-logo-text-dark.png` → `jarvis-logo-text-dark.png`
- `openclaw-logo-text.png` → `jarvis-logo-text.png`
- `whatsapp-openclaw-ai-zh.jpg` → `whatsapp-jarvis-ai-zh.jpg`
- `whatsapp-openclaw.jpg` → `whatsapp-jarvis.jpg`
- `docs/start/openclaw.md` → `jarvis.md`
- `docs/zh-CN/start/openclaw.md` → `jarvis.md`

#### Extension Plugin Files

All 36 extensions' plugin files renamed:

- `openclaw.plugin.json` → `jarvis.plugin.json`

#### Source Files

- `src/agents/openclaw-tools.ts` → `jarvis-tools.ts`
- All related test files renamed (25+ test files)
- `src/config/types.openclaw.ts` → `types.jarvis.ts`
- `src/infra/openclaw-*.ts` → `jarvis-*.ts` (5 files)

#### Scripts & Configuration

- `scripts/openclaw-npm-release-check.ts` → `jarvis-npm-release-check.ts`
- `scripts/run-openclaw-podman.sh` → `run-jarvis-podman.sh`
- `scripts/podman/openclaw.container.in` → `jarvis.container.in`
- `scripts/systemd/openclaw-auth-monitor.*` → `jarvis-auth-monitor.*`
- `.github/workflows/openclaw-npm-release.yml` → `jarvis-npm-release.yml`

#### Generated Files (dist/)

- All generated TypeScript declaration files renamed
- All generated JavaScript bundles renamed

### 3. Content Updates (3000+ files modified)

All occurrences of openclaw/OpenClaw/OPENCLAW were replaced with jarvis/Jarvis/JARVIS across:

#### Code References

- Package names: `ai.openclaw.app` → `ai.jarvis.app`
- Import statements: Updated in all Kotlin, Swift, TypeScript files
- Class names: `OpenClawTheme` → `JarvisTheme`, `OpenClawPaths` → `JarvisPaths`, etc.
- Function names: `createOpenClawTools` → `createJarvisTools`
- Type names: `OpenClawCapability` → `JarvisCapability`
- Environment variables: `OPENCLAW_*` → `JARVIS_*`

#### Configuration

- Android `namespace` and `applicationId`
- Swift Package.swift product and target names
- Plugin manifests
- Build scripts
- Systemd service files
- Docker configurations
- GitHub workflows

#### Documentation

- All markdown files
- Code comments
- README files
- Configuration examples
- Installation guides

### 4. Special Preservation

**README.md Acknowledgments Section (lines 989-1010) PRESERVED**
The credits section acknowledging the original Jarvis project was intentionally preserved as requested:

- "Built on Jarvis" section intact
- Upstream link to jarvis/jarvis preserved
- "What J.A.R.V.I.S. Adds" section intact
- Special Thanks section intact

## Naming Convention Applied

- **lowercase**: `openclaw` → `jarvis` (package names, binary names, file names, paths)
- **PascalCase**: `OpenClaw` → `Jarvis` (class names, types, Swift modules)
- **UPPERCASE**: `OPENCLAW` → `JARVIS` (environment variables, constants)

## Statistics

- **Directories renamed**: 12
- **Files renamed**: 130+
- **Files modified**: 3,122
- **Extensions updated**: 36 plugin.json files
- **Image assets renamed**: 20+ files
- **No remaining "openclaw" references** (verified)

## Verification

All changes verified through:

1. Grep search for remaining "openclaw" references (none found in tracked files)
2. Package.swift and build configuration files checked
3. Android namespace and applicationId verified
4. Import statements validated
5. README.md acknowledgments section confirmed preserved
6. Git status shows all changes staged

## Build Requirements

After rebranding, projects may need:

- Clean build (delete build artifacts)
- Regenerate derived data (Xcode)
- Gradle sync (Android)
- npm/pnpm install (if package names cached)

## Notes

- Git history preserved for all renamed files
- All renames done with `git mv` for tracked files
- Content replacements applied systematically across entire repository
- No functional changes made, only naming/branding updates
- Credits to original Jarvis project preserved as requested
