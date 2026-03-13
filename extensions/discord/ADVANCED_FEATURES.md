<div align="center">

![JARVIS Logo](./assets/jarvis-logo.png)

# Advanced Discord Bot Features

</div>

This document covers the two major advanced features added to the JARVIS Discord bot:

1. **Automatic Thread Management** - Multi-user conversation isolation
2. **User-Installable Slash Commands** - Use JARVIS anywhere, even without the bot in servers

---

## 🧵 Automatic Thread Management

### Overview

When multiple users talk to the bot in the same channel, the bot automatically creates separate threads for each user to maintain isolated conversations.

### How It Works

1. **User Tracking**: The bot tracks active users in each channel (activity within last 10 minutes)
2. **Thread Creation**: When 2+ users are actively talking to the bot, it creates individual threads
3. **Message Routing**: Each user's messages are automatically routed to their dedicated thread
4. **Context Isolation**: Conversations stay separate - no cross-talk between users
5. **Auto-Cleanup**: Inactive threads (24h of no activity) are automatically cleaned up

### User Experience

**Without Threading (Confusing):**

```
#general
User A: @JARVIS play some music
JARVIS: Playing music for you!
User B: @JARVIS what's the weather?
JARVIS: It's sunny today!
User A: @JARVIS skip this song
JARVIS: Skipped! (but which user's music?)
```

**With Threading (Clear):**

```
#general
User A: @JARVIS play some music
  → JARVIS creates thread "Chat with User A"
  → JARVIS: "Hey User A! ✨ I created this thread just for us!"

User B: @JARVIS what's the weather?
  → JARVIS creates thread "Chat with User B"
  → JARVIS: "Hey User B! ✨ I created this thread just for us!"

Both users have isolated conversations in their own threads!
```

### Technical Details

**Files:**

- `src/threading/auto-threads.ts` - Thread creation and management
- `src/threading/conversation-router.ts` - Message routing logic
- `src/database/types.ts` - ThreadMapping type
- `src/database/store.ts` - Thread persistence methods

**Database Schema:**

```typescript
interface ThreadMapping {
  thread_id: string; // Discord thread ID
  channel_id: string; // Parent channel ID
  user_id: string; // User this thread belongs to
  created_at: number; // Creation timestamp
  last_activity: number; // Last message timestamp
  active: boolean; // Is thread still active?
}
```

**Configuration:**

- Activity window: 10 minutes (user considered active if messaged in last 10 min)
- Thread lifetime: 24 hours (threads auto-archive after 24h per Discord)
- Cleanup interval: 1 hour (inactive threads marked as inactive every hour)
- User tracking cleanup: 5 minutes (old tracking data removed every 5 min)

### Usage

No configuration needed! The system automatically:

1. Detects when multiple users are talking to the bot
2. Creates threads as needed
3. Routes messages to the correct thread
4. Cleans up old threads

---

## 💬 User-Installable Slash Commands

### Overview

Users can install JARVIS to their Discord account and use slash commands **anywhere** - even in servers that don't have the bot installed!

### Available Commands

#### `/chat <question>`

Ask JARVIS anything, anywhere!

**Features:**

- Works in servers, DMs, and group DMs
- Natural language processing
- Personalized responses based on user profile
- Context-aware answers

**Ephemeral Behavior:**

- ✅ Ephemeral in servers (only you see the response)
- ✅ Ephemeral in DMs (private conversation)
- ❌ Non-ephemeral in group DMs (everyone sees, for group context)

**Example:**

```
/chat question: What can you do?
→ JARVIS responds with capabilities (only you see in servers)
```

#### `/lookup <query>`

Look up information about anything.

**Features:**

- Search for information
- Embeds with formatted results
- Links to sources when available
- Works everywhere

**Ephemeral Behavior:**

- ✅ Ephemeral in servers
- ✅ Ephemeral in DMs
- ❌ Non-ephemeral in group DMs

**Example:**

```
/lookup query: Discord API
→ Formatted information about Discord API
```

#### `/music <action> [query]`

Control music playback.

**Actions:**

- `play` - Play a song (requires `query` parameter)
- `pause` - Pause current song
- `resume` - Resume playback
- `skip` - Skip to next song
- `stop` - Stop playback and leave voice
- `queue` - Show current queue
- `nowplaying` - Show currently playing song

**Limitations:**

- ⚠️ Only works in **servers** where the bot is present
- ⚠️ User must be in a voice channel (for `play` command)
- ❌ Does NOT work in DMs or servers without the bot

**Example:**

```
/music action: play query: lofi hip hop
→ JARVIS plays the song in your voice channel
```

#### `/profile [user]`

View user profile and preferences.

**Features:**

- View your own profile (default)
- View another user's profile (optional `user` parameter)
- Shows preferred name, pronouns, favorite color
- Shows music preferences
- Shows user settings (only for your own profile)

**Ephemeral Behavior:**

- ✅ **Always ephemeral** (for privacy)

**Example:**

```
/profile
→ Shows your profile (only you see it)

/profile user: @SomeUser
→ Shows SomeUser's profile (only you see it)
```

### How User Install Works

**Traditional Bot Install:**

- Server admin adds bot to server
- Bot has permissions in that server only
- Users can only interact in servers with the bot

**User Install (New!):**

- Individual users install bot to their account
- Users can use slash commands anywhere
- Works in DMs, group DMs, and any server
- Some features require bot presence (like music)

### Technical Details

**Files:**

- `src/commands/slash/registry.ts` - Command registration system
- `src/commands/slash/chat.ts` - /chat command
- `src/commands/slash/lookup.ts` - /lookup command
- `src/commands/slash/music.ts` - /music command
- `src/commands/slash/profile.ts` - /profile command
- `src/commands/slash/index.ts` - Command exports
- `jarvis.plugin.json` - Integration type configuration

**Plugin Configuration:**

```json
{
  "integration_types_config": {
    "0": {
      // Guild Install
      "oauth2_install_params": {
        "scopes": ["bot", "applications.commands"],
        "permissions": "412317240384"
      }
    },
    "1": {
      // User Install
      "oauth2_install_params": {
        "scopes": ["applications.commands"],
        "permissions": "0"
      }
    }
  }
}
```

**Command Registration:**

```typescript
{
  name: "chat",
  description: "Ask JARVIS anything, anywhere!",
  integration_types: [
    ApplicationIntegrationType.GuildInstall,  // Works in servers
    ApplicationIntegrationType.UserInstall,   // Works as user install
  ],
  contexts: [
    InteractionContextType.Guild,            // Servers
    InteractionContextType.BotDM,            // DMs
    InteractionContextType.PrivateChannel,   // Group DMs
  ]
}
```

**Ephemeral Logic:**

```typescript
function shouldBeEphemeral(interaction: CommandInteraction): boolean {
  if (interaction.guild) return true; // Ephemeral in servers
  if (interaction.channel?.type === ChannelType.DM) return true; // Ephemeral in DMs
  if (interaction.channel?.type === ChannelType.GroupDM) return false; // Visible in group DMs
  return true; // Default to ephemeral
}
```

**Database Tracking:**

```typescript
interface SlashCommandLog {
  id: string;
  user_id: string;
  command: string;
  context: "guild" | "dm" | "group_dm";
  was_ephemeral: boolean;
  timestamp: number;
}
```

### Usage Statistics

The bot automatically tracks slash command usage:

```typescript
// Get stats for all users
const stats = await store.getSlashCommandStats();

// Get stats for specific user
const userStats = await store.getSlashCommandStats(userId);

// Returns: [{ command: "chat", count: 42 }, ...]
```

---

## 🚀 Installation & Setup

### Prerequisites

1. Node.js 18+ installed
2. Discord bot token with required permissions
3. JARVIS system configured

### Configuration

Add to your Discord application settings:

1. Go to Discord Developer Portal
2. Select your application
3. Navigate to "Installation"
4. Enable both "Guild Install" and "User Install"
5. Set scopes and permissions as shown in `jarvis.plugin.json`

### Environment Variables

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
```

### Starting the Bot

The features activate automatically when the bot starts:

```bash
jarvis gateway run
```

You'll see:

```
⚡ Discord Advanced AI Bot loaded! Ready to cause chaos! ✨
🔄 Deploying 4 slash commands...
✅ Successfully deployed 4 slash commands!
```

---

## 📊 Monitoring

### Thread Management

Check active threads:

```typescript
const threads = await store.getThreadMappings(channelId);
console.log(`Active threads: ${threads.filter((t) => t.active).length}`);
```

Cleanup inactive threads:

```typescript
await store.cleanupInactiveThreads(24 * 60 * 60 * 1000); // 24 hours
```

### Slash Command Analytics

Get command usage stats:

```typescript
const stats = await store.getSlashCommandStats();
stats.forEach(({ command, count }) => {
  console.log(`${command}: ${count} uses`);
});
```

---

## 🎯 Best Practices

### For Users

**Threading:**

- Each user gets their own private thread
- Threads auto-archive after 24 hours of inactivity
- Just mention the bot normally - threading is automatic!

**Slash Commands:**

- Use `/chat` for general questions
- Use `/lookup` for information search
- Use `/music` only in servers where bot is installed
- Use `/profile` to customize your experience

### For Developers

**Thread Management:**

- Don't manually create threads - let the system handle it
- Threads clean up automatically - no manual intervention needed
- Check `threadManager.routeMessageToThread()` for custom routing

**Slash Commands:**

- Always check `shouldBeEphemeral()` before replying
- Defer replies for long-running operations
- Handle guild-only commands gracefully in DMs
- Log all command usage for analytics

---

## 🐛 Troubleshooting

### Threads Not Creating

**Issue:** Multiple users talking but no threads created
**Solution:** Check that:

- Bot has `CREATE_PUBLIC_THREADS` permission
- Channel allows threads
- Users are mentioning the bot correctly

### Slash Commands Not Appearing

**Issue:** Commands not showing up in Discord
**Solution:**

- Check bot token is valid
- Ensure bot is logged in successfully
- Wait up to 1 hour for Discord to sync commands globally
- Check console for "Successfully deployed X slash commands"

### Music Commands Failing

**Issue:** `/music` says it doesn't work
**Solution:**

- Music only works in servers where bot is **guild installed**
- User must be in a voice channel
- Lavalink server must be running
- Check bot has voice permissions

---

## 🔮 Future Enhancements

**Threading:**

- [ ] Thread naming customization
- [ ] Multi-threaded conversations per user
- [ ] Thread archiving settings
- [ ] Thread activity notifications

**Slash Commands:**

- [ ] More commands (`/remind`, `/translate`, etc.)
- [ ] Command autocomplete
- [ ] Context menus (right-click commands)
- [ ] Modal forms for complex inputs

---

## 📝 API Reference

### AutoThreadManager

```typescript
class AutoThreadManager {
  constructor(store: DiscordBotStore, client: Client);

  async handleMessage(message: Message): Promise<void>;
  async routeMessageToThread(message: Message): Promise<ThreadChannel | null>;
  cleanup(): void;
}
```

### ConversationRouter

```typescript
class ConversationRouter {
  constructor(threadManager: AutoThreadManager);

  async routeMessage(message: Message): Promise<ConversationContext>;
  async shouldCreateThread(message: Message): Promise<boolean>;
  getReplyTarget(context: ConversationContext, originalMessage: Message): Message;
}
```

### SlashCommandRegistry

```typescript
class SlashCommandRegistry {
  constructor(client: Client, store: DiscordBotStore, token: string);

  registerCommand(command: SlashCommandDefinition): void;
  async deployCommands(): Promise<void>;
  async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void>;
  setupInteractionHandler(): void;
}
```

---

## ⚡ Made with Chaos Gremlin Energy ✨

These features make JARVIS the **ultimate multi-use natural-language bot** that works everywhere! 💅
