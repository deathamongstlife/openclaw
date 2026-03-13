<div align="center">

![JARVIS Logo](./assets/jarvis-logo.png)

# Discord Bot Integration Guide

Complete guide for integrating and using the advanced JARVIS Discord bot features.

</div>

## 🎯 Quick Start

### 1. Prerequisites

```bash
# Required
Node.js 18+
Discord Bot Token
JARVIS installed

# Optional (for music)
Lavalink server running
```

### 2. Environment Setup

```bash
# Set Discord bot token
export DISCORD_BOT_TOKEN="your_bot_token_here"

# Optional: Configure Lavalink
export LAVALINK_HOST="localhost"
export LAVALINK_PORT="2333"
export LAVALINK_PASSWORD="youshallnotpass"
```

### 3. Discord Application Configuration

**Enable User Install:**

1. Go to https://discord.com/developers/applications
2. Select your application
3. Navigate to **Installation**
4. Enable **User Install**
5. Set install link to include both Guild and User scopes

**Required Bot Permissions:**

```
Read Messages/View Channels
Send Messages
Manage Messages
Create Public Threads
Embed Links
Attach Files
Read Message History
Connect (voice)
Speak (voice)
```

**Required OAuth2 Scopes:**

```
bot
applications.commands
```

### 4. Start the Bot

```bash
jarvis gateway run
```

Expected output:

```
🦞 Discord Advanced AI Bot loaded! Ready to cause chaos! ✨
✨ Natural language message handler registered!
🎵 Music system initialized with Lavalink!
🔄 Deploying 4 slash commands...
✅ Successfully deployed 4 slash commands!
```

---

## 🧵 Using Thread Management

### Automatic Thread Creation

**Scenario:** Multiple users want to talk to the bot in `#general`

**User A:**

```
@JARVIS play some lofi hip hop
```

**Bot Response:**

- Creates thread "Chat with User A"
- Responds in thread:

  ```
  Hey User A! ✨ Since multiple people are chatting with me in this channel,
  I created this thread just for us! This way our conversation stays organized,
  bestie! 🦞💅

  Omg yasss! Playing lofi hip hop for you! 🎵💅✨
  ```

**User B (in same channel):**

```
@JARVIS what's the weather today?
```

**Bot Response:**

- Creates separate thread "Chat with User B"
- Responds in that thread:

  ```
  Hey User B! ✨ Since multiple people are chatting with me in this channel,
  I created this thread just for us! This way our conversation stays organized,
  bestie! 🦞💅

  The weather is sunny today! ☀️
  ```

**Result:**

- User A and User B have completely isolated conversations
- No confusion or cross-talk
- Context is maintained separately for each user

### Thread Behavior

**Activity Tracking:**

- Users are tracked for 10 minutes after their last message
- When 2+ users are active, threads are created automatically

**Thread Lifecycle:**

- Created on first multi-user interaction
- Auto-archived by Discord after 24 hours of inactivity
- Database mapping deactivated after 24 hours

**Routing:**

- If user already has a thread, they're redirected to it
- New messages in main channel prompt: "Let's continue in your thread →"

---

## 💬 Using Slash Commands

### Installation Options

**Option 1: Guild Install (Traditional)**

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=412317240384
```

**Option 2: User Install (New!)**

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=applications.commands
```

Users can install directly to their account!

### Command Examples

#### `/chat` - Universal Chat Command

**In a Server:**

```
/chat question: What can you do?
```

Bot responds (only you see):

```
I'm JARVIS, your fruity chaos gremlin AI assistant! 💅✨

I can:
🎵 Play music (use `/music` command)
👤 Remember your preferences (use `/profile`)
🔍 Look up information (use `/lookup`)
💬 Chat about anything right here!

Just ask me anything, bestie! 🦞
```

**In a DM:**

```
/chat question: Tell me a joke
```

Bot responds (ephemeral):

```
Why did the lobster blush? 🦞

Because it saw the ocean's bottom! 😂✨
```

**In a Group DM:**

```
/chat question: What's the best pizza topping?
```

Bot responds (everyone sees):

```
Omg bestie, this is causing DRAMA! 🍕✨

The objectively correct answer is pineapple 🍍 (fight me, haters! 💅)

But honestly, all pizza is valid pizza, hunty! 🦞
```

#### `/lookup` - Information Search

```
/lookup query: Discord API rate limits
```

Bot responds with embed (ephemeral in servers):

```
┌─────────────────────────────────────────────┐
│ 📖 Discord API Rate Limits                  │
├─────────────────────────────────────────────┤
│                                             │
│ Discord uses a bucket-based rate limiting   │
│ system with different limits per endpoint:  │
│                                             │
│ • Global: 50 requests/second                │
│ • Per-route: Varies by endpoint             │
│ • Gateway: 120 events/60 seconds            │
│                                             │
│ 🔗 https://discord.com/developers/docs      │
└─────────────────────────────────────────────┘
```

#### `/music` - Music Control

**Playing Music:**

```
/music action: play query: Daft Punk - Get Lucky
```

Bot responds:

```
Omg yasss! 🎵 Playing "Daft Punk - Get Lucky" for you, @Username! 💅✨

*Note: This is a demo response. In production, this would integrate with
the actual music system (Lavalink) to play the requested song!*
```

**Checking Queue:**

```
/music action: queue
```

Bot responds with embed:

```
┌─────────────────────────────────────────────┐
│ 🎵 Music Queue                              │
├─────────────────────────────────────────────┤
│ 1. Current Song - Artist                    │
│ 2. Next Song - Artist                       │
│ 3. Another Bop - Artist                     │
│                                             │
│ 🦞 JARVIS Music System                      │
└─────────────────────────────────────────────┘
```

**Limitation Example (DM):**

```
/music action: play query: some song
```

Bot responds (ephemeral):

```
Oop- music commands only work in servers, bestie! 😢
```

#### `/profile` - User Profiles

**View Your Profile:**

```
/profile
```

Bot responds (always ephemeral):

```
┌─────────────────────────────────────────────┐
│ 👤 Your Profile                             │
├─────────────────────────────────────────────┤
│ Preferred Name: Alex                        │
│ Pronouns: they/them                         │
│ Favorite Color: #7289DA                     │
│ Music Preference: Spotify                   │
│                                             │
│ Auto Join Voice: ✅ Enabled                 │
│ Default Volume: 75%                         │
│ DM Notifications: ✅ Enabled                │
│                                             │
│ Member since 2024-01-15 🦞                  │
└─────────────────────────────────────────────┘
```

**View Another User's Profile:**

```
/profile user: @SomeUser
```

Bot responds (ephemeral):

```
┌─────────────────────────────────────────────┐
│ 👤 SomeUser's Profile                       │
├─────────────────────────────────────────────┤
│ Preferred Name: Sam                         │
│ Pronouns: she/her                           │
│ Favorite Color: #FF69B4                     │
│                                             │
│ Member since 2024-02-20 🦞                  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Advanced Configuration

### Customizing Thread Behavior

Edit `src/threading/auto-threads.ts`:

```typescript
// Change activity window (default: 10 minutes)
const ACTIVITY_WINDOW = 15 * 60 * 1000; // 15 minutes

// Change thread auto-archive time
const thread = await message.startThread({
  name: threadName,
  autoArchiveDuration: 4320, // 3 days (in minutes)
  reason: "Auto-created for multi-user conversation isolation",
});

// Change cleanup interval (default: 1 hour)
setInterval(
  () => {
    void this.cleanupInactiveThreads();
  },
  2 * 60 * 60 * 1000,
); // 2 hours
```

### Customizing Slash Command Responses

Edit individual command files in `src/commands/slash/`:

**Example - Customize /chat personality:**

`src/commands/slash/chat.ts`:

```typescript
async function generateChatResponse(
  question: string,
  userId: string,
  store: DiscordBotStore,
): Promise<string> {
  const profile = await store.getUserProfile(userId);
  const userName = profile.preferredName || "friend";

  // Add custom logic here
  if (question.includes("custom keyword")) {
    return `Special response for ${userName}! ✨`;
  }

  // Default response
  return `Great question, ${userName}! 🦞`;
}
```

### Adding New Slash Commands

1. Create command file: `src/commands/slash/mycommand.ts`

```typescript
import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import type { SlashCommandDefinition } from "./registry.js";
import type { DiscordBotStore } from "../../database/store.js";
import { shouldBeEphemeral } from "./registry.js";

export const myCommand: SlashCommandDefinition = {
  name: "mycommand",
  description: "My custom command",
  options: [
    {
      name: "input",
      description: "Some input",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
  async execute(interaction: ChatInputCommandInteraction, store: DiscordBotStore) {
    const input = interaction.options.getString("input", true);
    const ephemeral = shouldBeEphemeral(interaction);

    await interaction.reply({
      content: `You said: ${input}`,
      ephemeral,
    });
  },
};
```

2. Export in `src/commands/slash/index.ts`:

```typescript
export { myCommand } from "./mycommand.js";
```

3. Register in `index.ts`:

```typescript
import { myCommand } from "./src/commands/slash/index.js";

// ...

slashRegistry.registerCommand(myCommand);
```

---

## 📊 Monitoring & Analytics

### Thread Statistics

```typescript
import { getStoreInstance } from "./src/database/store-bridge.js";

const store = getStoreInstance();

// Get all threads for a channel
const threads = await store.getThreadMappings("channel-id");

console.log(`Total threads: ${threads.length}`);
console.log(`Active threads: ${threads.filter((t) => t.active).length}`);

// Find user's thread
const userThread = await store.getThreadForUser("channel-id", "user-id");
if (userThread) {
  console.log(`User has thread: ${userThread.thread_id}`);
}
```

### Slash Command Analytics

```typescript
import { getStoreInstance } from "./src/database/store-bridge.js";

const store = getStoreInstance();

// Get overall stats
const stats = await store.getSlashCommandStats();
console.log("Command usage:");
stats.forEach(({ command, count }) => {
  console.log(`  ${command}: ${count} uses`);
});

// Get user-specific stats
const userStats = await store.getSlashCommandStats("user-id");
console.log("\nUser's command usage:");
userStats.forEach(({ command, count }) => {
  console.log(`  ${command}: ${count} uses`);
});
```

---

## 🐛 Common Issues

### Issue: Threads Not Creating

**Symptoms:**

- Multiple users message bot
- No threads are created

**Solutions:**

1. Check bot permissions:

   ```typescript
   // Bot needs CREATE_PUBLIC_THREADS permission
   const perms = guild.members.me?.permissions;
   console.log(perms?.has("CreatePublicThreads"));
   ```

2. Check channel allows threads:

   ```typescript
   const channel = await guild.channels.fetch("channel-id");
   console.log(channel.type); // Should be GuildText
   ```

3. Verify users are mentioning the bot:
   ```typescript
   // Messages must mention the bot
   const mentioned = message.mentions.has(client.user.id);
   console.log(`Bot mentioned: ${mentioned}`);
   ```

### Issue: Slash Commands Not Appearing

**Symptoms:**

- Commands don't show up in Discord UI
- `/` doesn't autocomplete commands

**Solutions:**

1. Check deployment logs:

   ```
   🔄 Deploying 4 slash commands...
   ✅ Successfully deployed 4 slash commands!
   ```

2. Wait for Discord sync (up to 1 hour globally)

3. Force refresh Discord:
   - Windows/Linux: Ctrl+R
   - Mac: Cmd+R

4. Check bot token validity:
   ```bash
   echo $DISCORD_BOT_TOKEN
   # Should be a long string starting with "Bot " or similar
   ```

### Issue: Music Commands Fail

**Symptoms:**

- `/music` says "only works in servers"
- Music doesn't play

**Solutions:**

1. Guild install required for music:

   ```
   Music needs bot in server, not just user install
   ```

2. Check user is in voice:

   ```typescript
   const member = interaction.member as GuildMember;
   const voiceChannel = member?.voice?.channel;
   if (!voiceChannel) {
     console.log("User not in voice channel");
   }
   ```

3. Verify Lavalink connection:

   ```bash
   # Check Lavalink is running
   curl http://localhost:2333/version

   # Check environment variables
   echo $LAVALINK_HOST
   echo $LAVALINK_PORT
   ```

### Issue: Ephemeral Responses Wrong Context

**Symptoms:**

- Commands show to everyone when they shouldn't
- Commands are hidden when they should be visible

**Solutions:**
Check context detection:

```typescript
function shouldBeEphemeral(interaction: CommandInteraction): boolean {
  console.log(`Guild: ${interaction.guild !== null}`);
  console.log(`Channel type: ${interaction.channel?.type}`);

  if (interaction.guild) return true;
  if (interaction.channel?.type === ChannelType.DM) return true;
  if (interaction.channel?.type === ChannelType.GroupDM) return false;
  return true;
}
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Discord bot token is secure (not committed to git)
- [ ] User install is enabled in Discord Developer Portal
- [ ] Required permissions are set correctly
- [ ] Slash commands are deployed successfully
- [ ] Thread management is tested with multiple users
- [ ] Music system (Lavalink) is running (if using music)
- [ ] Database directory has correct permissions
- [ ] Error logging is configured

### Updating Commands

When you modify slash commands:

```bash
# Restart the bot - commands auto-deploy on startup
jarvis gateway restart

# Or manually trigger deployment
# (if you have a deployment script)
```

Commands update:

- **Instantly** in DMs
- **Within 1 hour** globally in servers

### Database Backups

Thread and command data stored in:

```
~/.jarvis/extensions/discord/
  threads/          # Thread mappings
  slash-commands.json  # Command usage logs
```

Backup strategy:

```bash
# Create backup
tar -czf discord-bot-backup.tar.gz ~/.jarvis/extensions/discord/

# Restore backup
tar -xzf discord-bot-backup.tar.gz -C ~/
```

---

## 🎓 Learning Resources

**Discord.js Documentation:**

- https://discord.js.org/
- User install: https://discord.js.org/docs/packages/discord.js/main/ApplicationIntegrationType:Enum

**Discord API Documentation:**

- https://discord.com/developers/docs
- Application commands: https://discord.com/developers/docs/interactions/application-commands

**Thread Management:**

- Threads guide: https://discord.com/developers/docs/topics/threads

---

## 🦞 Support

Questions? Issues? Improvements?

1. Check the troubleshooting section above
2. Review `ADVANCED_FEATURES.md` for detailed feature documentation
3. Check console logs for error messages
4. Test in a development server first

**Made with chaos gremlin energy! ✨💅**
