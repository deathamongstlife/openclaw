import type { Client, GuildMember, Message, TextChannel } from "discord.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";

// Automation features: welcome messages, auto-roles, auto-moderation
export class AutomationManager {
  constructor(
    private store: DiscordBotStoreAdapter,
    private client: Client,
  ) {}

  // Handle member join (welcome + auto-role)
  async handleMemberJoin(member: GuildMember): Promise<void> {
    try {
      const config = await this.store.getServerConfig(member.guild.id);

      // Auto-role assignment
      if (config.modules.autorole && config.autoRoles.length > 0) {
        for (const roleId of config.autoRoles) {
          try {
            const role = await member.guild.roles.fetch(roleId);
            if (role) {
              await member.roles.add(role);
            }
          } catch {
            // Role might not exist or bot lacks permissions
          }
        }
      }

      // Welcome message
      if (config.modules.welcome && config.welcomeMessage && config.welcomeChannel) {
        try {
          const channel = await member.guild.channels.fetch(config.welcomeChannel);
          if (channel?.isTextBased()) {
            const message = this.formatWelcomeMessage(config.welcomeMessage, member);
            await (channel as TextChannel).send(message);
          }
        } catch {
          // Channel might not exist or bot lacks permissions
        }
      }

      // Log event
      if (config.modules.logging) {
        await this.store.logEvent({
          guildId: member.guild.id,
          type: "member_join",
          userId: member.id,
          data: {
            tag: member.user.tag,
            joinedAt: member.joinedAt?.toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling member join:", error);
    }
  }

  // Handle member leave
  async handleMemberLeave(member: GuildMember): Promise<void> {
    try {
      const config = await this.store.getServerConfig(member.guild.id);

      if (config.modules.logging) {
        await this.store.logEvent({
          guildId: member.guild.id,
          type: "member_leave",
          userId: member.id,
          data: {
            tag: member.user.tag,
            roles: member.roles.cache.map((r) => r.name),
          },
        });
      }
    } catch (error) {
      console.error("Error handling member leave:", error);
    }
  }

  // Handle message create (auto-moderation)
  async handleMessage(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild) {
      return false;
    }

    try {
      const config = await this.store.getServerConfig(message.guild.id);

      if (!config.modules.automod) {
        return false;
      }

      const { automodRules } = config;

      // Check for bad words
      if (automodRules.badWords.length > 0) {
        const content = message.content.toLowerCase();
        const hasBadWord = automodRules.badWords.some((word) =>
          content.includes(word.toLowerCase()),
        );

        if (hasBadWord) {
          await message.delete();
          await message.channel.send(
            `${message.author}, your message was deleted for containing prohibited content.`,
          );
          return true;
        }
      }

      // Check for invite links
      if (automodRules.inviteFilter) {
        const inviteRegex = /(discord\.gg|discordapp\.com\/invite)\/[\w-]+/gi;
        if (inviteRegex.test(message.content)) {
          await message.delete();
          await message.channel.send(`${message.author}, invite links are not allowed.`);
          return true;
        }
      }

      // Check for suspicious links
      if (automodRules.linkFilter && automodRules.allowedDomains.length > 0) {
        const urlRegex = /https?:\/\/[^\s]+/gi;
        const urls = message.content.match(urlRegex) || [];

        if (urls.length > 0) {
          const hasDisallowedLink = urls.some((url) => {
            const domain = new URL(url).hostname.toLowerCase();
            return !automodRules.allowedDomains.some((allowed) =>
              domain.includes(allowed.toLowerCase()),
            );
          });

          if (hasDisallowedLink) {
            await message.delete();
            await message.channel.send(`${message.author}, only whitelisted links are allowed.`);
            return true;
          }
        }
      }

      // Check mention spam
      if (message.mentions.users.size > automodRules.mentionLimit) {
        await message.delete();
        await message.channel.send(`${message.author}, too many mentions in one message.`);
        return true;
      }

      // TODO: Implement spam detection based on message rate
      // This would require tracking recent messages per user

      return false;
    } catch (error) {
      console.error("Error in auto-moderation:", error);
      return false;
    }
  }

  // Handle message delete logging
  async handleMessageDelete(message: Message): Promise<void> {
    if (!message.guild) {
      return;
    }

    try {
      const config = await this.store.getServerConfig(message.guild.id);

      if (config.modules.logging && config.logChannel) {
        await this.store.logEvent({
          guildId: message.guild.id,
          type: "message_delete",
          userId: message.author?.id,
          channelId: message.channelId,
          data: {
            content: message.content.substring(0, 500),
            author: message.author?.tag,
            timestamp: message.createdAt.toISOString(),
          },
        });

        // Send to log channel
        try {
          const logChannel = await message.guild.channels.fetch(config.logChannel);
          if (logChannel?.isTextBased()) {
            await (logChannel as TextChannel).send(
              `📝 Message deleted in <#${message.channelId}> by ${message.author?.tag}:\n\`\`\`${message.content.substring(0, 500)}\`\`\``,
            );
          }
        } catch {
          // Log channel might not exist
        }
      }
    } catch (error) {
      console.error("Error logging message delete:", error);
    }
  }

  // Handle message edit logging
  async handleMessageUpdate(oldMessage: Message, newMessage: Message): Promise<void> {
    if (!newMessage.guild || oldMessage.content === newMessage.content) {
      return;
    }

    try {
      const config = await this.store.getServerConfig(newMessage.guild.id);

      if (config.modules.logging && config.logChannel) {
        await this.store.logEvent({
          guildId: newMessage.guild.id,
          type: "message_edit",
          userId: newMessage.author?.id,
          channelId: newMessage.channelId,
          data: {
            oldContent: oldMessage.content.substring(0, 500),
            newContent: newMessage.content.substring(0, 500),
            author: newMessage.author?.tag,
            timestamp: newMessage.editedAt?.toISOString(),
          },
        });

        try {
          const logChannel = await newMessage.guild.channels.fetch(config.logChannel);
          if (logChannel?.isTextBased()) {
            await (logChannel as TextChannel).send(
              `✏️ Message edited in <#${newMessage.channelId}> by ${newMessage.author?.tag}:\nOld: \`${oldMessage.content.substring(0, 200)}\`\nNew: \`${newMessage.content.substring(0, 200)}\``,
            );
          }
        } catch {
          // Log channel might not exist
        }
      }
    } catch (error) {
      console.error("Error logging message edit:", error);
    }
  }

  private formatWelcomeMessage(template: string, member: GuildMember): string {
    return template
      .replace(/\{user\}/g, member.toString())
      .replace(/\{username\}/g, member.user.username)
      .replace(/\{tag\}/g, member.user.tag)
      .replace(/\{server\}/g, member.guild.name)
      .replace(/\{memberCount\}/g, member.guild.memberCount.toString());
  }
}
