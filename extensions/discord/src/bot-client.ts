import { Client, GatewayIntentBits, Partials } from "discord.js";
import { AutomationManager } from "./bot-features/automation.js";
import type { DiscordBotStoreAdapter } from "./database/store-adapter.js";

// Discord client wrapper with event handlers
export class DiscordBotClient {
  public client: Client;
  private automation: AutomationManager;

  constructor(private store: DiscordBotStoreAdapter) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    this.automation = new AutomationManager(store, this.client);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Member join
    this.client.on("guildMemberAdd", async (member) => {
      await this.automation.handleMemberJoin(member);
    });

    // Member leave
    this.client.on("guildMemberRemove", async (member) => {
      await this.automation.handleMemberLeave(member);
    });

    // Message create (auto-mod)
    this.client.on("messageCreate", async (message) => {
      await this.automation.handleMessage(message);
    });

    // Message delete (logging)
    this.client.on("messageDelete", async (message) => {
      await this.automation.handleMessageDelete(message);
    });

    // Message edit (logging)
    this.client.on("messageUpdate", async (oldMessage, newMessage) => {
      if (newMessage.partial) {
        try {
          await newMessage.fetch();
        } catch {
          return;
        }
      }
      if (oldMessage.partial) {
        try {
          await oldMessage.fetch();
        } catch {
          return;
        }
      }
      await this.automation.handleMessageUpdate(oldMessage, newMessage);
    });

    // Member ban (logging)
    this.client.on("guildBanAdd", async (ban) => {
      const config = await this.store.getServerConfig(ban.guild.id);
      if (config.modules.logging) {
        await this.store.logEvent({
          guildId: ban.guild.id,
          type: "member_ban",
          userId: ban.user.id,
          data: {
            tag: ban.user.tag,
            reason: ban.reason ?? "No reason provided",
          },
        });
      }
    });

    // Member unban (logging)
    this.client.on("guildBanRemove", async (ban) => {
      const config = await this.store.getServerConfig(ban.guild.id);
      if (config.modules.logging) {
        await this.store.logEvent({
          guildId: ban.guild.id,
          type: "member_unban",
          userId: ban.user.id,
          data: {
            tag: ban.user.tag,
          },
        });
      }
    });

    // Ready event
    this.client.on("ready", () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    // Error handling
    this.client.on("error", (error) => {
      console.error("Discord client error:", error);
    });
  }

  async login(token: string): Promise<void> {
    await this.client.login(token);
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
