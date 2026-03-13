import type { Guild, GuildMember, User, TextChannel, ThreadChannel, Message } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";
import { PermissionManager } from "./permissions.js";

export interface ModerationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Moderation feature implementations
export class ModerationManager {
  private permissions: PermissionManager;

  constructor(private store: DiscordBotStoreAdapter) {
    this.permissions = new PermissionManager(store);
  }

  async warnUser(
    guild: Guild,
    moderator: GuildMember,
    targetUser: User,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      // Fetch target member
      const target = await guild.members.fetch(targetUser.id);

      // Check permissions
      if (!(await this.permissions.canModerateUser(moderator, target))) {
        return {
          success: false,
          message: "You cannot moderate this user (insufficient permissions or role hierarchy).",
        };
      }

      // Add warning to database
      const warning = await this.store.addWarning({
        userId: targetUser.id,
        guildId: guild.id,
        moderatorId: moderator.id,
        reason,
        active: true,
      });

      // Log moderation action
      await this.store.logModerationAction({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: moderator.id,
        type: "warn",
        reason,
      });

      // Get warning count
      const warnings = await this.store.getUserWarnings(guild.id, targetUser.id);

      // Try to DM the user
      try {
        await targetUser.send(
          `You have been warned in **${guild.name}** by ${moderator.user.tag}.\nReason: ${reason}\nTotal warnings: ${warnings.length}`,
        );
      } catch {
        // User has DMs disabled, continue anyway
      }

      return {
        success: true,
        message: `Successfully warned ${targetUser.tag}. They now have ${warnings.length} warning(s).`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to warn user.",
        error: String(error),
      };
    }
  }

  async kickUser(
    guild: Guild,
    moderator: GuildMember,
    targetUser: User,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      const target = await guild.members.fetch(targetUser.id);

      if (!(await this.permissions.canModerateUser(moderator, target))) {
        return {
          success: false,
          message: "You cannot moderate this user (insufficient permissions or role hierarchy).",
        };
      }

      if (!(await this.permissions.botCanModerate(guild, target))) {
        return {
          success: false,
          message: "Bot cannot moderate this user (role hierarchy).",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.KickMembers))) {
        return {
          success: false,
          message: "Bot does not have permission to kick members.",
        };
      }

      // Try to DM the user before kicking
      try {
        await targetUser.send(
          `You have been kicked from **${guild.name}** by ${moderator.user.tag}.\nReason: ${reason}`,
        );
      } catch {
        // User has DMs disabled
      }

      await target.kick(reason);

      await this.store.logModerationAction({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: moderator.id,
        type: "kick",
        reason,
      });

      return {
        success: true,
        message: `Successfully kicked ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to kick user.",
        error: String(error),
      };
    }
  }

  async banUser(
    guild: Guild,
    moderator: GuildMember,
    targetUser: User,
    reason: string,
    deleteMessageDays: number = 0,
  ): Promise<ModerationResult> {
    try {
      let target: GuildMember | null = null;
      try {
        target = await guild.members.fetch(targetUser.id);
      } catch {
        // User might not be in the server (can still ban)
      }

      if (target && !(await this.permissions.canModerateUser(moderator, target))) {
        return {
          success: false,
          message: "You cannot moderate this user (insufficient permissions or role hierarchy).",
        };
      }

      if (target && !(await this.permissions.botCanModerate(guild, target))) {
        return {
          success: false,
          message: "Bot cannot moderate this user (role hierarchy).",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.BanMembers))) {
        return {
          success: false,
          message: "Bot does not have permission to ban members.",
        };
      }

      // Try to DM the user before banning
      try {
        await targetUser.send(
          `You have been banned from **${guild.name}** by ${moderator.user.tag}.\nReason: ${reason}`,
        );
      } catch {
        // User has DMs disabled
      }

      await guild.members.ban(targetUser.id, {
        reason,
        deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60,
      });

      await this.store.logModerationAction({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: moderator.id,
        type: "ban",
        reason,
        metadata: { deleteMessageDays },
      });

      return {
        success: true,
        message: `Successfully banned ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to ban user.",
        error: String(error),
      };
    }
  }

  async unbanUser(
    guild: Guild,
    moderator: GuildMember,
    userId: string,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      if (!(await this.permissions.hasModPermission(moderator))) {
        return {
          success: false,
          message: "You do not have permission to unban users.",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.BanMembers))) {
        return {
          success: false,
          message: "Bot does not have permission to manage bans.",
        };
      }

      await guild.members.unban(userId, reason);

      await this.store.logModerationAction({
        guildId: guild.id,
        userId,
        moderatorId: moderator.id,
        type: "unban",
        reason,
      });

      return {
        success: true,
        message: `Successfully unbanned user ID ${userId}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to unban user.",
        error: String(error),
      };
    }
  }

  async timeoutUser(
    guild: Guild,
    moderator: GuildMember,
    targetUser: User,
    durationMs: number,
    reason: string,
  ): Promise<ModerationResult> {
    try {
      const target = await guild.members.fetch(targetUser.id);

      if (!(await this.permissions.canModerateUser(moderator, target))) {
        return {
          success: false,
          message: "You cannot moderate this user (insufficient permissions or role hierarchy).",
        };
      }

      if (!(await this.permissions.botCanModerate(guild, target))) {
        return {
          success: false,
          message: "Bot cannot moderate this user (role hierarchy).",
        };
      }

      if (!(await this.permissions.botHasPermission(guild, PermissionFlagsBits.ModerateMembers))) {
        return {
          success: false,
          message: "Bot does not have permission to timeout members.",
        };
      }

      // Discord timeout max is 28 days
      const maxTimeout = 28 * 24 * 60 * 60 * 1000;
      const timeout = Math.min(durationMs, maxTimeout);

      await target.timeout(timeout, reason);

      await this.store.logModerationAction({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: moderator.id,
        type: "timeout",
        reason,
        duration: timeout,
      });

      const durationStr = this.formatDuration(timeout);

      return {
        success: true,
        message: `Successfully timed out ${targetUser.tag} for ${durationStr}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to timeout user.",
        error: String(error),
      };
    }
  }

  async clearWarnings(
    guild: Guild,
    moderator: GuildMember,
    targetUser: User,
  ): Promise<ModerationResult> {
    try {
      if (!(await this.permissions.hasModPermission(moderator))) {
        return {
          success: false,
          message: "You do not have permission to clear warnings.",
        };
      }

      await this.store.clearWarnings(guild.id, targetUser.id);

      return {
        success: true,
        message: `Successfully cleared warnings for ${targetUser.tag}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to clear warnings.",
        error: String(error),
      };
    }
  }

  async setSlowmode(
    channel: TextChannel | ThreadChannel,
    moderator: GuildMember,
    seconds: number,
  ): Promise<ModerationResult> {
    try {
      if (!(await this.permissions.hasModPermission(moderator))) {
        return {
          success: false,
          message: "You do not have permission to set slowmode.",
        };
      }

      if (
        !(await this.permissions.botHasPermission(
          channel.guild,
          PermissionFlagsBits.ManageChannels,
        ))
      ) {
        return {
          success: false,
          message: "Bot does not have permission to manage channels.",
        };
      }

      // Max slowmode is 6 hours (21600 seconds)
      const slowmode = Math.min(Math.max(0, seconds), 21600);

      await channel.setRateLimitPerUser(slowmode);

      return {
        success: true,
        message:
          slowmode > 0
            ? `Set slowmode to ${slowmode} seconds in ${channel.name}.`
            : `Disabled slowmode in ${channel.name}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to set slowmode.",
        error: String(error),
      };
    }
  }

  async lockChannel(
    channel: TextChannel | ThreadChannel,
    moderator: GuildMember,
    lock: boolean,
  ): Promise<ModerationResult> {
    try {
      if (!(await this.permissions.hasModPermission(moderator))) {
        return {
          success: false,
          message: "You do not have permission to lock channels.",
        };
      }

      if (
        !(await this.permissions.botHasPermission(
          channel.guild,
          PermissionFlagsBits.ManageChannels,
        ))
      ) {
        return {
          success: false,
          message: "Bot does not have permission to manage channels.",
        };
      }

      const everyoneRole = channel.guild.roles.everyone;

      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: !lock,
      });

      return {
        success: true,
        message: lock ? `Locked ${channel.name}.` : `Unlocked ${channel.name}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to lock/unlock channel.",
        error: String(error),
      };
    }
  }

  async purgeMessages(
    channel: TextChannel,
    moderator: GuildMember,
    count: number,
    userId?: string,
  ): Promise<ModerationResult> {
    try {
      if (!(await this.permissions.hasModPermission(moderator))) {
        return {
          success: false,
          message: "You do not have permission to purge messages.",
        };
      }

      if (
        !(await this.permissions.botHasPermission(
          channel.guild,
          PermissionFlagsBits.ManageMessages,
        ))
      ) {
        return {
          success: false,
          message: "Bot does not have permission to manage messages.",
        };
      }

      // Fetch messages
      const limit = Math.min(Math.max(1, count), 100);
      const messages = await channel.messages.fetch({ limit: limit * 2 });

      let toDelete = Array.from(messages.values());

      // Filter by user if specified
      if (userId) {
        toDelete = toDelete.filter((m) => m.author.id === userId);
      }

      // Take only the requested count
      toDelete = toDelete.slice(0, limit);

      // Can only bulk delete messages less than 14 days old
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentMessages = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

      if (recentMessages.length === 0) {
        return {
          success: false,
          message: "No messages found to delete (messages must be less than 14 days old).",
        };
      }

      await channel.bulkDelete(recentMessages, true);

      return {
        success: true,
        message: `Successfully deleted ${recentMessages.length} message(s).`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to purge messages.",
        error: String(error),
      };
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
  }
}
