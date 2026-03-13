<div align="center">

![JARVIS Logo](./assets/jarvis-logo.png)

# Discord Advanced AI Bot Extension

**THE MOST ADVANCED NATURAL LANGUAGE AI DISCORD BOT** ⚡✨💅

A comprehensive Discord bot extension for JARVIS with natural language understanding, music playback, voice TTS, moderation, and a **fruity chaos gremlin personality**.

</div>

## ✨ Features Overview

### 🎵 Music System (Lavalink + Shoukaku)

Full-featured music player with queue management:

- **Play music** from YouTube, SoundCloud, and Spotify
- **Queue management**: Add, skip, shuffle, loop (track/queue)
- **Playback controls**: Play, pause, resume, stop
- **Volume control**: 0-100% volume
- **Now playing** display with progress and metadata
- **Interactive Controls**: Buttons for play/pause, skip, stop, shuffle, loop

**Natural Language Examples:**

```
"Play some lofi hip hop"
"Skip this song"
"What's playing right now?"
"Shuffle the queue"
"Set volume to 75"
"Loop this track"
```

### 🎤 Voice TTS System

Text-to-speech in voice channels:

- **Auto-join** voice channels on user greeting
- **Speak responses** using discord-tts
- **Personalized greetings** in voice
- Multiple language support

### 🔨 Moderation

Comprehensive moderation tools:

- **Warn** users with tracked warnings
- **Kick/Ban/Unban** users with reason logging
- **Timeout** (mute) users for specified duration
- **Slowmode** for channels (0-6 hours)
- **Lock/Unlock** channels
- **Purge messages** (bulk delete, optional user filter)
- **Warning management**: View, clear warnings

**Natural Language Examples:**

```
"Warn @user for spamming"
"Kick @user they're being toxic"
"Timeout @user for 10 minutes"
"Lock this channel"
"Purge 50 messages"
```

### 🎭 Server Management

Role and member management:

- **Create/Delete** roles with colors and settings
- **Assign/Remove** roles from users
- **Set nicknames** for members
- **Server info**: Member count, roles, channels

### 📊 Utility Commands

Information and stats:

- **User info**: Roles, warnings, join date, avatar
- **Server info**: Members, channels, roles, stats
- **Role info**: Permissions, color, member count
- **Moderation history**: View past actions

### 🤖 Automation

Automated server management:

- **Welcome messages** with variable support (`{user}`, `{server}`, etc.)
- **Auto-roles** assigned to new members
- **Auto-moderation**: Spam, link filtering, bad words
- **Event logging**: Message deletes, member joins/leaves, etc.

### 👤 Per-User Identity System

Personalized user experience:

- **Onboarding flow**: Asks for preferred name and pronouns
- **User profiles**: Store preferences, music settings, TTS language
- **Personalized greetings**: Uses preferred names
- **Persistent storage**: JSON-based profile system

**Onboarding Flow:**

```
Bot: "Omg hi bestie! 💅✨ What should I call you?"
User: "Alex"
Bot: "Awesome! And what are your pronouns?"
User: "they/them"
Bot: "Perfect, Alex! We're all set! 💅✨"
```

### ✨ Chaos Gremlin Personality

Fruity, gay, playful, chaotic energy with technical competence:

- **Responses**: "Omg yasss!", "Oop-", "bestie", "hunty" 💅✨⚡
- **Emojis**: Strategic use of ✨💅⚡💃🎵
- **Helpful**: Combines fun personality with JARVIS-level competence

**Example Responses:**

```
Success: "Omg bestie, playing that bop for you! 💅✨"
Error: "Oop- something went wrong, hunty! 😢"
Music: "Now serving: Lofi Beats! 🎵✨"
Moderation: "Oop- let me yeet that user into the timeout corner ⚡"
```

### 🎮 Components V2 UI

Rich interactive Discord components:

- **Music controls**: Play/Pause, Skip, Stop, Shuffle, Loop buttons
- **Volume controls**: Up, Down, Mute buttons
- **Queue navigation**: Page forward/back, clear queue
- **Moderation actions**: Quick warn/kick/ban buttons
- **Server info tabs**: Overview, Members, Roles, Channels
- **Polls**: Interactive voting buttons

## 🚀 Setup

### Prerequisites

1. **Lavalink Server** (for music features):

   **Quick Install (Recommended):**

   ```bash
   # One-liner installer (installs Lavalink, ffmpeg, and systemd service)
   sudo bash extensions/discord/scripts/install-lavalink.sh
   ```

   This script will:
   - Install Java 17+, ffmpeg, and all dependencies
   - Download Lavalink 4.0.7
   - Create systemd service for automatic startup
   - Configure Lavalink for JARVIS integration
   - Start service immediately

   **Manual Install:**

   ```bash
   # Download Lavalink
   wget https://github.com/lavalink-devs/Lavalink/releases/download/4.0.7/Lavalink.jar

   # Run Lavalink
   java -jar Lavalink.jar
   ```

2. **Environment Variables**:

   ```bash
   # Optional: Configure Lavalink connection
   export LAVALINK_URL="localhost:2333"
   export LAVALINK_AUTH="youshallnotpass"

   # Discord bot token (handled by Jarvis config)
   export DISCORD_BOT_TOKEN="your_token_here"
   ```

### Installation

1. Install dependencies:

   ```bash
   cd extensions/discord
   pnpm install
   ```

2. Configure Discord bot in Jarvis:

   ```bash
   jarvis config set channels.discord.enabled=true
   jarvis config set channels.discord.token="YOUR_DISCORD_BOT_TOKEN"
   ```

3. Enable required Discord intents in Developer Portal:
   - Navigate to https://discord.com/developers/applications
   - Select your bot
   - Go to Bot → Privileged Gateway Intents
   - Enable: `SERVER MEMBERS INTENT`, `MESSAGE CONTENT INTENT`

4. Start Jarvis gateway:
   ```bash
   jarvis gateway run
   ```

## 📁 Architecture

```
extensions/discord/
├── index.ts                    # Plugin registration
├── package.json                # Dependencies
├── README.md                   # This file
├── src/
│   ├── channel.ts              # Channel plugin
│   ├── runtime.ts              # Runtime store
│   ├── bot-client.ts           # Discord.js client wrapper
│   │
│   ├── music/                  # Music system
│   │   ├── manager.ts          # Shoukaku Lavalink manager
│   │   ├── player.ts           # Music player per guild
│   │   ├── queue.ts            # Queue management
│   │   └── service.ts          # Music service (high-level API)
│   │
│   ├── voice/                  # Voice TTS
│   │   └── tts.ts              # Text-to-speech manager
│   │
│   ├── personality/            # Chaos gremlin personality
│   │   └── responses.ts        # Response templates & generators
│   │
│   ├── identity/               # Per-user identity
│   │   ├── profiles.ts         # User profile management
│   │   └── onboarding.ts       # Onboarding flow
│   │
│   ├── ui/                     # Components V2
│   │   └── components.ts       # UI builders (buttons, embeds, etc.)
│   │
│   ├── nlp/                    # Natural language processing
│   │   ├── intents.ts          # Intent classification
│   │   ├── parser.ts           # NL parser
│   │   └── context.ts          # Conversation context
│   │
│   ├── bot-features/           # Bot features
│   │   ├── moderation.ts       # Moderation commands
│   │   ├── management.ts       # Server management
│   │   ├── utility.ts          # Info commands
│   │   ├── config.ts           # Configuration
│   │   ├── permissions.ts      # Permission checks
│   │   └── automation.ts       # Auto-mod, welcome, etc.
│   │
│   ├── database/               # Persistence
│   │   ├── store.ts            # Main storage class
│   │   ├── types.ts            # Database types
│   │   └── migrations.ts       # Schema migrations
│   │
│   └── tools/                  # Agent tools
│       ├── index.ts            # Tool registry
│       └── music.ts            # Music tools
```

## 💾 Database Schema

User profiles stored in `~/.jarvis/extensions/discord/users/`:

```typescript
interface UserProfile {
  userId: string;
  preferredName: string | null;
  pronouns: string | null;
  favoriteColor: string | null;
  musicPreference: "youtube" | "soundcloud" | "spotify" | null;
  ttsLanguage: string | null;
  onboarded: boolean;
  createdAt: number;
  updatedAt: number;
}

interface UserPreferences {
  userId: string;
  autoJoinVoice: boolean;
  autoPlayMusic: boolean;
  defaultVolume: number;
  notifyOnMention: boolean;
  dmNotifications: boolean;
}
```

Server configs stored in `~/.jarvis/extensions/discord/servers/{guildId}/`:

- `config.json` - Server configuration
- `warnings.json` - User warnings
- `moderation.json` - Moderation action log
- `events.json` - Event logs (auto-trimmed to 1000)

## 🛠️ API Reference

### Music Tools

- `discord_play_music(guildId, userId, channelId, query, source?)` - Play music
- `discord_pause_music(guildId)` - Pause playback
- `discord_resume_music(guildId)` - Resume playback
- `discord_skip_music(guildId)` - Skip track
- `discord_stop_music(guildId)` - Stop and clear queue
- `discord_set_volume(guildId, volume)` - Set volume (0-100)
- `discord_get_queue(guildId, page?)` - Get queue
- `discord_now_playing(guildId)` - Get now playing info
- `discord_shuffle_queue(guildId)` - Shuffle queue
- `discord_set_loop(guildId, mode)` - Set loop mode (off/track/queue)

### Moderation Tools

- `discord_warn_user(guildId, moderatorId, userId, reason)` - Warn user
- `discord_kick_user(guildId, moderatorId, userId, reason)` - Kick user
- `discord_ban_user(guildId, moderatorId, userId, reason, deleteMessageDays?)` - Ban user
- `discord_unban_user(guildId, moderatorId, userId, reason)` - Unban user
- `discord_timeout_user(guildId, moderatorId, userId, durationMinutes, reason)` - Timeout user
- `discord_clear_warnings(guildId, moderatorId, userId)` - Clear warnings
- `discord_set_slowmode(guildId, channelId, moderatorId, seconds)` - Set slowmode
- `discord_lock_channel(guildId, channelId, moderatorId, lock)` - Lock/unlock channel
- `discord_purge_messages(guildId, channelId, moderatorId, count, userId?)` - Purge messages

### Utility Tools

- `discord_get_user_info(guildId, userId)` - Get user info
- `discord_get_server_info(guildId)` - Get server info
- `discord_get_role_info(guildId, roleId)` - Get role info
- `discord_get_moderation_history(guildId, userId?, limit?)` - Get mod history

### Management Tools

- `discord_create_role(guildId, executorId, name, color?, hoist?, mentionable?)` - Create role
- `discord_delete_role(guildId, executorId, roleId)` - Delete role
- `discord_assign_role(guildId, executorId, userId, roleId)` - Assign role
- `discord_remove_role(guildId, executorId, userId, roleId)` - Remove role
- `discord_set_nickname(guildId, executorId, userId, nickname)` - Set nickname

### Configuration Tools

- `discord_set_welcome_message(guildId, executorId, message)` - Set welcome message
- `discord_set_welcome_channel(guildId, executorId, channelId)` - Set welcome channel
- `discord_set_log_channel(guildId, executorId, channelId)` - Set log channel
- `discord_toggle_module(guildId, executorId, module, enabled)` - Enable/disable module
- `discord_add_mod_role(guildId, executorId, roleId)` - Add moderator role
- `discord_remove_mod_role(guildId, executorId, roleId)` - Remove moderator role
- `discord_add_auto_role(guildId, executorId, roleId)` - Add auto-role
- `discord_remove_auto_role(guildId, executorId, roleId)` - Remove auto-role
- `discord_update_automod_rules(guildId, executorId, rules)` - Update auto-mod rules
- `discord_get_config(guildId)` - Get server config

## 💬 Natural Language Examples

### Music Commands

```
"Play some lofi beats"
"Play never gonna give you up"
"Skip this song"
"Pause the music"
"What's playing?"
"Show me the queue"
"Shuffle the playlist"
"Set volume to 50"
"Loop this track"
"Stop the music"
```

### Moderation Commands

```
"Warn @user for spam"
"Kick @baduser for being toxic"
"Ban @spammer permanently"
"Timeout @user for 30 minutes"
"Lock this channel"
"Set slowmode to 10 seconds"
"Purge 20 messages"
"Show warnings for @user"
```

### Utility Commands

```
"Show server info"
"Who is @user?"
"What roles does @user have?"
"Create a poll: Pizza or Tacos?"
"Show moderation history"
```

### Configuration Commands

```
"Set welcome message to: Welcome {user} to {server}!"
"Enable auto-moderation"
"Add @Moderator as a mod role"
"Set the log channel to #mod-logs"
```

## 🐛 Troubleshooting

### Music Not Working

1. **Check Lavalink**: Ensure Lavalink server is running

   ```bash
   java -jar Lavalink.jar
   ```

2. **Check environment variables**:

   ```bash
   echo $LAVALINK_URL
   echo $LAVALINK_AUTH
   ```

3. **Check logs**: Look for music initialization messages in Jarvis logs

### Voice TTS Issues

1. **Check permissions**: Bot needs "Connect" and "Speak" permissions
2. **Check voice channel**: User must be in a voice channel
3. **ffmpeg required**: Ensure ffmpeg is installed for audio processing

### Bot Not Responding

1. **Check permissions**: Bot needs "Read Messages", "Send Messages", "Embed Links"
2. **Check mentions**: Bot requires mention if `requireMention: true` in config
3. **Check intents**: Message Content Intent must be enabled in Discord Developer Portal

## 🧪 Development

### Testing

```bash
# Run tests
pnpm test

# Type check
pnpm tsgo

# Lint
pnpm check
```

### Adding New Features

1. **Add intent pattern** in `src/nlp/intents.ts`
2. **Create tool** in `src/tools/` or extend existing tool file
3. **Register tool** in `src/tools/index.ts`
4. **Add personality responses** in `src/personality/responses.ts`
5. **Update README** with examples

## 📜 License

Part of the Jarvis project. See main repository for license details.

## 🤝 Contributing

Contributions welcome! Please:

1. Follow TypeScript best practices
2. Add tests for new features
3. Update this README
4. Keep the chaos gremlin energy! ⚡✨💅

---

**Built with chaos, powered by vibes!** ✨⚡💅
