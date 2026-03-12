# Jarvis Installation & Fixes Applied

## Date
2026-03-12

## TypeScript Compilation Errors Fixed

### 1. Discord Actions Analytics (`src/agents/tools/discord-actions-analytics.ts`)
**Issue**: Incorrect function signature for `readMessagesDiscord` - passing object as first parameter instead of string.

**Fix**: Updated all calls to match the correct signature:
```typescript
// Before (incorrect)
await readMessagesDiscord({ channelId, limit }, { accountId })

// After (correct)
await readMessagesDiscord(channelId, { limit }, { accountId })
```

**Lines affected**: 22-23, 88-89, 346-347, 408-409

### 2. Discord Guild Advanced (`src/discord/send.guild-advanced.ts`)
**Issue**: Using non-existent `Routes.guildVoiceStates()` method. Discord API doesn't provide a bulk endpoint for all voice states.

**Fix**: Replaced with error throw and documentation:
```typescript
// Note: Discord API doesn't provide a bulk endpoint for all voice states
// This would need to be implemented differently, e.g., by fetching guild members
// and checking their voice state individually using Routes.guildVoiceState(guildId, userId)
throw new Error("Bulk voice state fetching not supported by Discord API. Use Routes.guildVoiceState(guildId, userId) for individual users.");
```

**Line affected**: 325

## Rebranding Complete

### Changes Made
1. **Package name**: Already set to `jarvis` in package.json
2. **Binary name**: Already set to `jarvis` in package.json bin field
3. **Command references**: Updated `jarvis <command>` to `jarvis <command>` throughout codebase
4. **Gateway service**: Updated `jarvis-gateway` to `jarvis-gateway`
5. **Product name**: Updated `Jarvis` to `Jarvis` (capital case)
6. **Swift/iOS**: Renamed `OpenClawKit` to `JarvisKit`
   - Directory: `apps/shared/OpenClawKit` → `apps/shared/JarvisKit`
   - Inner directory: `Sources/OpenClawKit` → `Sources/JarvisKit`
   - All Swift imports updated

### Preserved
- **README.md**: Jarvis credits preserved as requested
- **CHANGELOG.md**: Historical references preserved
- **LICENSE**: Original license maintained

## Build Status
✅ TypeScript compilation: **PASSING**
✅ Plugin SDK types generation: **PASSING**

## Next Steps
1. Run full build: `pnpm build`
2. Test installation on VPS
3. Verify all services start correctly with new names
4. Update any systemd/service files referencing `jarvis-gateway` to `jarvis-gateway`

## Commands for VPS Deployment
```bash
# If you have Jarvis running, stop it first
sudo systemctl stop jarvis-gateway || pkill -f jarvis-gateway

# Navigate to the installation directory
cd /opt/jarvis

# Pull latest changes (if using git)
git pull

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link globally (makes 'jarvis' command available)
sudo npm link

# Verify installation
jarvis --version

# Start the gateway
jarvis gateway run --bind loopback --port 18789
```

## Verification Checklist
- [ ] TypeScript compilation passes
- [ ] Full build completes successfully
- [ ] `jarvis --version` shows correct version
- [ ] Gateway starts with `jarvis gateway run`
- [ ] All commands work with `jarvis` prefix instead of `jarvis`
- [ ] No remaining `jarvis-gateway` references in active code
