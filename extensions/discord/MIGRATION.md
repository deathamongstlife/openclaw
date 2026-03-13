# Discord Extension Migration Guide

## Issue: Duplicate Channel Implementations

Your `/opt/jarvis` installation has **TWO** Discord channel implementations:

1. **`src/channel.ts`** - New comprehensive TypeScript implementation (✅ KEEP)
2. **`src/channel.js`** - Legacy JavaScript implementation (❌ REMOVE)

## Fix: Remove Legacy Files

Run these commands on your Ally-DevOps server:

```bash
cd /opt/jarvis

# Remove legacy JavaScript implementations
rm -f extensions/discord/src/channel.js
rm -f extensions/discord/src/runtime.js

# Verify removal
find extensions/discord/src -name "*.js" -type f

# Rebuild the project
pnpm build

# Restart Jarvis
systemctl restart jarvis
# OR if running manually:
pkill -f jarvis && jarvis gateway run &
```

## Why This Matters

The legacy `channel.js` file:

- Conflicts with the new `channel.ts` during module resolution
- May cause "channel registration missing id" errors
- Has outdated/incomplete functionality
- Doesn't include any of the new features (music, presence, NLP, etc.)

## What You're Keeping

The new `channel.ts` implementation includes:

- ✅ Dynamic presence with RPC
- ✅ Music system with Lavalink
- ✅ Natural language processing
- ✅ Voice TTS support
- ✅ Per-user identities
- ✅ Auto-threading
- ✅ Slash commands
- ✅ Full JARVIS plugin SDK integration

## After Migration

Once you've removed the legacy files and rebuilt, the Discord extension will use only the new TypeScript implementation with all the features we just built.
