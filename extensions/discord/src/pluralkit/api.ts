/**
 * PluralKit API v2 client
 * API docs: https://pluralkit.me/api/
 */

const PLURALKIT_API_BASE = "https://api.pluralkit.me/v2";

export interface PKSystemResponse {
  id: string;
  uuid: string;
  name: string | null;
  tag: string | null;
  avatar_url: string | null;
  banner: string | null;
  description: string | null;
  created: string;
}

export interface PKMemberResponse {
  id: string;
  uuid: string;
  system: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  banner: string | null;
  description: string | null;
  pronouns: string | null;
  color: string | null;
  birthday: string | null;
  proxy_tags: Array<{
    prefix: string | null;
    suffix: string | null;
  }>;
  created: string;
}

export interface PKMessageResponse {
  timestamp: string;
  id: string;
  original: string;
  sender: string;
  channel: string;
  system?: {
    id: string;
    uuid: string;
    name: string | null;
    avatar_url: string | null;
  };
  member?: {
    id: string;
    uuid: string;
    name: string;
    avatar_url: string | null;
  };
}

export class PluralKitAPI {
  private baseUrl: string;

  constructor(baseUrl: string = PLURALKIT_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get message info from PluralKit
   */
  async getMessage(messageId: string): Promise<PKMessageResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}`);

      if (response.status === 404) {
        return null; // Not a PK message
      }

      if (!response.ok) {
        throw new Error(`PluralKit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch PluralKit message:", error);
      return null;
    }
  }

  /**
   * Get system info
   */
  async getSystem(systemId: string): Promise<PKSystemResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/systems/${systemId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`PluralKit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch PluralKit system:", error);
      return null;
    }
  }

  /**
   * Get member info
   */
  async getMember(memberId: string): Promise<PKMemberResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/members/${memberId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`PluralKit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch PluralKit member:", error);
      return null;
    }
  }

  /**
   * Get all members in a system
   */
  async getSystemMembers(systemId: string): Promise<PKMemberResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/systems/${systemId}/members`);

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`PluralKit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch PluralKit system members:", error);
      return [];
    }
  }
}
