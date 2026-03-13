# Discord Bot Setup for JARVIS

## Quick Setup (5 minutes)

### Step 1: Create Discord Bot

1. **Go to Discord Developer Portal:**
   https://discord.com/developers/applications

2. **Create New Application:**
   - Click "New Application"
   - Name it "JARVIS" (or any name you prefer)
   - Click "Create"

3. **Create Bot User:**
   - Go to "Bot" tab in left sidebar
   - Click "Add Bot"
   - Confirm "Yes, do it!"

4. **Copy Bot Token:**
   - Under "TOKEN", click "Copy"
   - **Save this token** - you'll need it for JARVIS config
   - ⚠️ **Never share this token publicly**

5. **Enable Required Intents:**
   Scroll down to "Privileged Gateway Intents" and enable:
   - ✅ **Message Content Intent** (REQUIRED)
   - ✅ Server Members Intent (optional)
   - ✅ Presence Intent (optional)

6. **Save Changes:**
   - Click "Save Changes" at bottom of page

### Step 2: Invite Bot to Your Server

1. **Go to OAuth2 → URL Generator:**
   - In left sidebar, click "OAuth2" → "URL Generator"

2. **Select Scopes:**
   - ✅ `bot`
   - ✅ `applications.commands`

3. **Select Bot Permissions:**
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Send Messages in Threads
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands

4. **Copy Generated URL:**
   - Scroll to bottom and copy the "Generated URL"

5. **Open URL in Browser:**
   - Paste URL in browser
   - Select your Discord server
   - Click "Authorize"
   - Complete captcha if prompted

### Step 3: Configure JARVIS

```bash
# Set your Discord bot token
jarvis config set discord.token "YOUR_BOT_TOKEN_HERE"

# Enable Discord channel
jarvis config set discord.enabled true

# Optional: Set command prefix (default: !)
jarvis config set discord.prefix "!"

# Optional: Restrict to specific channels (empty = all channels)
jarvis config set discord.allowedChannels "[]"

# Optional: Restrict to specific users (empty = all users)
jarvis config set discord.allowedUsers "[]"
```

### Step 4: Start JARVIS Gateway

```bash
jarvis gateway run
```

### Step 5: Test Your Bot

In any Discord channel where your bot has access:

```
@JARVIS hello
```

Or if using command prefix:

```
!jarvis hello
```

---

## Configuration Options

### Basic Configuration

```yaml
# ~/.jarvis/config.yaml

discord:
  enabled: true
  token: "YOUR_BOT_TOKEN"
  prefix: "!"
```

### Advanced Configuration

```yaml
discord:
  enabled: true
  token: "YOUR_BOT_TOKEN"
  prefix: "!"

  # Only allow bot in specific channels
  allowedChannels:
    - "1234567890123456789" # Channel ID
    - "9876543210987654321" # Another channel ID

  # Only allow specific users
  allowedUsers:
    - "1111111111111111111" # User ID

  # Only allow specific roles
  allowedRoles:
    - "2222222222222222222" # Role ID

  # Mention requirement (true = must @mention bot)
  requireMention: false

  # Auto-react to messages
  reactOnMessage: true
  reactionEmoji: "✅"

  # Response settings
  typingIndicator: true
  streamResponses: true

  # Rate limiting
  rateLimit:
    maxMessages: 10
    windowMs: 60000 # 1 minute
```

---

## Getting Channel/User/Role IDs

### Enable Developer Mode

1. In Discord, go to: **User Settings** → **Advanced**
2. Enable **Developer Mode**

### Get Channel ID

1. Right-click on channel
2. Click "Copy Channel ID"

### Get User ID

1. Right-click on user
2. Click "Copy User ID"

### Get Role ID

1. Server Settings → Roles
2. Right-click on role
3. Click "Copy Role ID"

---

## Common Bot Commands

### Mention Bot

```
@JARVIS what is the weather today?
```

### Use Command Prefix

```
!help
!status
!config
```

### Direct Messages

Send a DM to your bot - it will respond if DMs are enabled.

---

## Troubleshooting

### Bot Not Responding

1. **Check bot is online:**
   - Look for green dot next to bot name in Discord member list

2. **Verify token:**

   ```bash
   jarvis config get discord.token
   ```

3. **Check gateway status:**

   ```bash
   jarvis gateway status
   jarvis channels status
   ```

4. **Check logs:**

   ```bash
   jarvis gateway logs --filter discord
   ```

5. **Verify intents enabled:**
   - Go back to Discord Developer Portal
   - Bot tab → Privileged Gateway Intents
   - Ensure "Message Content Intent" is enabled

### Bot Joins Server But Doesn't Respond

- Check `discord.allowedChannels` config (empty = all channels)
- Check `discord.requireMention` setting
- Ensure bot has "Read Messages" and "Send Messages" permissions
- Try mentioning bot: `@JARVIS hello`

### "Missing Access" Error

Bot needs proper permissions:

1. Server Settings → Roles
2. Find bot role
3. Enable required permissions (see Step 2 above)

### Rate Limited

Discord has rate limits:

- 5 messages per 5 seconds per channel
- 10 DMs per 10 seconds
- Configure `discord.rateLimit` in config to stay within limits

---

## Best Practices

### Security

1. **Never commit bot token to git**
   - Use environment variables
   - Add to `.gitignore`: `.env`, `config.yaml`

2. **Rotate token if exposed:**
   - Discord Developer Portal → Bot → "Reset Token"
   - Update JARVIS config with new token

3. **Use role-based permissions:**
   - Create "JARVIS Users" role
   - Only allow that role to use bot
   - Configure `discord.allowedRoles`

### Performance

1. **Limit channels:**
   - Only enable in channels where needed
   - Reduces message processing load

2. **Enable rate limiting:**
   - Prevents spam
   - Protects against Discord API limits

3. **Use streaming responses:**
   - Better UX for long responses
   - Configure `discord.streamResponses: true`

### User Experience

1. **Set clear prefix:**
   - Use memorable prefix like `!jarvis`
   - Or require mentions only

2. **Add helpful reactions:**
   - ✅ on success
   - ⏳ while processing
   - ❌ on error

3. **Enable typing indicator:**
   - Shows bot is "thinking"
   - Configure `discord.typingIndicator: true`

---

## Example: Complete Setup

```bash
# 1. Set bot token (from Discord Developer Portal)
jarvis config set discord.token "MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.AbCdEf.GhIjKlMnOpQrStUvWxYz"

# 2. Enable Discord
jarvis config set discord.enabled true

# 3. Set prefix
jarvis config set discord.prefix "!jarvis"

# 4. Restrict to specific channel (optional)
jarvis config set discord.allowedChannels '["1234567890123456789"]'

# 5. Enable features
jarvis config set discord.typingIndicator true
jarvis config set discord.streamResponses true
jarvis config set discord.reactOnMessage true

# 6. Start gateway
jarvis gateway run

# 7. Test in Discord
# @JARVIS hello
# !jarvis status
```

---

## Next Steps

After Discord is working:

1. **Set up other channels:** Telegram, Slack, Signal
2. **Configure AI providers:** OpenAI, Anthropic, local models
3. **Set up web UI:** For browser-based chat
4. **Add skills:** Extend bot capabilities
5. **Configure agents:** Multi-agent workflows

---

**Need help?** Run `jarvis discord --help` or check the main documentation.
