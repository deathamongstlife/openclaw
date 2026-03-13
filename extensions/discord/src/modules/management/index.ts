import type { Message, Role, GuildChannel } from "discord.js";
import { PermissionFlagsBits, ChannelType } from "discord.js";
import type { Guild as GuildConfig } from "../../database/models/guild.js";
import type { ParsedCommand } from "../../nlp/parser.js";

export class ManagementModule {
  /**
   * Handle management intent
   */
  async handleIntent(
    parsed: ParsedCommand,
    message: Message,
    guild: GuildConfig,
  ): Promise<string | null> {
    if (!message.guild || !message.member) {
      return null;
    }

    switch (parsed.intent) {
      case "server.roles.create":
        return await this.createRole(message, parsed);

      case "server.roles.delete":
        return await this.deleteRole(message, parsed);

      case "server.roles.assign":
        return await this.assignRole(message, parsed);

      case "server.roles.remove":
        return await this.removeRole(message, parsed);

      case "server.roles.list":
        return await this.listRoles(message);

      case "server.channels.create":
        return await this.createChannel(message, parsed);

      case "server.channels.delete":
        return await this.deleteChannel(message, parsed);

      case "server.channels.list":
        return await this.listChannels(message);

      default:
        return null;
    }
  }

  /**
   * Create a new role
   */
  private async createRole(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "You need Manage Roles permission to create roles! 🔒";
    }

    // Parse role name and optional color from message
    const parts = parsed.originalMessage.match(
      /create\s+role\s+(?:named\s+)?(.+?)(?:\s+(?:with\s+)?color\s+#?([0-9a-f]{6}))?$/i,
    );
    if (!parts || parts.length < 2) {
      return "Usage: `create role <name> [color #RRGGBB]`\nExample: `create role Moderator color #ff0000`";
    }

    const roleName = parts[1].trim();
    const colorHex = parts[2] ? parseInt(parts[2], 16) : undefined;

    try {
      const role = await message.guild.roles.create({
        name: roleName,
        color: colorHex,
        reason: `Created by ${message.author.tag}`,
      });

      return `Role **${role.name}** created successfully! ✨`;
    } catch (error) {
      return `Failed to create role: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Delete a role
   */
  private async deleteRole(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "You need Manage Roles permission to delete roles! 🔒";
    }

    const roleId = (parsed.parameters.roleMentions as string[])?.[0];
    if (!roleId) {
      return "Please mention the role to delete! Example: `delete role @RoleName`";
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) {
      return "Could not find that role!";
    }

    // Check if role is higher than user's highest role
    if (role.position >= message.member.roles.highest.position) {
      return "You cannot delete a role higher than or equal to your highest role! 🚫";
    }

    // Check if role is higher than bot's highest role
    const botMember = await message.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return "I cannot delete a role higher than or equal to my highest role! 🚫";
    }

    try {
      const roleName = role.name;
      await role.delete(`Deleted by ${message.author.tag}`);
      return `Role **${roleName}** deleted! 🗑️`;
    } catch (error) {
      return `Failed to delete role: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Assign a role to a user
   */
  private async assignRole(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "You need Manage Roles permission to assign roles! 🔒";
    }

    const userId = (parsed.parameters.userMentions as string[])?.[0];
    const roleId = (parsed.parameters.roleMentions as string[])?.[0];

    if (!userId || !roleId) {
      return "Please mention both a user and a role! Example: `assign @user role @RoleName`";
    }

    const member = await message.guild.members.fetch(userId).catch(() => null);
    const role = message.guild.roles.cache.get(roleId);

    if (!member) {
      return "Could not find that user!";
    }

    if (!role) {
      return "Could not find that role!";
    }

    // Check if role is higher than user's highest role
    if (role.position >= message.member.roles.highest.position) {
      return "You cannot assign a role higher than or equal to your highest role! 🚫";
    }

    // Check if role is higher than bot's highest role
    const botMember = await message.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return "I cannot assign a role higher than or equal to my highest role! 🚫";
    }

    if (member.roles.cache.has(roleId)) {
      return `${member.user.tag} already has the **${role.name}** role!`;
    }

    try {
      await member.roles.add(role, `Assigned by ${message.author.tag}`);
      return `Gave **${role.name}** to ${member.user.tag}! ✨`;
    } catch (error) {
      return `Failed to assign role: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Remove a role from a user
   */
  private async removeRole(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "You need Manage Roles permission to remove roles! 🔒";
    }

    const userId = (parsed.parameters.userMentions as string[])?.[0];
    const roleId = (parsed.parameters.roleMentions as string[])?.[0];

    if (!userId || !roleId) {
      return "Please mention both a user and a role! Example: `remove @user role @RoleName`";
    }

    const member = await message.guild.members.fetch(userId).catch(() => null);
    const role = message.guild.roles.cache.get(roleId);

    if (!member) {
      return "Could not find that user!";
    }

    if (!role) {
      return "Could not find that role!";
    }

    // Check if role is higher than user's highest role
    if (role.position >= message.member.roles.highest.position) {
      return "You cannot remove a role higher than or equal to your highest role! 🚫";
    }

    // Check if role is higher than bot's highest role
    const botMember = await message.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      return "I cannot remove a role higher than or equal to my highest role! 🚫";
    }

    if (!member.roles.cache.has(roleId)) {
      return `${member.user.tag} doesn't have the **${role.name}** role!`;
    }

    try {
      await member.roles.remove(role, `Removed by ${message.author.tag}`);
      return `Removed **${role.name}** from ${member.user.tag}! ✨`;
    } catch (error) {
      return `Failed to remove role: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * List all roles
   */
  private async listRoles(message: Message): Promise<string> {
    if (!message.guild) {
      return "Not available in DMs!";
    }

    const roles = message.guild.roles.cache
      .filter((r) => r.id !== message.guild?.id) // Exclude @everyone
      .sort((a, b) => b.position - a.position)
      .map((r) => `${r.name} - ${r.members.size} members`)
      .slice(0, 25);

    if (roles.length === 0) {
      return "No roles found!";
    }

    return `**Server Roles:**\n${roles.join("\n")}`;
  }

  /**
   * Create a new channel
   */
  private async createChannel(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return "You need Manage Channels permission to create channels! 🔒";
    }

    // Parse channel name and type from message
    const parts = parsed.originalMessage.match(
      /create\s+(?:(voice|text|category)\s+)?channel\s+(?:named\s+)?(.+)/i,
    );
    if (!parts || parts.length < 3) {
      return "Usage: `create [voice/text/category] channel <name>`\nExample: `create voice channel General Voice`";
    }

    const typeStr = parts[1]?.toLowerCase() ?? "text";
    const channelName = parts[2].trim();

    let channelType: ChannelType;
    switch (typeStr) {
      case "voice":
        channelType = ChannelType.GuildVoice;
        break;
      case "category":
        channelType = ChannelType.GuildCategory;
        break;
      case "text":
      default:
        channelType = ChannelType.GuildText;
        break;
    }

    try {
      const channel = await message.guild.channels.create({
        name: channelName,
        type: channelType,
        reason: `Created by ${message.author.tag}`,
      });

      return `Channel **${channel.name}** created successfully! ✨`;
    } catch (error) {
      return `Failed to create channel: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Delete a channel
   */
  private async deleteChannel(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild || !message.member) {
      return "Not available in DMs!";
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return "You need Manage Channels permission to delete channels! 🔒";
    }

    const channelId = (parsed.parameters.channelMentions as string[])?.[0];
    if (!channelId) {
      return "Please mention the channel to delete! Example: `delete channel #channel-name`";
    }

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) {
      return "Could not find that channel!";
    }

    try {
      const channelName = channel.name;
      await channel.delete(`Deleted by ${message.author.tag}`);
      return `Channel **${channelName}** deleted! 🗑️`;
    } catch (error) {
      return `Failed to delete channel: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * List all channels
   */
  private async listChannels(message: Message): Promise<string> {
    if (!message.guild) {
      return "Not available in DMs!";
    }

    const textChannels = message.guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildText)
      .map((c) => `• ${c.name}`)
      .slice(0, 15);

    const voiceChannels = message.guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildVoice)
      .map((c) => `• ${c.name}`)
      .slice(0, 15);

    let response = "**Server Channels:**\n\n";

    if (textChannels.length > 0) {
      response += `**Text Channels:**\n${textChannels.join("\n")}\n\n`;
    }

    if (voiceChannels.length > 0) {
      response += `**Voice Channels:**\n${voiceChannels.join("\n")}`;
    }

    return response;
  }
}
