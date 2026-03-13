import type {
  Guild,
  GuildMember,
  Role,
  GuildChannelCreateOptions,
  ChannelType,
  User,
} from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";
import { PermissionManager } from "./permissions.js";

export interface ManagementResult {
  success: boolean;
  message: string;
  error?: string;
  data?: unknown;
}

// Server management feature implementations
export class ManagementManager {
  private permissions: PermissionManager;

  constructor(private store: DiscordBotStoreAdapter) {
    this.permissions = new PermissionManager(store);
  }

  async createRole(
    guild: Guild,
    executor: GuildMember,
    name: string,
    color?: string,
    hoist?: boolean,
    mentionable?: boolean,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to create roles.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageRoles))) {
        return {
          success: false,
          message: "Bot does not have permission to manage roles.",
        };
      }

      const role = await guild.roles.create({
        name,
        color: color as `#${string}` | undefined,
        hoist: hoist ?? false,
        mentionable: mentionable ?? false,
      });

      return {
        success: true,
        message: `Successfully created role **${name}** (ID: ${role.id}).`,
        data: { roleId: role.id },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create role.",
        error: String(error),
      };
    }
  }

  async deleteRole(guild: Guild, executor: GuildMember, roleId: string): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to delete roles.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageRoles))) {
        return {
          success: false,
          message: "Bot does not have permission to manage roles.",
        };
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        return {
          success: false,
          message: "Role not found.",
        };
      }

      const roleName = role.name;
      await role.delete();

      return {
        success: true,
        message: `Successfully deleted role **${roleName}**.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete role.",
        error: String(error),
      };
    }
  }

  async assignRole(
    guild: Guild,
    executor: GuildMember,
    targetUser: User,
    roleId: string,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to assign roles.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageRoles))) {
        return {
          success: false,
          message: "Bot does not have permission to manage roles.",
        };
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        return {
          success: false,
          message: "Role not found.",
        };
      }

      const target = await guild.members.fetch(targetUser.id);
      await target.roles.add(role);

      return {
        success: true,
        message: `Successfully assigned role **${role.name}** to ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to assign role.",
        error: String(error),
      };
    }
  }

  async removeRole(
    guild: Guild,
    executor: GuildMember,
    targetUser: User,
    roleId: string,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to remove roles.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageRoles))) {
        return {
          success: false,
          message: "Bot does not have permission to manage roles.",
        };
      }

      const role = await guild.roles.fetch(roleId);
      if (!role) {
        return {
          success: false,
          message: "Role not found.",
        };
      }

      const target = await guild.members.fetch(targetUser.id);
      await target.roles.remove(role);

      return {
        success: true,
        message: `Successfully removed role **${role.name}** from ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to remove role.",
        error: String(error),
      };
    }
  }

  async createChannel(
    guild: Guild,
    executor: GuildMember,
    name: string,
    type: ChannelType,
    options?: Partial<GuildChannelCreateOptions>,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to create channels.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageChannels))) {
        return {
          success: false,
          message: "Bot does not have permission to manage channels.",
        };
      }

      const channel = await guild.channels.create({
        name,
        type,
        ...options,
      });

      return {
        success: true,
        message: `Successfully created channel **${name}** (ID: ${channel.id}).`,
        data: { channelId: channel.id },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create channel.",
        error: String(error),
      };
    }
  }

  async deleteChannel(
    guild: Guild,
    executor: GuildMember,
    channelId: string,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to delete channels.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageChannels))) {
        return {
          success: false,
          message: "Bot does not have permission to manage channels.",
        };
      }

      const channel = await guild.channels.fetch(channelId);
      if (!channel) {
        return {
          success: false,
          message: "Channel not found.",
        };
      }

      const channelName = channel.name;
      await channel.delete();

      return {
        success: true,
        message: `Successfully deleted channel **${channelName}**.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete channel.",
        error: String(error),
      };
    }
  }

  async setNickname(
    guild: Guild,
    executor: GuildMember,
    targetUser: User,
    nickname: string | null,
  ): Promise<ManagementResult> {
    try {
      if (!(await this.permissions.canUseFeature(executor, "management"))) {
        return {
          success: false,
          message: "You do not have permission to manage nicknames.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ManageNicknames))) {
        return {
          success: false,
          message: "Bot does not have permission to manage nicknames.",
        };
      }

      const target = await guild.members.fetch(targetUser.id);
      await target.setNickname(nickname);

      return {
        success: true,
        message: nickname
          ? `Successfully set nickname for ${targetUser.tag} to **${nickname}**.`
          : `Successfully cleared nickname for ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to set nickname.",
        error: String(error),
      };
    }
  }
}
