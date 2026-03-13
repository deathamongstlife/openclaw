import type { Guild, GuildMember, Message, PermissionResolvable, TextChannel } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { ModerationModel } from "../../database/models/index.js";
import { GuildModel } from "../../database/models/index.js";

export interface ModerationContext {
  guild: Guild;
  channel: TextChannel;
  executor: GuildMember;
  target?: GuildMember;
  message: Message;
}

export class ModerationModule {
  private modModel: ModerationModel;
  private guildModel: GuildModel;

  constructor() {
    this.modModel = new ModerationModel();
    this.guildModel = new GuildModel();
  }

  /**
   * Check if user has moderation permissions
   */
  canModerate(member: GuildMember, guildId: string): boolean {
    // Check for Discord permissions
    if (
      member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return true;
    }

    // Check for configured mod roles
    const modRoles = this.guildModel.getModRoles(guildId);
    return member.roles.cache.some((role) => modRoles.includes(role.id));
  }

  /**
   * Check if executor can moderate target
   */
  canModerateTarget(executor: GuildMember, target: GuildMember): boolean {
    // Can't moderate yourself
    if (executor.id === target.id) {
      return false;
    }

    // Can't moderate the guild owner
    if (target.id === target.guild.ownerId) {
      return false;
    }

    // Can't moderate someone with higher role
    if (target.roles.highest.position >= executor.roles.highest.position) {
      return false;
    }

    return true;
  }

  /**
   * Warn a user
   */
  async warn(
    ctx: ModerationContext,
    targetId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.canModerate(ctx.executor, ctx.guild.id)) {
      return { success: false, message: "You don't have permission to warn members." };
    }

    const target = await ctx.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      return { success: false, message: "Could not find that user." };
    }

    if (!this.canModerateTarget(ctx.executor, target)) {
      return { success: false, message: "You cannot warn this user." };
    }

    // Add warning to database
    this.modModel.addWarning(ctx.guild.id, target.id, ctx.executor.id, reason);

    // Log the action
    this.modModel.logAction(ctx.guild.id, target.id, ctx.executor.id, "warn", reason);

    const warningCount = this.modModel.getWarningCount(ctx.guild.id, target.id);

    // Try to DM the user
    try {
      await target.send(
        `You have been warned in **${ctx.guild.name}**\nReason: ${reason}\nTotal warnings: ${warningCount}`,
      );
    } catch {
      // User has DMs disabled
    }

    return {
      success: true,
      message: `Warned ${target.user.tag} (${warningCount} total warnings)\nReason: ${reason}`,
    };
  }

  /**
   * Kick a user
   */
  async kick(
    ctx: ModerationContext,
    targetId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.KickMembers)) {
      return { success: false, message: "You don't have permission to kick members." };
    }

    const target = await ctx.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      return { success: false, message: "Could not find that user." };
    }

    if (!this.canModerateTarget(ctx.executor, target)) {
      return { success: false, message: "You cannot kick this user." };
    }

    if (!target.kickable) {
      return { success: false, message: "I cannot kick this user (missing permissions)." };
    }

    // Log the action before kicking
    this.modModel.logAction(ctx.guild.id, target.id, ctx.executor.id, "kick", reason);

    // Try to DM the user
    try {
      await target.send(`You have been kicked from **${ctx.guild.name}**\nReason: ${reason}`);
    } catch {
      // User has DMs disabled
    }

    // Kick the user
    await target.kick(reason);

    return {
      success: true,
      message: `Kicked ${target.user.tag}\nReason: ${reason}`,
    };
  }

  /**
   * Ban a user
   */
  async ban(
    ctx: ModerationContext,
    targetId: string,
    reason: string,
    deleteMessageDays = 1,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.BanMembers)) {
      return { success: false, message: "You don't have permission to ban members." };
    }

    const target = await ctx.guild.members.fetch(targetId).catch(() => null);
    if (target && !this.canModerateTarget(ctx.executor, target)) {
      return { success: false, message: "You cannot ban this user." };
    }

    if (target && !target.bannable) {
      return { success: false, message: "I cannot ban this user (missing permissions)." };
    }

    // Log the action before banning
    this.modModel.logAction(ctx.guild.id, targetId, ctx.executor.id, "ban", reason);

    // Try to DM the user if they're in the guild
    if (target) {
      try {
        await target.send(`You have been banned from **${ctx.guild.name}**\nReason: ${reason}`);
      } catch {
        // User has DMs disabled
      }
    }

    // Ban the user
    await ctx.guild.members.ban(targetId, {
      reason,
      deleteMessageSeconds: deleteMessageDays * 86400,
    });

    return {
      success: true,
      message: `Banned user (ID: ${targetId})\nReason: ${reason}`,
    };
  }

  /**
   * Unban a user
   */
  async unban(
    ctx: ModerationContext,
    userId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.BanMembers)) {
      return { success: false, message: "You don't have permission to unban members." };
    }

    try {
      await ctx.guild.members.unban(userId, reason);

      // Log the action
      this.modModel.logAction(ctx.guild.id, userId, ctx.executor.id, "unban", reason);

      return {
        success: true,
        message: `Unbanned user (ID: ${userId})\nReason: ${reason}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to unban user: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Timeout a user
   */
  async timeout(
    ctx: ModerationContext,
    targetId: string,
    duration: number,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return { success: false, message: "You don't have permission to timeout members." };
    }

    const target = await ctx.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      return { success: false, message: "Could not find that user." };
    }

    if (!this.canModerateTarget(ctx.executor, target)) {
      return { success: false, message: "You cannot timeout this user." };
    }

    if (!target.moderatable) {
      return { success: false, message: "I cannot timeout this user (missing permissions)." };
    }

    // Log the action
    this.modModel.logAction(ctx.guild.id, target.id, ctx.executor.id, "timeout", reason, duration);

    // Apply timeout
    await target.timeout(duration, reason);

    const durationStr = this.formatDuration(duration);

    // Try to DM the user
    try {
      await target.send(
        `You have been timed out in **${ctx.guild.name}** for ${durationStr}\nReason: ${reason}`,
      );
    } catch {
      // User has DMs disabled
    }

    return {
      success: true,
      message: `Timed out ${target.user.tag} for ${durationStr}\nReason: ${reason}`,
    };
  }

  /**
   * Remove timeout from a user
   */
  async removeTimeout(
    ctx: ModerationContext,
    targetId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return { success: false, message: "You don't have permission to remove timeouts." };
    }

    const target = await ctx.guild.members.fetch(targetId).catch(() => null);
    if (!target) {
      return { success: false, message: "Could not find that user." };
    }

    if (!target.moderatable) {
      return { success: false, message: "I cannot modify this user (missing permissions)." };
    }

    await target.timeout(null, "Timeout removed");

    return {
      success: true,
      message: `Removed timeout from ${target.user.tag}`,
    };
  }

  /**
   * Purge messages
   */
  async purge(
    ctx: ModerationContext,
    count: number,
    filterUserId?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return { success: false, message: "You don't have permission to delete messages." };
    }

    if (count < 1 || count > 100) {
      return { success: false, message: "Count must be between 1 and 100." };
    }

    try {
      const messages = await ctx.channel.messages.fetch({ limit: Math.min(count + 1, 100) });

      const toDelete = filterUserId
        ? messages.filter((m) => m.author.id === filterUserId && m.id !== ctx.message.id)
        : messages.filter((m) => m.id !== ctx.message.id);

      const deleted = await ctx.channel.bulkDelete(toDelete, true);

      return {
        success: true,
        message: `Deleted ${deleted.size} message(s)`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete messages: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Set slowmode
   */
  async setSlowmode(
    ctx: ModerationContext,
    seconds: number,
  ): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return { success: false, message: "You don't have permission to manage channels." };
    }

    if (seconds < 0 || seconds > 21600) {
      return { success: false, message: "Slowmode must be between 0 and 21600 seconds (6 hours)." };
    }

    await ctx.channel.setRateLimitPerUser(seconds);

    return {
      success: true,
      message: seconds > 0 ? `Set slowmode to ${seconds} second(s)` : "Disabled slowmode",
    };
  }

  /**
   * Lock a channel
   */
  async lockChannel(ctx: ModerationContext): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return { success: false, message: "You don't have permission to manage channels." };
    }

    const everyoneRole = ctx.guild.roles.everyone;

    await ctx.channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
    });

    return {
      success: true,
      message: `Locked ${ctx.channel.name}`,
    };
  }

  /**
   * Unlock a channel
   */
  async unlockChannel(ctx: ModerationContext): Promise<{ success: boolean; message: string }> {
    if (!ctx.executor.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return { success: false, message: "You don't have permission to manage channels." };
    }

    const everyoneRole = ctx.guild.roles.everyone;

    await ctx.channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null,
    });

    return {
      success: true,
      message: `Unlocked ${ctx.channel.name}`,
    };
  }

  /**
   * Get warnings for a user
   */
  async getWarnings(
    guildId: string,
    userId: string,
  ): Promise<Array<{ id: string; reason: string; timestamp: number; moderator: string }>> {
    return this.modModel.getWarnings(guildId, userId, true).map((w) => ({
      id: w.id,
      reason: w.reason,
      timestamp: w.timestamp,
      moderator: w.moderatorId,
    }));
  }

  /**
   * Clear a warning
   */
  clearWarning(warningId: string): boolean {
    return this.modModel.clearWarning(warningId);
  }

  /**
   * Clear all warnings for a user
   */
  clearAllWarnings(guildId: string, userId: string): number {
    return this.modModel.clearAllWarnings(guildId, userId);
  }

  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}
