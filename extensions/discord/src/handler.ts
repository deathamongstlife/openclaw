import type { Message, Client } from "discord.js";
import { GuildModel } from "./database/models/index.js";
import { ManagementModule } from "./modules/management/index.js";
import { ModerationModule } from "./modules/moderation/index.js";
import { MusicModule } from "./modules/music/index.js";
import { PluralKitModule } from "./modules/pluralkit/index.js";
import { UtilityModule } from "./modules/utility/index.js";
import type { MusicService } from "./music/service.js";
import type { Intent } from "./nlp/intents.js";
import { parseCommand, looksLikeCommand, removeBotMention } from "./nlp/parser.js";
import type { PresenceManager } from "./presence/manager.js";

export class MessageHandler {
  private moderation: ModerationModule;
  private utility: UtilityModule;
  private management: ManagementModule;
  private music: MusicModule;
  private pluralkit: PluralKitModule;
  private guildModel: GuildModel;

  constructor(
    private client: Client,
    private musicService: MusicService,
    private presenceManager?: PresenceManager,
  ) {
    this.moderation = new ModerationModule();
    this.utility = new UtilityModule();
    this.management = new ManagementModule();
    this.music = new MusicModule(musicService);
    this.pluralkit = new PluralKitModule();
    this.guildModel = new GuildModel();
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message: Message): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) {
      // Check if this is a PluralKit proxy message
      if (message.author.id === "466378653216014359") {
        await this.handlePluralKitMessage(message);
      }
      return;
    }

    // Check if message is in a guild
    if (!message.guild) {
      return;
    }

    const guildId = message.guild.id;

    // Check if message looks like a command
    if (!looksLikeCommand(message.content, this.client.user?.id ?? "")) {
      return;
    }

    // Remove bot mention from message
    const cleanedMessage = removeBotMention(message.content, this.client.user?.id ?? "");

    // Parse the command
    const parsed = parseCommand(cleanedMessage);

    // Update presence to show processing
    if (this.presenceManager) {
      this.presenceManager.setProcessingCommand(parsed.intent.split(".")[0] || "command");
    }

    // Route to appropriate module
    try {
      const response = await this.routeCommand(parsed.intent, parsed, message);

      if (response) {
        await message.reply(response);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      await message.reply(
        `Oop- something went wrong, bestie! 😢\n\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
      );
    }
  }

  /**
   * Handle PluralKit proxy messages
   */
  private async handlePluralKitMessage(message: Message): Promise<void> {
    if (!message.guild) return;

    try {
      await this.pluralkit.detectAndCache(message);
    } catch (error) {
      console.error("Error handling PluralKit message:", error);
    }
  }

  /**
   * Route command to appropriate module
   */
  private async routeCommand(
    intent: Intent,
    parsed: ReturnType<typeof parseCommand>,
    message: Message,
  ): Promise<string | null> {
    if (!message.guild || !message.member) {
      return "This command can only be used in servers!";
    }

    const guildId = message.guild.id;
    const guild = this.guildModel.getGuild(guildId);

    if (!guild) {
      // Initialize guild if not exists
      this.guildModel.createGuild(guildId);
      return "Server initialized! Please try your command again.";
    }

    // Check if module is enabled
    const category = intent.split(".")[0] as keyof typeof guild.modules;
    if (category in guild.modules && !guild.modules[category]) {
      return `The ${category} module is currently disabled. Ask an admin to enable it!`;
    }

    // Route to appropriate module
    if (intent.startsWith("moderation.")) {
      return await this.moderation.handleIntent(parsed, message, guild);
    }

    if (intent.startsWith("server.") || intent.startsWith("user.")) {
      return await this.utility.handleIntent(parsed, message, guild);
    }

    if (intent.startsWith("utility.")) {
      return await this.utility.handleIntent(parsed, message, guild);
    }

    if (
      intent === "server.roles." ||
      intent.startsWith("server.channels.") ||
      intent.startsWith("server.roles.")
    ) {
      return await this.management.handleIntent(parsed, message, guild);
    }

    if (intent.startsWith("music.")) {
      return await this.music.handleIntent(parsed, message, guild);
    }

    if (intent.startsWith("pluralkit.")) {
      return await this.pluralkit.handleIntent(parsed, message, guild);
    }

    if (intent === "general.help") {
      return this.getHelpMessage(guild);
    }

    if (intent === "general.ping") {
      const ping = this.client.ws.ping;
      return `Pong! 🏓 Latency: ${ping}ms`;
    }

    // Unknown intent
    return "Sorry bestie, I didn't quite understand that! 😅 Try asking for `help` to see what I can do! ✨";
  }

  /**
   * Get help message based on enabled modules
   */
  private getHelpMessage(guild: ReturnType<typeof this.guildModel.getGuild>): string {
    if (!guild) return "Help is not available right now!";

    const sections: string[] = ["**Available Commands** ✨\n"];

    if (guild.modules.moderation) {
      sections.push(
        "**Moderation** 🛡️",
        "• `warn @user [reason]` - Warn a user",
        "• `kick @user [reason]` - Kick a user",
        "• `ban @user [reason]` - Ban a user",
        "• `timeout @user [duration] [reason]` - Timeout a user",
        "• `purge [count]` - Delete messages",
        "• `lock channel` - Lock the channel",
        "• `unlock channel` - Unlock the channel\n",
      );
    }

    if (guild.modules.music) {
      sections.push(
        "**Music** 🎵",
        "• `play [song/url]` - Play music",
        "• `pause` - Pause playback",
        "• `skip` - Skip current song",
        "• `queue` - Show music queue",
        "• `volume [0-100]` - Change volume\n",
      );
    }

    if (guild.modules.utility) {
      sections.push(
        "**Utility** 🔧",
        "• `server info` - Show server information",
        "• `user info [@user]` - Show user information",
        "• `poll [question]` - Create a poll\n",
      );
    }

    sections.push("Tag me and ask anything in natural language! 💅✨");

    return sections.join("\n");
  }

  /**
   * Register message listener
   */
  register(): void {
    this.client.on("messageCreate", async (message) => {
      await this.handleMessage(message);
    });

    console.log("✨ Message handler registered!");
  }
}
