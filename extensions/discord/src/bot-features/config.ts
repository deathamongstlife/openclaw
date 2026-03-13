import type { GuildMember } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";
import type { ServerConfigView, ServerConfigUpdate } from "../database/store-adapter.js";
import { PermissionManager } from "./permissions.js";

export interface ConfigResult {
  success: boolean;
  message: string;
  error?: string;
  data?: unknown;
}

// Configuration management for server settings
export class ConfigManager {
  private permissions: PermissionManager;

  constructor(private store: DiscordBotStoreAdapter) {
    this.permissions = new PermissionManager(store);
  }

  async getConfig(guildId: string): Promise<ServerConfigView> {
    return this.store.getServerConfig(guildId);
  }

  async setWelcomeMessage(
    guildId: string,
    executor: GuildMember,
    message: string | null,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      await this.store.updateServerConfig(guildId, {
        welcomeMessage: message,
      });

      return {
        success: true,
        message: message ? "Welcome message updated successfully." : "Welcome message cleared.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update welcome message.",
        error: String(error),
      };
    }
  }

  async setWelcomeChannel(
    guildId: string,
    executor: GuildMember,
    channelId: string | null,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      await this.store.updateServerConfig(guildId, {
        welcomeChannel: channelId,
      });

      return {
        success: true,
        message: channelId ? `Welcome channel set to <#${channelId}>.` : "Welcome channel cleared.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update welcome channel.",
        error: String(error),
      };
    }
  }

  async setLogChannel(
    guildId: string,
    executor: GuildMember,
    channelId: string | null,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      await this.store.updateServerConfig(guildId, {
        logChannel: channelId,
      });

      return {
        success: true,
        message: channelId ? `Log channel set to <#${channelId}>.` : "Log channel cleared.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update log channel.",
        error: String(error),
      };
    }
  }

  async toggleModule(
    guildId: string,
    executor: GuildMember,
    module: keyof ServerConfigView["modules"],
    enabled: boolean,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      const updated = await this.store.updateServerConfig(guildId, {
        modules: {
          ...config.modules,
          [module]: enabled,
        },
      });

      return {
        success: true,
        message: `Module **${module}** ${enabled ? "enabled" : "disabled"}.`,
        data: { modules: updated.modules },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to toggle module.",
        error: String(error),
      };
    }
  }

  async addModRole(guildId: string, executor: GuildMember, roleId: string): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      if (config.modRoles.includes(roleId)) {
        return {
          success: false,
          message: "This role is already a moderator role.",
        };
      }

      await this.store.updateServerConfig(guildId, {
        modRoles: [...config.modRoles, roleId],
      });

      return {
        success: true,
        message: `Added <@&${roleId}> to moderator roles.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to add moderator role.",
        error: String(error),
      };
    }
  }

  async removeModRole(
    guildId: string,
    executor: GuildMember,
    roleId: string,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      await this.store.updateServerConfig(guildId, {
        modRoles: config.modRoles.filter((id) => id !== roleId),
      });

      return {
        success: true,
        message: `Removed <@&${roleId}> from moderator roles.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to remove moderator role.",
        error: String(error),
      };
    }
  }

  async addAutoRole(guildId: string, executor: GuildMember, roleId: string): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      if (config.autoRoles.includes(roleId)) {
        return {
          success: false,
          message: "This role is already an auto-role.",
        };
      }

      await this.store.updateServerConfig(guildId, {
        autoRoles: [...config.autoRoles, roleId],
      });

      return {
        success: true,
        message: `Added <@&${roleId}> to auto-roles.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to add auto-role.",
        error: String(error),
      };
    }
  }

  async removeAutoRole(
    guildId: string,
    executor: GuildMember,
    roleId: string,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      await this.store.updateServerConfig(guildId, {
        autoRoles: config.autoRoles.filter((id) => id !== roleId),
      });

      return {
        success: true,
        message: `Removed <@&${roleId}> from auto-roles.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to remove auto-role.",
        error: String(error),
      };
    }
  }

  async updateAutomodRules(
    guildId: string,
    executor: GuildMember,
    rules: Partial<AutomodRules>,
  ): Promise<ConfigResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "config"))) {
        return {
          success: false,
          message: "You do not have permission to configure the bot.",
        };
      }

      const config = await this.store.getServerConfig(guildId);
      const updated = await this.store.updateServerConfig(guildId, {
        automodRules: {
          ...config.automodRules,
          ...rules,
        },
      });

      return {
        success: true,
        message: "Auto-moderation rules updated successfully.",
        data: { automodRules: updated.automodRules },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update auto-moderation rules.",
        error: String(error),
      };
    }
  }

  formatConfig(config: ServerConfigView): string {
    const parts = [
      `**Server Configuration**`,
      ``,
      `**Modules:**`,
      `• Moderation: ${config.modules.moderation ? "✅" : "❌"}`,
      `• Auto-moderation: ${config.modules.automod ? "✅" : "❌"}`,
      `• Logging: ${config.modules.logging ? "✅" : "❌"}`,
      `• Welcome: ${config.modules.welcome ? "✅" : "❌"}`,
      `• Auto-role: ${config.modules.autorole ? "✅" : "❌"}`,
      ``,
    ];

    if (config.welcomeChannel) {
      parts.push(`**Welcome Channel:** <#${config.welcomeChannel}>`);
    }

    if (config.welcomeMessage) {
      parts.push(
        `**Welcome Message:** ${config.welcomeMessage.substring(0, 100)}${config.welcomeMessage.length > 100 ? "..." : ""}`,
      );
    }

    if (config.logChannel) {
      parts.push(`**Log Channel:** <#${config.logChannel}>`);
    }

    if (config.modRoles.length > 0) {
      parts.push(`**Moderator Roles:** ${config.modRoles.map((id) => `<@&${id}>`).join(", ")}`);
    }

    if (config.autoRoles.length > 0) {
      parts.push(`**Auto-roles:** ${config.autoRoles.map((id) => `<@&${id}>`).join(", ")}`);
    }

    parts.push(``);
    parts.push(`**Auto-moderation Rules:**`);
    parts.push(`• Anti-spam: ${config.automodRules.antiSpam ? "✅" : "❌"}`);
    parts.push(`• Link filter: ${config.automodRules.linkFilter ? "✅" : "❌"}`);
    parts.push(`• Invite filter: ${config.automodRules.inviteFilter ? "✅" : "❌"}`);
    parts.push(`• Mention limit: ${config.automodRules.mentionLimit}`);

    if (config.automodRules.badWords.length > 0) {
      parts.push(`• Bad words: ${config.automodRules.badWords.length} configured`);
    }

    if (config.automodRules.allowedDomains.length > 0) {
      parts.push(`• Allowed domains: ${config.automodRules.allowedDomains.join(", ")}`);
    }

    return parts.join("\n");
  }
}
