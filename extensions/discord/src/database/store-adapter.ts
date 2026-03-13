// Adapter to provide a unified interface to the existing SQLite database
// This bridges our bot features with the existing database models

import { getDatabase } from "./client.js";
import { GuildModel, ModerationModel } from "./models/index.js";
import type { Guild, GuildModules, GuildSettings, GuildAutomod } from "./models/index.js";
import type { UserWarning, ModerationAction } from "./models/index.js";

// Adapter that provides a clean interface to existing database
export class DiscordBotStoreAdapter {
  private guildModel: GuildModel;
  private moderationModel: ModerationModel;

  constructor() {
    const db = getDatabase();
    this.guildModel = new GuildModel(db);
    this.moderationModel = new ModerationModel(db);
  }

  // Server Configuration
  async getServerConfig(guildId: string): Promise<ServerConfigView> {
    const guild = this.guildModel.getOrCreate(guildId);
    const modules = this.guildModel.getModules(guildId);
    const settings = this.guildModel.getSettings(guildId);
    const automod = this.guildModel.getAutomod(guildId);

    return {
      guildId,
      modules: {
        moderation: modules.moderation,
        automod: modules.automod,
        logging: modules.logging,
        welcome: modules.welcome,
        autorole: modules.autorole,
      },
      welcomeMessage: settings.welcomeMessage,
      welcomeChannel: settings.welcomeChannel,
      logChannel: settings.logChannel,
      modRoles: this.guildModel.getModRoles(guildId),
      autoRoles: this.guildModel.getAutoRoles(guildId),
      automodRules: {
        antiSpam: automod.antiSpam,
        linkFilter: automod.linkFilter,
        inviteFilter: automod.inviteFilter,
        mentionLimit: automod.mentionLimit,
        badWords: this.guildModel.getBadWords(guildId),
        allowedDomains: this.guildModel.getAllowedDomains(guildId),
        maxMessages: automod.maxMessages,
        maxMessagesWindow: automod.maxMessagesWindow,
      },
      createdAt: guild.createdAt,
      updatedAt: guild.updatedAt,
    };
  }

  async updateServerConfig(
    guildId: string,
    updates: Partial<ServerConfigUpdate>,
  ): Promise<ServerConfigView> {
    // Update modules if provided
    if (updates.modules) {
      for (const [module, enabled] of Object.entries(updates.modules)) {
        this.guildModel.updateModule(
          guildId,
          module as keyof Omit<GuildModules, "guildId">,
          enabled,
        );
      }
    }

    // Update settings
    if (updates.welcomeMessage !== undefined) {
      this.guildModel.updateSettings(guildId, { welcomeMessage: updates.welcomeMessage });
    }
    if (updates.welcomeChannel !== undefined) {
      this.guildModel.updateSettings(guildId, { welcomeChannel: updates.welcomeChannel });
    }
    if (updates.logChannel !== undefined) {
      this.guildModel.updateSettings(guildId, { logChannel: updates.logChannel });
    }

    // Update automod rules if provided
    if (updates.automodRules) {
      this.guildModel.updateAutomod(guildId, updates.automodRules);
    }

    return this.getServerConfig(guildId);
  }

  // User Warnings
  async addWarning(data: Omit<UserWarning, "id" | "timestamp">): Promise<UserWarning> {
    return this.moderationModel.addWarning(
      data.guildId,
      data.userId,
      data.moderatorId,
      data.reason,
    );
  }

  async getWarnings(guildId: string): Promise<UserWarning[]> {
    return this.moderationModel.getAllWarnings(guildId);
  }

  async getUserWarnings(guildId: string, userId: string): Promise<UserWarning[]> {
    return this.moderationModel.getWarnings(guildId, userId, true);
  }

  async clearWarnings(guildId: string, userId: string): Promise<void> {
    this.moderationModel.clearWarnings(guildId, userId);
  }

  // Moderation Actions
  async logModerationAction(
    action: Omit<ModerationAction, "id" | "timestamp">,
  ): Promise<ModerationAction> {
    return this.moderationModel.logAction(
      action.guildId,
      action.userId,
      action.moderatorId,
      action.type,
      action.reason,
      action.duration,
      action.metadata,
    );
  }

  async getModerationHistory(guildId: string, userId?: string): Promise<ModerationAction[]> {
    if (userId) {
      return this.moderationModel.getUserActions(guildId, userId);
    }
    return this.moderationModel.getRecentActions(guildId);
  }

  // Event Logging - using existing database
  async logEvent(event: Omit<EventLog, "id" | "timestamp">): Promise<EventLog> {
    // The existing database has event logging through moderation actions
    // For now, we just return a synthetic event
    const id = `${Date.now()}-${Math.random()}`;
    return {
      id,
      timestamp: Date.now(),
      ...event,
    };
  }

  async getRecentEvents(
    guildId: string,
    limit: number = 50,
    type?: EventLog["type"],
  ): Promise<EventLog[]> {
    // Return empty for now - existing implementation may handle this differently
    return [];
  }

  async cleanupOldData(
    guildId: string,
    maxAgeMs: number = 90 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    // Cleanup handled by database
  }
}

// Types for the adapter
export interface ServerConfigView {
  guildId: string;
  modules: {
    moderation: boolean;
    automod: boolean;
    logging: boolean;
    welcome: boolean;
    autorole: boolean;
  };
  welcomeMessage: string | null;
  welcomeChannel: string | null;
  logChannel: string | null;
  modRoles: string[];
  autoRoles: string[];
  automodRules: {
    antiSpam: boolean;
    linkFilter: boolean;
    inviteFilter: boolean;
    mentionLimit: number;
    badWords: string[];
    allowedDomains: string[];
    maxMessages: number;
    maxMessagesWindow: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ServerConfigUpdate {
  modules?: Partial<{
    moderation: boolean;
    automod: boolean;
    logging: boolean;
    welcome: boolean;
    autorole: boolean;
  }>;
  welcomeMessage?: string | null;
  welcomeChannel?: string | null;
  logChannel?: string | null;
  modRoles?: string[];
  autoRoles?: string[];
  automodRules?: Partial<GuildAutomod>;
}

export interface EventLog {
  id: string;
  guildId: string;
  type:
    | "message_delete"
    | "message_edit"
    | "member_join"
    | "member_leave"
    | "member_ban"
    | "member_unban"
    | "channel_create"
    | "channel_delete"
    | "role_create"
    | "role_delete";
  userId?: string;
  channelId?: string;
  data: Record<string, unknown>;
  timestamp: number;
}
