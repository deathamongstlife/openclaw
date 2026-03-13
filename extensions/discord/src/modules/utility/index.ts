import type { Message, Guild, GuildMember } from "discord.js";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { Guild as GuildConfig } from "../../database/models/guild.js";
import { ModerationModel } from "../../database/models/index.js";
import type { ParsedCommand } from "../../nlp/parser.js";

interface TagData {
  name: string;
  content: string;
  author: string;
  uses: number;
  createdAt: number;
}

export class UtilityModule {
  private modModel: ModerationModel;
  private tags: Map<string, Map<string, TagData>> = new Map(); // guildId -> tagName -> TagData

  constructor() {
    this.modModel = new ModerationModel();
  }

  /**
   * Handle utility intent
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
      case "server.info":
        return await this.getServerInfo(message.guild);

      case "user.info":
        return await this.getUserInfo(message, parsed);

      case "user.avatar":
        return await this.getUserAvatar(message, parsed);

      case "user.roles":
        return await this.getUserRoles(message, parsed);

      case "utility.poll":
        return await this.createPoll(message, parsed);

      case "utility.tag.create":
        return await this.createTag(message, parsed);

      case "utility.tag.get":
        return await this.getTag(message, parsed);

      case "utility.tag.list":
        return await this.listTags(message);

      case "utility.tag.delete":
        return await this.deleteTag(message, parsed);

      default:
        return null;
    }
  }

  /**
   * Get server information
   */
  private async getServerInfo(guild: Guild): Promise<string> {
    const owner = await guild.fetchOwner();
    const createdAt = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`✨ ${guild.name}`)
      .setThumbnail(guild.iconURL() ?? undefined)
      .addFields(
        { name: "Owner", value: `${owner.user.tag}`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Boost Level", value: `${guild.premiumTier}`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true },
        { name: "Created", value: `<t:${createdAt}:R>`, inline: false },
      )
      .setColor(0x5865f2)
      .setFooter({ text: `ID: ${guild.id}` });

    return `Server info, bestie! 📊✨\n${JSON.stringify(embed.toJSON())}`;
  }

  /**
   * Get user information
   */
  private async getUserInfo(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const targetId = (parsed.parameters.targetUser as string) ?? message.author.id;
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) {
      return "Could not find that user, hunty! 😢";
    }

    const joinedAt = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : 0;
    const createdAt = Math.floor(member.user.createdTimestamp / 1000);

    // Get warning count
    const warningCount = this.modModel.getWarningCount(message.guild.id, member.id);

    const roles = member.roles.cache
      .filter((r) => r.id !== message.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.name)
      .slice(0, 10)
      .join(", ");

    const embed = new EmbedBuilder()
      .setTitle(`User Info: ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "ID", value: member.id, inline: true },
        { name: "Nickname", value: member.nickname ?? "None", inline: true },
        { name: "Warnings", value: `${warningCount}`, inline: true },
        { name: "Joined Server", value: `<t:${joinedAt}:R>`, inline: true },
        { name: "Account Created", value: `<t:${createdAt}:R>`, inline: true },
        { name: "Roles", value: roles || "None", inline: false },
      )
      .setColor(member.displayColor || 0x5865f2);

    return `Here's the tea on ${member.user.tag}! ☕✨\n${JSON.stringify(embed.toJSON())}`;
  }

  /**
   * Get user avatar
   */
  private async getUserAvatar(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const targetId = (parsed.parameters.targetUser as string) ?? message.author.id;
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) {
      return "Could not find that user!";
    }

    const avatarUrl = member.user.displayAvatarURL({ size: 1024 });
    return `Here's ${member.user.tag}'s avatar! ✨\n${avatarUrl}`;
  }

  /**
   * Get user roles
   */
  private async getUserRoles(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const targetId = (parsed.parameters.targetUser as string) ?? message.author.id;
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) {
      return "Could not find that user!";
    }

    const roles = member.roles.cache
      .filter((r) => r.id !== message.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `${r.name} (${r.id})`)
      .join("\n");

    return `**Roles for ${member.user.tag}:**\n${roles || "No roles"}`;
  }

  /**
   * Create a poll
   */
  private async createPoll(message: Message, parsed: ParsedCommand): Promise<string> {
    const question = parsed.parameters.question as string | undefined;

    if (!question) {
      return "Please provide a question for the poll! Example: `poll Should we add a new channel?`";
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 Poll")
      .setDescription(question)
      .setColor(0x5865f2)
      .setFooter({ text: `Poll by ${message.author.tag}` })
      .setTimestamp();

    // Send poll message
    const pollMessage = await message.channel.send({ content: JSON.stringify(embed.toJSON()) });

    // Add reactions
    await pollMessage.react("👍");
    await pollMessage.react("👎");
    await pollMessage.react("🤷");

    return "Poll created, bestie! 📊✨";
  }

  /**
   * Create a tag
   */
  private async createTag(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return "You need Manage Messages permission to create tags! 🔒";
    }

    // Parse tag name and content from message
    const parts = parsed.originalMessage.match(/tag\s+create\s+(\w+)\s+(.+)/i);
    if (!parts || parts.length < 3) {
      return "Usage: `tag create <name> <content>`";
    }

    const [, tagName, content] = parts;
    const guildId = message.guild.id;

    if (!this.tags.has(guildId)) {
      this.tags.set(guildId, new Map());
    }

    const guildTags = this.tags.get(guildId)!;

    if (guildTags.has(tagName.toLowerCase())) {
      return `Tag \`${tagName}\` already exists!`;
    }

    guildTags.set(tagName.toLowerCase(), {
      name: tagName,
      content,
      author: message.author.id,
      uses: 0,
      createdAt: Date.now(),
    });

    return `Tag \`${tagName}\` created! ✨`;
  }

  /**
   * Get a tag
   */
  private async getTag(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const parts = parsed.originalMessage.match(/tag\s+(?:get\s+)?(\w+)/i);
    if (!parts || parts.length < 2) {
      return "Usage: `tag <name>` or `tag get <name>`";
    }

    const tagName = parts[1];
    const guildId = message.guild.id;
    const guildTags = this.tags.get(guildId);

    if (!guildTags || !guildTags.has(tagName.toLowerCase())) {
      return `Tag \`${tagName}\` not found! Use \`tag list\` to see all tags.`;
    }

    const tag = guildTags.get(tagName.toLowerCase())!;
    tag.uses++;

    return tag.content;
  }

  /**
   * List all tags
   */
  private async listTags(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const guildId = message.guild.id;
    const guildTags = this.tags.get(guildId);

    if (!guildTags || guildTags.size === 0) {
      return "No tags created yet! Create one with `tag create <name> <content>`";
    }

    const tagList = Array.from(guildTags.values())
      .map((tag) => `• \`${tag.name}\` (used ${tag.uses} times)`)
      .join("\n");

    return `**Available Tags:**\n${tagList}`;
  }

  /**
   * Delete a tag
   */
  private async deleteTag(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return "You need Manage Messages permission to delete tags! 🔒";
    }

    const parts = parsed.originalMessage.match(/tag\s+delete\s+(\w+)/i);
    if (!parts || parts.length < 2) {
      return "Usage: `tag delete <name>`";
    }

    const tagName = parts[1];
    const guildId = message.guild.id;
    const guildTags = this.tags.get(guildId);

    if (!guildTags || !guildTags.has(tagName.toLowerCase())) {
      return `Tag \`${tagName}\` not found!`;
    }

    guildTags.delete(tagName.toLowerCase());
    return `Tag \`${tagName}\` deleted! 🗑️✨`;
  }
}
