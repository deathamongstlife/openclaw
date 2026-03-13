import type Database from "better-sqlite3";
import { getDatabase } from "../client.js";

export interface PKSystem {
  systemId: string;
  name: string | null;
  tag: string | null;
  avatarUrl: string | null;
  cachedAt: number;
}

export interface PKMember {
  memberId: string;
  systemId: string;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  proxyTags: string | null; // JSON string
  cachedAt: number;
}

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export class PluralKitModel {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Cache a PluralKit system
   */
  cacheSystem(systemId: string, data: Omit<PKSystem, "systemId" | "cachedAt">): void {
    const now = Date.now();

    this.db
      .prepare(
        `INSERT OR REPLACE INTO pluralkit_systems (system_id, name, tag, avatar_url, cached_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(systemId, data.name, data.tag, data.avatarUrl, now);
  }

  /**
   * Get a cached system
   */
  getSystem(systemId: string): PKSystem | null {
    const row = this.db
      .prepare(
        `SELECT system_id as systemId, name, tag, avatar_url as avatarUrl, cached_at as cachedAt FROM pluralkit_systems WHERE system_id = ?`,
      )
      .get(systemId) as PKSystem | undefined;

    if (!row) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - row.cachedAt > CACHE_TTL) {
      return null;
    }

    return row;
  }

  /**
   * Cache a PluralKit member
   */
  cacheMember(
    memberId: string,
    systemId: string,
    data: Omit<PKMember, "memberId" | "systemId" | "cachedAt">,
  ): void {
    const now = Date.now();

    this.db
      .prepare(
        `INSERT OR REPLACE INTO pluralkit_members (member_id, system_id, name, display_name, avatar_url, proxy_tags, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(memberId, systemId, data.name, data.displayName, data.avatarUrl, data.proxyTags, now);
  }

  /**
   * Get a cached member
   */
  getMember(memberId: string): PKMember | null {
    const row = this.db
      .prepare(
        `SELECT member_id as memberId, system_id as systemId, name, display_name as displayName, avatar_url as avatarUrl, proxy_tags as proxyTags, cached_at as cachedAt FROM pluralkit_members WHERE member_id = ?`,
      )
      .get(memberId) as PKMember | undefined;

    if (!row) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - row.cachedAt > CACHE_TTL) {
      return null;
    }

    return row;
  }

  /**
   * Get all members for a system
   */
  getSystemMembers(systemId: string): PKMember[] {
    const rows = this.db
      .prepare(
        `SELECT member_id as memberId, system_id as systemId, name, display_name as displayName, avatar_url as avatarUrl, proxy_tags as proxyTags, cached_at as cachedAt FROM pluralkit_members WHERE system_id = ?`,
      )
      .all(systemId) as PKMember[];

    const now = Date.now();
    return rows.filter((row) => now - row.cachedAt <= CACHE_TTL);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const cutoff = Date.now() - CACHE_TTL;

    this.db.prepare(`DELETE FROM pluralkit_systems WHERE cached_at < ?`).run(cutoff);

    this.db.prepare(`DELETE FROM pluralkit_members WHERE cached_at < ?`).run(cutoff);
  }
}
