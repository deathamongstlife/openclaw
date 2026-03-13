# Migration Guide - Discord Extension v2

## Overview

The Discord extension has been upgraded from a basic channel integration to a full-featured AI-powered bot. This guide helps you migrate to the new version.

## What's Changed

### ✅ Backward Compatible

- Existing Discord channel integration still works
- Your Discord token configuration is unchanged
- Message sending/receiving continues to work
- Thread bindings work as before

### ✨ New Features

- 28 natural language bot tools
- Moderation system with warning tracking
- Server management capabilities
- Automation (welcome messages, auto-roles, auto-moderation)
- Event logging and history
- Per-server configuration

## Installation Steps

### 1. Update Dependencies

The extension now requires `discord.js`:

```bash
pnpm install
```

This will install `discord.js@^14.14.1` automatically from the updated `package.json`.

### 2. Update Bot Permissions

Your Discord bot needs additional permissions for the new features:

**In Discord Developer Portal:**

1. Go to your bot's application page
2. Navigate to "Bot" section
3. Enable Privileged Gateway Intents:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT

4. Navigate to "OAuth2 → URL Generator"
5. Select scopes: `bot`, `applications.commands`
6. Select bot permissions (or just use Administrator for simplicity):
   - Manage Roles
   - Manage Channels
   - Kick Members
   - Ban Members
   - Timeout Members
   - Manage Messages
   - Manage Nicknames
   - Send Messages
   - Read Message History
   - View Channels

7. Use the generated URL to re-invite the bot to your servers

### 3. Configure Your Server

Once the bot is running, configure it using natural language:

```
@bot show me the current configuration
@bot enable moderation module
@bot enable welcome module
@bot set welcome channel to #welcome
@bot set welcome message to: Welcome {user} to {server}!
```

## Configuration Migration

### If You Had Custom Bot Configuration

The new bot stores per-server configuration in:

```
~/.jarvis/extensions/discord/servers/{guildId}/config.json
```

**Default configuration:**

```json
{
  "modules": {
    "moderation": true,
    "automod": false,
    "logging": false,
    "welcome": false,
    "autorole": false
  },
  "welcomeMessage": null,
  "welcomeChannel": null,
  "logChannel": null,
  "modRoles": [],
  "autoRoles": [],
  "automodRules": {
    "antiSpam": false,
    "linkFilter": false,
    "inviteFilter": false,
    "mentionLimit": 10,
    "badWords": [],
    "allowedDomains": []
  }
}
```

You can configure everything through natural language commands - no manual JSON editing needed!

## Feature Migration

### Using Moderation Features

**Before:** Manual moderation through Discord
**Now:** Natural language commands

```
@bot warn @BadUser for spamming
@bot kick @ToxicUser for harassment
@bot timeout @Annoying for 1 hour - excessive caps
@bot show moderation history for @User
```

### Setting Up Automation

**Welcome Messages:**

```
@bot set welcome channel to #welcome
@bot set welcome message to: Hey {user}! Welcome to {server}! 🎉
@bot enable welcome module
```

**Auto-Roles:**

```
@bot add @Member role as auto-role
@bot enable autorole module
```

**Auto-Moderation:**

```
@bot enable automod module
@bot update automod: enable invite filter
@bot update automod: set mention limit to 5
@bot update automod: bad words ["spam", "scam"]
```

### Setting Up Logging

```
@bot set log channel to #mod-log
@bot enable logging module
```

Now events like message deletes, member joins/leaves, and bans will be logged.

## Common Tasks

### Designating Moderators

```
@bot add @Moderator role as mod role
```

Users with this role can use all moderation features even without Discord's native permissions.

### Checking User Info

```
@bot show me info about @SuspiciousUser
@bot how many warnings does @User have?
```

### Managing Roles

```
@bot create a role called "VIP" with color #FFD700
@bot assign VIP role to @User
@bot remove VIP role from @User
```

### Server Management

```
@bot set @User's nickname to "Cool Person"
@bot lock this channel
@bot set slowmode to 10 seconds
@bot purge 50 messages
```

## Troubleshooting

### Bot Not Responding

1. Check that the bot has the Message Content intent enabled
2. Verify the bot can see the channel
3. Make sure you're @mentioning the bot

### Permission Errors

If you get permission errors:

1. Check your Discord permissions
2. Check if you have a configured mod role
3. Verify the bot has required Discord permissions
4. Check role hierarchy (you can't moderate higher-ranked users)

### Database/Storage Issues

If configuration isn't persisting:

1. Check `~/.jarvis/extensions/discord/` exists and is writable
2. Look for error messages in Jarvis logs
3. Verify file permissions (should be 0o700 for directories, 0o600 for files)

### Tools Not Showing Up

If the AI doesn't seem to have the tools:

1. Restart Jarvis gateway
2. Check Jarvis logs for plugin registration errors
3. Verify discord.js is installed: `npm list discord.js`

## Getting Help

**Check Logs:**

```bash
# Jarvis logs show tool calls and errors
tail -f ~/.jarvis/logs/gateway.log
```

**Test Configuration:**

```
@bot show me the current configuration
@bot show server info
```

**Verify Tools:**
Ask the AI:

```
@bot what Discord bot features do you have?
```

## Rollback (If Needed)

If you need to rollback to the old version:

1. Git checkout the previous version
2. Run `pnpm install` to restore old dependencies
3. Restart Jarvis gateway

Note: You'll lose access to new bot features but basic channel integration will still work.

## Best Practices

### 1. Start Small

Enable one module at a time and configure it before enabling others:

```
@bot enable moderation module
@bot add @Mod role as mod role
# Test moderation features
@bot enable welcome module
@bot set welcome channel to #welcome
# And so on...
```

### 2. Set Up Logging Early

```
@bot enable logging module
@bot set log channel to #mod-log
```

This helps you track what's happening in your server.

### 3. Configure Auto-Mod Carefully

Start with basic rules:

```
@bot enable automod module
@bot update automod: enable invite filter
@bot update automod: set mention limit to 10
```

Then gradually add more restrictions based on your needs.

### 4. Test with Low-Risk Actions

Test features with non-destructive actions first:

```
@bot show me info about @YourOwnUser
@bot show server info
@bot get moderation history
```

### 5. Document Your Config

Keep track of your settings:

```
@bot show me the current configuration
```

Copy this somewhere for reference.

## FAQ

**Q: Do I need to reconfigure my Discord token?**
A: No, existing token configuration works as-is.

**Q: Will this break my existing Jarvis/Discord setup?**
A: No, it's backward compatible. Existing message sending/receiving continues to work.

**Q: Can I use both traditional commands and natural language?**
A: The new bot is natural language only, but you can phrase commands however you like.

**Q: How do I disable a feature I don't want?**
A: Use the toggle module command:

```
@bot disable automod module
```

**Q: Where is my data stored?**
A: All data is in `~/.jarvis/extensions/discord/servers/{guildId}/` as JSON files.

**Q: Can I backup my configuration?**
A: Yes, just copy the `~/.jarvis/extensions/discord/` directory.

**Q: Does this work with multiple servers?**
A: Yes! Each server gets its own configuration automatically.

**Q: What if I have multiple bots on my server?**
A: Just @ mention the specific bot you want to use.

## Support

For issues or questions:

1. Check this migration guide
2. Review the README.md for feature documentation
3. Check Jarvis logs for errors
4. Open a GitHub issue if needed

## Changelog

See `IMPLEMENTATION_SUMMARY.md` for full technical details of what changed.

---

**Enjoy your new AI-powered Discord bot! 🤖**
