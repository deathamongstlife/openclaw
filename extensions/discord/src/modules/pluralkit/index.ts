import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Guild as GuildConfig } from "../../database/models/guild.js";
import type { ParsedCommand } from "../../nlp/parser.js";
import { PluralKitDetector } from "../../pluralkit/detector.js";

export class PluralKitModule {
  private detector: PluralKitDetector;

  constructor() {
    this.detector = new PluralKitDetector();
  }

  /**
   * Handle PluralKit intent
   */
  async handleIntent(
    parsed: ParsedCommand,
    message: Message,
    guild: GuildConfig,
  ): Promise<string | null> {
    // PluralKit module doesn't have explicit intents yet
    // This is mainly for future expansion
    return null;
  }

  /**
   * Detect and cache PluralKit proxy message
   */
  async detectAndCache(message: Message): Promise<boolean> {
    return await this.detector.detectAndCache(message);
  }

  /**
   * Get member info for a message
   */
  async getMemberInfo(messageId: string) {
    return await this.detector.getMemberInfo(messageId);
  }

  /**
   * Get cached member by ID
   */
  getCachedMember(memberId: string) {
    return this.detector.getCachedMember(memberId);
  }

  /**
   * Get cached system by ID
   */
  getCachedSystem(systemId: string) {
    return this.detector.getCachedSystem(systemId);
  }

  /**
   * Get system info as an embed (for display)
   */
  async getSystemEmbed(systemId: string): Promise<string | null> {
    const cached = this.detector.getCachedSystem(systemId);

    if (!cached) {
      return null;
    }

    const embed = new EmbedBuilder()
      .setTitle(`PluralKit System: ${cached.name ?? "Unknown"}`)
      .setColor(0x5865f2)
      .addFields({ name: "System ID", value: cached.systemId, inline: true });

    if (cached.tag) {
      embed.addFields({ name: "Tag", value: cached.tag, inline: true });
    }

    if (cached.avatarUrl) {
      embed.setThumbnail(cached.avatarUrl);
    }

    return JSON.stringify(embed.toJSON());
  }

  /**
   * Get member info as an embed (for display)
   */
  async getMemberEmbed(memberId: string): Promise<string | null> {
    const cached = this.detector.getCachedMember(memberId);

    if (!cached) {
      return null;
    }

    const embed = new EmbedBuilder()
      .setTitle(`PluralKit Member: ${cached.displayName ?? cached.name}`)
      .setColor(0x5865f2)
      .addFields(
        { name: "Name", value: cached.name, inline: true },
        { name: "Member ID", value: cached.memberId, inline: true },
        { name: "System ID", value: cached.systemId, inline: true },
      );

    if (cached.displayName) {
      embed.addFields({ name: "Display Name", value: cached.displayName, inline: true });
    }

    if (cached.avatarUrl) {
      embed.setThumbnail(cached.avatarUrl);
    }

    if (cached.proxyTags) {
      try {
        const tags = JSON.parse(cached.proxyTags);
        const tagStrings = tags
          .map(
            (t: { prefix: string | null; suffix: string | null }) =>
              `\`${t.prefix ?? ""}text${t.suffix ?? ""}\``,
          )
          .join(", ");
        embed.addFields({ name: "Proxy Tags", value: tagStrings, inline: false });
      } catch {
        // Invalid JSON, skip
      }
    }

    return JSON.stringify(embed.toJSON());
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    this.detector.clearExpiredCache();
  }
}
