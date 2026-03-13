import type { Message } from "discord.js";
import { PluralKitModel } from "../database/models/pluralkit.js";
import { PluralKitAPI } from "./api.js";

/**
 * PluralKit proxy message detector and data fetcher
 */
export class PluralKitDetector {
  private api: PluralKitAPI;
  private model: PluralKitModel;

  // PluralKit bot ID
  private static readonly PK_BOT_ID = "466378653216014359";

  constructor() {
    this.api = new PluralKitAPI();
    this.model = new PluralKitModel();
  }

  /**
   * Check if a message is a PluralKit proxy message
   */
  static isPluralKitMessage(message: Message): boolean {
    return message.author.id === PluralKitDetector.PK_BOT_ID;
  }

  /**
   * Detect and cache PluralKit message data
   */
  async detectAndCache(message: Message): Promise<boolean> {
    if (!PluralKitDetector.isPluralKitMessage(message)) {
      return false;
    }

    try {
      // Fetch message info from PK API
      const pkMessage = await this.api.getMessage(message.id);

      if (!pkMessage) {
        return false;
      }

      // Cache system info if available
      if (pkMessage.system) {
        const systemData = await this.api.getSystem(pkMessage.system.id);
        if (systemData) {
          this.model.cacheSystem(systemData.id, {
            name: systemData.name,
            tag: systemData.tag,
            avatarUrl: systemData.avatar_url,
          });
        }
      }

      // Cache member info if available
      if (pkMessage.member) {
        const memberData = await this.api.getMember(pkMessage.member.id);
        if (memberData) {
          this.model.cacheMember(memberData.id, memberData.system, {
            name: memberData.name,
            displayName: memberData.display_name,
            avatarUrl: memberData.avatar_url,
            proxyTags: JSON.stringify(memberData.proxy_tags),
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error detecting/caching PluralKit message:", error);
      return false;
    }
  }

  /**
   * Get member info for a message (from cache or API)
   */
  async getMemberInfo(messageId: string): Promise<{
    system: { id: string; name: string | null } | null;
    member: { id: string; name: string; displayName: string | null } | null;
  } | null> {
    try {
      const pkMessage = await this.api.getMessage(messageId);

      if (!pkMessage) {
        return null;
      }

      return {
        system: pkMessage.system
          ? {
              id: pkMessage.system.id,
              name: pkMessage.system.name,
            }
          : null,
        member: pkMessage.member
          ? {
              id: pkMessage.member.id,
              name: pkMessage.member.name,
              displayName: null, // Not included in message response
            }
          : null,
      };
    } catch (error) {
      console.error("Error getting PluralKit member info:", error);
      return null;
    }
  }

  /**
   * Get cached member by ID
   */
  getCachedMember(memberId: string) {
    return this.model.getMember(memberId);
  }

  /**
   * Get cached system by ID
   */
  getCachedSystem(systemId: string) {
    return this.model.getSystem(systemId);
  }

  /**
   * Clear expired cache
   */
  clearExpiredCache() {
    this.model.clearExpiredCache();
  }
}
