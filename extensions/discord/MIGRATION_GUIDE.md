# Migration Guide: Upgrading to Advanced Features

## 🎯 Overview

This guide helps you upgrade your existing JARVIS Discord bot to include the new advanced features:

- Automatic Thread Management
- User-Installable Slash Commands

## ⚡ Quick Upgrade (5 Minutes)

### Step 1: Update Code

```bash
cd openclaw
git pull origin main
pnpm install
```

### Step 2: Enable User Install

1. Go to https://discord.com/developers/applications
2. Select your bot
3. Navigate to **Installation** → Enable **User Install**
4. Save changes

### Step 3: Restart Bot

```bash
jarvis gateway restart
```

### Step 4: Verify

Look for: `✅ Successfully deployed 4 slash commands!`

**Done! ✅**

---

## 🔍 What Changed?

### Before (Confusing)

```
User A: @JARVIS play music
User B: @JARVIS weather?
User A: @JARVIS skip
→ Which user's music? Confusion!
```

### After (Clean)

```
User A: @JARVIS play music
  → Thread: "Chat with User A"

User B: @JARVIS weather?
  → Thread: "Chat with User B"

→ Perfect isolation! ✨
```

---

## 📦 New Files Added

```
~/.jarvis/extensions/discord/
  threads/              # Thread mappings
  slash-commands.json   # Command logs
```

**No data loss** - existing data untouched

---

## 🚀 Features Activate Automatically

### Thread Management

- Activates when 2+ users mention bot
- No config needed
- Works in all text channels

### Slash Commands

- Deploy on bot startup
- Available to all users
- No setup required

---

## 🔐 Permissions Update

### New Permission Needed

- `CREATE_PUBLIC_THREADS` (for threads)

### Updated Invite Link

```
https://discord.com/oauth2/authorize?client_id=YOUR_ID&scope=bot+applications.commands&permissions=412317240384
```

---

## 🐛 Troubleshooting

### Commands don't appear?

- Wait 1 hour (Discord sync)
- Force refresh Discord (Ctrl+R)

### Threads not creating?

- Check bot has `CREATE_PUBLIC_THREADS`
- Ensure 2+ users mention bot

### Bot won't start?

```bash
echo $DISCORD_BOT_TOKEN  # Verify token set
jarvis gateway logs       # Check for errors
```

---

## 🔄 Rollback (If Needed)

Edit `index.ts`, comment out:

```typescript
// const threadManager = ...
// const slashRegistry = ...
```

Then restart. Bot reverts to old behavior.

---

## ✅ Migration Checklist

- [ ] Update code
- [ ] Enable user install
- [ ] Restart bot
- [ ] Verify slash commands deployed
- [ ] Test threads with 2+ users
- [ ] Announce new features

---

## 💡 Announce to Users

```
🎉 JARVIS upgraded!

New:
✨ Auto threads - no more confusion
🔗 Slash commands - /chat, /lookup, /music, /profile

Try: Type /chat and ask me anything!
```

---

## ⚡ Support

Full docs: `ADVANCED_FEATURES.md`
Setup: `INTEGRATION_GUIDE.md`
Quick ref: `QUICK_REFERENCE.md`

**Smooth upgrade guaranteed! ✨💅**
