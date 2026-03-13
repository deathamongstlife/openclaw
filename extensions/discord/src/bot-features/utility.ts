import type { Guild, GuildMember, User, Role, TextChannel } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";

export interface UserInfo {
  id: string;
  tag: string;
  username: string;
  discriminator: string;
  bot: boolean;
  createdAt: string;
  joinedAt: string | null;
  roles: string[];
  topRole: string | null;
  permissions: string[];
  warnings: number;
}

export interface ServerInfo {
  id: string;
  name: string;
  memberCount: number;
  roleCount: number;
  channelCount: number;
  createdAt: string;
  ownerId: string;
  description: string | null;
  features: string[];
}

export interface RoleInfo {
  id: string;
  name: string;
  color: string;
  position: number;
  memberCount: number;
  permissions: string[];
  mentionable: boolean;
  hoisted: boolean;
}

// Utility feature implementations
export class UtilityManager {
  constructor(private store: DiscordBotStoreAdapter) {}

  async getUserInfo(guild: Guild, user: User): Promise<UserInfo> {
    let member: GuildMember | null = null;
    try {
      member = await guild.members.fetch(user.id);
    } catch {
      // User not in guild
    }

    const warnings = await this.store.getUserWarnings(guild.id, user.id);

    return {
      id: user.id,
      tag: user.tag,
      username: user.username,
      discriminator: user.discriminator,
      bot: user.bot,
      createdAt: user.createdAt.toISOString(),
      joinedAt: member?.joinedAt?.toISOString() ?? null,
      roles: member ? Array.from(member.roles.cache.values()).map((r) => r.name) : [],
      topRole: member?.roles.highest.name ?? null,
      permissions: member ? member.permissions.toArray().map((p) => p.toString()) : [],
      warnings: warnings.length,
    };
  }

  async getServerInfo(guild: Guild): Promise<ServerInfo> {
    await guild.channels.fetch();
    await guild.roles.fetch();

    return {
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      roleCount: guild.roles.cache.size,
      channelCount: guild.channels.cache.size,
      createdAt: guild.createdAt.toISOString(),
      ownerId: guild.ownerId,
      description: guild.description,
      features: guild.features,
    };
  }

  async getRoleInfo(role: Role): Promise<RoleInfo> {
    return {
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
      memberCount: role.members.size,
      permissions: role.permissions.toArray().map((p) => p.toString()),
      mentionable: role.mentionable,
      hoisted: role.hoist,
    };
  }

  async getModerationHistory(
    guildId: string,
    userId?: string,
    limit: number = 10,
  ): Promise<string> {
    const actions = await this.store.getModerationHistory(guildId, userId);
    const recent = actions.slice(-limit).reverse();

    if (recent.length === 0) {
      return userId ? "No moderation history found for this user." : "No moderation history found.";
    }

    const lines = recent.map((action) => {
      const date = new Date(action.timestamp).toISOString();
      return `[${date}] ${action.type.toUpperCase()} - User: <@${action.userId}> - Moderator: <@${action.moderatorId}> - Reason: ${action.reason}`;
    });

    return lines.join("\n");
  }

  async getUserWarningsList(guildId: string, userId: string): Promise<string> {
    const warnings = await this.store.getUserWarnings(guildId, userId);

    if (warnings.length === 0) {
      return "No active warnings found for this user.";
    }

    const lines = warnings.map((warning, index) => {
      const date = new Date(warning.timestamp).toISOString();
      return `${index + 1}. [${date}] Warned by <@${warning.moderatorId}> - Reason: ${warning.reason}`;
    });

    return `User has ${warnings.length} active warning(s):\n${lines.join("\n")}`;
  }

  formatUserInfo(info: UserInfo): string {
    const parts = [
      `**User Information**`,
      `• Tag: ${info.tag}`,
      `• ID: ${info.id}`,
      `• Bot: ${info.bot ? "Yes" : "No"}`,
      `• Account Created: ${new Date(info.createdAt).toLocaleString()}`,
    ];

    if (info.joinedAt) {
      parts.push(`• Joined Server: ${new Date(info.joinedAt).toLocaleString()}`);
    }

    if (info.topRole) {
      parts.push(`• Top Role: ${info.topRole}`);
    }

    if (info.roles.length > 0) {
      parts.push(
        `• Roles (${info.roles.length}): ${info.roles.slice(0, 10).join(", ")}${info.roles.length > 10 ? "..." : ""}`,
      );
    }

    if (info.warnings > 0) {
      parts.push(`• Active Warnings: ${info.warnings}`);
    }

    return parts.join("\n");
  }

  formatServerInfo(info: ServerInfo): string {
    const parts = [
      `**Server Information**`,
      `• Name: ${info.name}`,
      `• ID: ${info.id}`,
      `• Members: ${info.memberCount}`,
      `• Roles: ${info.roleCount}`,
      `• Channels: ${info.channelCount}`,
      `• Created: ${new Date(info.createdAt).toLocaleString()}`,
      `• Owner: <@${info.ownerId}>`,
    ];

    if (info.description) {
      parts.push(`• Description: ${info.description}`);
    }

    if (info.features.length > 0) {
      parts.push(`• Features: ${info.features.join(", ")}`);
    }

    return parts.join("\n");
  }

  formatRoleInfo(info: RoleInfo): string {
    return [
      `**Role Information**`,
      `• Name: ${info.name}`,
      `• ID: ${info.id}`,
      `• Color: ${info.color}`,
      `• Position: ${info.position}`,
      `• Members: ${info.memberCount}`,
      `• Mentionable: ${info.mentionable ? "Yes" : "No"}`,
      `• Hoisted: ${info.hoisted ? "Yes" : "No"}`,
      `• Permissions: ${info.permissions.slice(0, 10).join(", ")}${info.permissions.length > 10 ? "..." : ""}`,
    ].join("\n");
  }
}
