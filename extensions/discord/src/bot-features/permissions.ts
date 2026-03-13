import type { Guild, GuildMember, PermissionResolvable } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";

// Permission utilities for bot features
export class PermissionManager {
  constructor(private store: DiscordBotStoreAdapter) {}

  async hasModPermission(member: GuildMember): Promise<boolean> {
    // Check if user has administrator permission
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return true;
    }

    // Check if user has any configured mod roles
    const config = await this.store.getServerConfig(member.guild.id);
    const memberRoleIds = member.roles.cache.map((r) => r.id);
    return config.modRoles.some((roleId) => memberRoleIds.includes(roleId));
  }

  async canModerateUser(moderator: GuildMember, target: GuildMember): Promise<boolean> {
    // Cannot moderate self
    if (moderator.id === target.id) {
      return false;
    }

    // Check role hierarchy
    if (moderator.roles.highest.position <= target.roles.highest.position) {
      return false;
    }

    // Check if moderator has mod permissions
    return this.hasModPermission(moderator);
  }

  hasPermission(member: GuildMember, permission: PermissionResolvable): boolean {
    return member.permissions.has(permission);
  }

  async canUseFeature(
    member: GuildMember,
    feature: "moderation" | "management" | "config",
  ): Promise<boolean> {
    switch (feature) {
      case "moderation":
        return this.hasModPermission(member);
      case "management":
        return (
          member.permissions.has(PermissionFlagsBits.ManageGuild) ||
          member.permissions.has(PermissionFlagsBits.Administrator)
        );
      case "config":
        return (
          member.permissions.has(PermissionFlagsBits.ManageGuild) ||
          member.permissions.has(PermissionFlagsBits.Administrator)
        );
      default:
        return false;
    }
  }

  async getBotMember(guild: Guild): Promise<GuildMember | null> {
    try {
      const botMember = await guild.members.fetchMe();
      return botMember;
    } catch {
      return null;
    }
  }

  async botHasPermission(guild: Guild, permission: PermissionResolvable): Promise<boolean> {
    const botMember = await this.getBotMember(guild);
    if (!botMember) {
      return false;
    }
    return botMember.permissions.has(permission);
  }

  async botCanModerate(guild: Guild, target: GuildMember): Promise<boolean> {
    const botMember = await this.getBotMember(guild);
    if (!botMember) {
      return false;
    }

    // Check role hierarchy
    if (botMember.roles.highest.position <= target.roles.highest.position) {
      return false;
    }

    return true;
  }
}
