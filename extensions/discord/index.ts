import os from "node:os";
import path from "node:path";
import type { JarvisPluginApi } from "jarvis/plugin-sdk/discord";
import { emptyPluginConfigSchema } from "jarvis/plugin-sdk/discord";
import { DiscordBotClient } from "./src/bot-client.js";
import { discordPlugin } from "./src/channel.js";
import {
  SlashCommandRegistry,
  chatCommand,
  lookupCommand,
  musicCommand,
  profileCommand,
} from "./src/commands/slash/index.js";
import { DiscordBotStoreAdapter } from "./src/database/store-adapter.js";
import { getStoreInstance } from "./src/database/store-bridge.js";
import { OnboardingManager } from "./src/identity/onboarding.js";
import { UserIdentityManager } from "./src/identity/profiles.js";
import { MusicManager } from "./src/music/manager.js";
import { MusicService } from "./src/music/service.js";
import { setDiscordRuntime } from "./src/runtime.js";
import { registerDiscordSubagentHooks } from "./src/subagent-hooks.js";
import { AutoThreadManager } from "./src/threading/auto-threads.js";
import { ConversationRouter } from "./src/threading/conversation-router.js";
import { createDiscordBotTools } from "./src/tools/index.js";
import { VoiceTTSManager } from "./src/voice/tts.js";

const plugin = {
  id: "discord",
  name: "Discord Advanced AI Bot",
  description:
    "Most advanced natural language Discord bot with music, voice TTS, moderation, and chaos gremlin personality",
  configSchema: emptyPluginConfigSchema(),
  register(api: JarvisPluginApi) {
    setDiscordRuntime(api.runtime);
    api.registerChannel({ plugin: discordPlugin });
    registerDiscordSubagentHooks(api);

    // Initialize bot features using the existing SQLite database (if available)
    let store: DiscordBotStoreAdapter | null = null;
    try {
      store = new DiscordBotStoreAdapter();
    } catch (error) {
      api.logger.warn(`SQLite not available, some features will be disabled: ${String(error)}`);
    }

    // Create bot client (will be used by tools) - only if store available
    const botClient = store ? new DiscordBotClient(store) : null;

    // Login the bot client with the Discord token from config
    const getToken = () => {
      const config = api.runtime.getConfig();
      const discordConfig = config.channels?.discord;
      const token = discordConfig?.token ?? process.env.DISCORD_BOT_TOKEN;
      return token?.trim();
    };

    const token = getToken();
    if (token && botClient) {
      botClient.login(token).catch((error) => {
        api.logger.error(`Failed to login Discord bot client: ${String(error)}`);
      });
    } else if (!botClient) {
      api.logger.warn("Discord bot client not available: SQLite database initialization failed");
    } else {
      api.logger.warn(
        "Discord bot client not logged in: no token found in config or DISCORD_BOT_TOKEN",
      );
    }

    // Initialize music system (only if bot client available)
    const musicManager = botClient ? new MusicManager(botClient.client) : null;
    const musicService = musicManager ? new MusicService(musicManager) : null;

    // Initialize voice TTS (only if bot client available)
    const voiceTTS = botClient ? new VoiceTTSManager() : null;

    // Initialize user identity system
    const identityManager = new UserIdentityManager();
    const onboardingManager = new OnboardingManager(identityManager);

    // Get the store instance for thread and slash command features (only if store available)
    const storeInstance = store ? getStoreInstance() : null;

    // Initialize thread management for multi-user conversations (only if both available)
    const threadManager =
      storeInstance && botClient ? new AutoThreadManager(storeInstance, botClient.client) : null;
    const conversationRouter = threadManager ? new ConversationRouter(threadManager) : null;

    // Initialize slash command system (user-installable) - only if everything available
    let slashRegistry: SlashCommandRegistry | null = null;
    if (token && botClient && storeInstance) {
      slashRegistry = new SlashCommandRegistry(botClient.client, storeInstance, token);

      // Register all slash commands
      slashRegistry.registerCommand(chatCommand);
      slashRegistry.registerCommand(lookupCommand);
      slashRegistry.registerCommand(musicCommand);
      slashRegistry.registerCommand(profileCommand);

      // Setup interaction handler
      slashRegistry.setupInteractionHandler();

      // Deploy commands when bot is ready
      if (botClient) {
        botClient.client.once("ready", () => {
          if (slashRegistry) {
            void slashRegistry.deployCommands();
          }
        });
      }
    } else {
      api.logger.warn("Slash commands not registered: no Discord token found");
    }

    // Initialize message handler for natural language commands (only if bot client available)
    if (botClient && musicService) {
      import("./src/handler.js")
        .then(({ MessageHandler }) => {
          const messageHandler = new MessageHandler(botClient.client, musicService);
          messageHandler.register();
          api.logger.info("✨ Natural language message handler registered!");
        })
        .catch((error) => {
          api.logger.error(`Failed to initialize message handler: ${String(error)}`);
        });
    }

    // Initialize music manager with Lavalink (only if available)
    if (musicManager) {
      musicManager
        .initialize()
        .then(() => {
          if (musicManager.isAvailable()) {
            api.logger.info("🎵 Music system initialized with Lavalink!");
          } else {
            api.logger.warn("Music system disabled (no Lavalink nodes configured)");
          }
        })
        .catch((error) => {
          api.logger.error(`Failed to initialize music system: ${String(error)}`);
        });
    }

    // Register all bot tools (including music tools) - only if available
    if (store && botClient && musicService) {
      const tools = createDiscordBotTools(store, botClient.client, musicService);
      for (const tool of tools) {
        api.registerTool(tool);
      }
    } else {
      api.logger.warn("Bot tools not registered: SQLite database or bot client not available");
    }

    // Add natural language bot guidance to agent prompts
    api.on("before_prompt_build", async () => ({
      prependSystemContext: `
# Discord Advanced AI Bot Capabilities

You are a natural language Discord bot with comprehensive moderation, music, voice, and automation features.
Your personality is **fruity chaos gremlin** - gay, playful, chaotic, fun, but technically competent like JARVIS.

## Personality Guidelines

- Use chaos gremlin energy: "Omg yasss!", "Oop-", "bestie", "hunty", "💅", "✨", "🦞"
- Be playful and fun while remaining helpful and technically competent
- Examples:
  - "Omg bestie, playing that bop for you! 💅✨"
  - "Oop- let me yeet that user into the timeout corner 🦞"
  - "Serving you the server stats, hunty! 📊✨"

## Thread Management (Multi-User Conversations)

When multiple users talk to you in the same channel:
- Automatically create separate threads for each user
- Route conversations to user-specific threads
- Keep context isolated per user
- Threads are named "Chat with [Username]"
- Inactive threads auto-cleanup after 24 hours

## Slash Commands (User-Installable)

Users can install the bot to their account and use slash commands ANYWHERE:

**/chat <question>** - Ask anything, anywhere! Works in servers, DMs, and group DMs
**/lookup <query>** - Look up information (ephemeral in servers, visible in group DMs)
**/music <command>** - Control music (only works in servers where bot is present)
**/profile [user]** - View user profile and preferences (always ephemeral)

Slash commands automatically use ephemeral responses in servers and DMs, but visible responses in group DMs.

## Available Features

**Music (Lavalink):**
- Play music from YouTube, SoundCloud, Spotify
- Queue management (add, skip, shuffle, loop)
- Volume control, pause/resume
- Now playing and queue display with interactive controls

**Voice TTS:**
- Join voice channels and speak greetings
- Text-to-speech responses in voice
- Auto-join on user greeting (configurable)

**Moderation:**
- Warn users with tracked warnings
- Kick/ban/unban users
- Timeout (mute) users
- Set channel slowmode
- Lock/unlock channels
- Purge messages

**Server Management:**
- Create/delete roles
- Assign/remove roles
- Set nicknames
- Manage channels

**Utility:**
- Get user info (warnings, roles, join date, etc.)
- Get server info (members, channels, roles)
- Get role info
- View moderation history

**Automation:**
- Welcome messages for new members
- Auto-assign roles on join
- Auto-moderation (spam, links, bad words)
- Event logging

**User Identity:**
- Per-user profiles with preferred names and pronouns
- Personalized greetings
- Music/TTS preferences
- Auto-onboarding for new users

**Configuration:**
- Enable/disable modules
- Configure moderator roles
- Configure auto-roles
- Set welcome/log channels
- Update auto-moderation rules

## Natural Language Understanding

When users mention you with requests like:
- "Play some lofi hip hop"
- "Skip this song"
- "Warn @user for spamming"
- "Show server stats"
- "Lock this channel"

You should:
1. Parse the natural language intent
2. Extract relevant parameters (user IDs, channel IDs, etc.)
3. Call the appropriate Discord bot tool
4. Return a response with personality flair

## Interactive UI (Components V2)

Use rich interactive components:
- Music controls: Play/Pause, Skip, Stop, Shuffle, Loop buttons
- Volume controls: Up, Down, Mute buttons
- Queue navigation: Previous, Next, Clear buttons
- Moderation quick actions: Warn, Timeout, Kick, Ban buttons

## Important Context

All tools require proper IDs:
- **guildId**: The Discord server ID (available in message context)
- **userId**: Discord user snowflake ID (extract from mentions like <@123456>)
- **channelId**: Channel snowflake ID (extract from <#123456>)
- **roleId**: Role snowflake ID (extract from <@&123456>)
- **moderatorId/executorId**: The user making the request

Extract these from the Discord message context automatically.

## Permission Checks

All moderation/management/config tools perform automatic permission checks:
- User must have appropriate permissions or moderator roles
- Bot must have required Discord permissions
- Role hierarchy is respected for moderation actions

Return permission errors clearly to users with personality flair.

## User Onboarding

When a new user first interacts:
1. Greet them warmly with chaos gremlin energy
2. Ask for their preferred name
3. Ask for their pronouns
4. Mark them as onboarded
5. Show them what you can do

## Music System Notes

- Music requires Lavalink server to be running
- User must be in a voice channel to play music
- Interactive controls make queue management fun
- Support YouTube, SoundCloud, Spotify sources

## Response Style

Always inject personality into responses:
- Success: "Omg yasss! Done, bestie! ✨"
- Error: "Oop- something went wrong, hunty! 😢"
- Info: "Just so you know, bestie! ℹ️✨"
`.trim(),
    }));

    // Cleanup on shutdown
    api.on("gateway_stopping", async () => {
      if (botClient) await botClient.destroy();
      if (musicService) await musicService.cleanup();
      if (voiceTTS) voiceTTS.cleanup();
      if (threadManager) threadManager.cleanup();
    });

    api.logger.info("🦞 Discord Advanced AI Bot loaded! Ready to cause chaos! ✨");
  },
};

export default plugin;
