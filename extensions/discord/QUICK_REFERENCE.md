# Quick Reference Card

## 🧵 Thread Management

### Check if user has thread

```typescript
const thread = await store.getThreadForUser(channelId, userId);
if (thread) {
  console.log(`Thread: ${thread.thread_id}`);
}
```

### Get all threads for channel

```typescript
const threads = await store.getThreadMappings(channelId);
const active = threads.filter((t) => t.active);
console.log(`${active.length} active threads`);
```

### Manual cleanup

```typescript
await store.cleanupInactiveThreads(24 * 60 * 60 * 1000);
```

---

## 💬 Slash Commands

### Check ephemeral behavior

```typescript
import { shouldBeEphemeral } from "./src/commands/slash/registry.js";

const ephemeral = shouldBeEphemeral(interaction);
// true in guilds & DMs, false in group DMs
```

### Get command stats

```typescript
const stats = await store.getSlashCommandStats();
stats.forEach(({ command, count }) => {
  console.log(`${command}: ${count}`);
});
```

### User-specific stats

```typescript
const userStats = await store.getSlashCommandStats(userId);
```

---

## 🔧 Configuration

### Thread settings

- **Activity window:** 10 minutes (in `auto-threads.ts`)
- **Thread lifetime:** 24 hours (Discord auto-archive)
- **Cleanup interval:** 1 hour (inactive threads)
- **Tracking cleanup:** 5 minutes (user activity)

### Slash command settings

- **Ephemeral in:** Guilds, DMs
- **Visible in:** Group DMs
- **Profile command:** Always ephemeral
- **Music command:** Guild-only

---

## 🐛 Common Checks

### Thread creation failing?

```typescript
// Check permissions
const perms = guild.members.me?.permissions;
console.log(perms?.has("CreatePublicThreads"));

// Check channel type
console.log(channel.type); // Should be GuildText
```

### Commands not deploying?

```bash
# Check token
echo $DISCORD_BOT_TOKEN

# Check logs for:
# ✅ Successfully deployed 4 slash commands!
```

### Music not working?

```typescript
// Check guild install (not user install)
// Check user in voice channel
const voiceChannel = member?.voice?.channel;
console.log(voiceChannel ? "In voice" : "Not in voice");
```

---

## 📊 Quick Stats

**Files:** 18 total (13 created, 5 modified)
**Code:** 3,000+ lines
**Docs:** 1,000+ lines
**Tests:** 200+ lines

**Commands:** 4 slash commands
**Thread Methods:** 8 new database methods
**Integration:** Full

---

## 🦞 Quick Links

- Full docs: `ADVANCED_FEATURES.md`
- Setup guide: `INTEGRATION_GUIDE.md`
- Implementation: `IMPLEMENTATION_SUMMARY.md`
- This card: `QUICK_REFERENCE.md`

**Made with chaos gremlin energy! ✨💅**
