import type Database from "better-sqlite3";
import { getDatabase } from "../client.js";

export interface UserProfile {
  userId: string;
  username: string | null;
  timezone: string;
  locale: string;
  aiPersonality: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface GuildMember {
  id: number;
  guildId: string;
  userId: string;
  joinedAt: number;
  messageCount: number;
  lastActive: number | null;
}

export class UserModel {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Get or create a user profile
   */
  getOrCreate(userId: string, username?: string): UserProfile {
    let user = this.get(userId);

    if (!user) {
      const now = Date.now();
      this.db
        .prepare(
          `INSERT INTO user_profiles (user_id, username, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        )
        .run(userId, username ?? null, now, now);

      user = this.get(userId)!;
    }

    return user;
  }

  /**
   * Get a user profile by ID
   */
  get(userId: string): UserProfile | null {
    const row = this.db
      .prepare(
        `SELECT user_id as userId, username, timezone, locale, ai_personality as aiPersonality, created_at as createdAt, updated_at as updatedAt FROM user_profiles WHERE user_id = ?`,
      )
      .get(userId) as UserProfile | undefined;

    return row ?? null;
  }

  /**
   * Update user profile
   */
  update(
    userId: string,
    data: Partial<Omit<UserProfile, "userId" | "createdAt" | "updatedAt">>,
  ): void {
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updates.push(`${snakeKey} = ?`);
      values.push(value);
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      values.push(Date.now());
      values.push(userId);

      this.db
        .prepare(`UPDATE user_profiles SET ${updates.join(", ")} WHERE user_id = ?`)
        .run(...values);
    }
  }

  /**
   * Get or create guild member
   */
  getOrCreateMember(guildId: string, userId: string): GuildMember {
    let member = this.getMember(guildId, userId);

    if (!member) {
      // Ensure user profile exists
      this.getOrCreate(userId);

      const now = Date.now();
      this.db
        .prepare(`INSERT INTO guild_members (guild_id, user_id, joined_at) VALUES (?, ?, ?)`)
        .run(guildId, userId, now);

      member = this.getMember(guildId, userId)!;
    }

    return member;
  }

  /**
   * Get guild member
   */
  getMember(guildId: string, userId: string): GuildMember | null {
    const row = this.db
      .prepare(
        `SELECT id, guild_id as guildId, user_id as userId, joined_at as joinedAt, message_count as messageCount, last_active as lastActive FROM guild_members WHERE guild_id = ? AND user_id = ?`,
      )
      .get(guildId, userId) as GuildMember | undefined;

    return row ?? null;
  }

  /**
   * Increment message count for a member
   */
  incrementMessageCount(guildId: string, userId: string): void {
    this.db
      .prepare(
        `UPDATE guild_members SET message_count = message_count + 1, last_active = ? WHERE guild_id = ? AND user_id = ?`,
      )
      .run(Date.now(), guildId, userId);
  }

  /**
   * Update last active timestamp
   */
  updateLastActive(guildId: string, userId: string): void {
    this.db
      .prepare(`UPDATE guild_members SET last_active = ? WHERE guild_id = ? AND user_id = ?`)
      .run(Date.now(), guildId, userId);
  }

  /**
   * Get top members by message count
   */
  getTopMembers(guildId: string, limit = 10): GuildMember[] {
    const rows = this.db
      .prepare(
        `SELECT id, guild_id as guildId, user_id as userId, joined_at as joinedAt, message_count as messageCount, last_active as lastActive FROM guild_members WHERE guild_id = ? ORDER BY message_count DESC LIMIT ?`,
      )
      .all(guildId, limit) as GuildMember[];

    return rows;
  }
}
