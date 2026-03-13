import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { getDatabase } from "../client.js";

export interface UserWarning {
  id: string;
  userId: string;
  guildId: string;
  moderatorId: string;
  reason: string;
  timestamp: number;
  active: boolean;
}

export type ModerationType = "warn" | "kick" | "ban" | "timeout" | "unban" | "mute" | "unmute";

export interface ModerationAction {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  type: ModerationType;
  reason: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class ModerationModel {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Add a warning
   */
  addWarning(guildId: string, userId: string, moderatorId: string, reason: string): UserWarning {
    const id = randomUUID();
    const timestamp = Date.now();

    this.db
      .prepare(
        `INSERT INTO user_warnings (id, user_id, guild_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, userId, guildId, moderatorId, reason, timestamp);

    return {
      id,
      userId,
      guildId,
      moderatorId,
      reason,
      timestamp,
      active: true,
    };
  }

  /**
   * Get warnings for a user
   */
  getWarnings(guildId: string, userId: string, activeOnly = true): UserWarning[] {
    const query = activeOnly
      ? `SELECT id, user_id as userId, guild_id as guildId, moderator_id as moderatorId, reason, timestamp, active FROM user_warnings WHERE guild_id = ? AND user_id = ? AND active = 1 ORDER BY timestamp DESC`
      : `SELECT id, user_id as userId, guild_id as guildId, moderator_id as moderatorId, reason, timestamp, active FROM user_warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC`;

    const rows = this.db.prepare(query).all(guildId, userId) as Array<
      Omit<UserWarning, "active"> & { active: number }
    >;

    return rows.map((row) => ({
      ...row,
      active: Boolean(row.active),
    }));
  }

  /**
   * Get warning count for a user
   */
  getWarningCount(guildId: string, userId: string): number {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM user_warnings WHERE guild_id = ? AND user_id = ? AND active = 1`,
      )
      .get(guildId, userId) as { count: number };

    return row.count;
  }

  /**
   * Clear a warning
   */
  clearWarning(warningId: string): boolean {
    const result = this.db
      .prepare(`UPDATE user_warnings SET active = 0 WHERE id = ?`)
      .run(warningId);

    return result.changes > 0;
  }

  /**
   * Clear all warnings for a user
   */
  clearAllWarnings(guildId: string, userId: string): number {
    const result = this.db
      .prepare(`UPDATE user_warnings SET active = 0 WHERE guild_id = ? AND user_id = ?`)
      .run(guildId, userId);

    return result.changes;
  }

  /**
   * Log a moderation action
   */
  logAction(
    guildId: string,
    userId: string,
    moderatorId: string,
    type: ModerationType,
    reason: string,
    duration?: number,
    metadata?: Record<string, unknown>,
  ): ModerationAction {
    const id = randomUUID();
    const timestamp = Date.now();

    this.db
      .prepare(
        `INSERT INTO moderation_actions (id, guild_id, user_id, moderator_id, type, reason, timestamp, duration, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        guildId,
        userId,
        moderatorId,
        type,
        reason,
        timestamp,
        duration ?? null,
        metadata ? JSON.stringify(metadata) : null,
      );

    return {
      id,
      guildId,
      userId,
      moderatorId,
      type,
      reason,
      timestamp,
      duration,
      metadata,
    };
  }

  /**
   * Get moderation actions for a user
   */
  getUserActions(guildId: string, userId: string, limit = 10): ModerationAction[] {
    const rows = this.db
      .prepare(
        `SELECT id, guild_id as guildId, user_id as userId, moderator_id as moderatorId, type, reason, timestamp, duration, metadata FROM moderation_actions WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC LIMIT ?`,
      )
      .all(guildId, userId, limit) as Array<
      Omit<ModerationAction, "metadata"> & { metadata: string | null }
    >;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Get recent moderation actions
   */
  getRecentActions(guildId: string, limit = 20): ModerationAction[] {
    const rows = this.db
      .prepare(
        `SELECT id, guild_id as guildId, user_id as userId, moderator_id as moderatorId, type, reason, timestamp, duration, metadata FROM moderation_actions WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?`,
      )
      .all(guildId, limit) as Array<
      Omit<ModerationAction, "metadata"> & { metadata: string | null }
    >;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Get moderation actions by type
   */
  getActionsByType(guildId: string, type: ModerationType, limit = 10): ModerationAction[] {
    const rows = this.db
      .prepare(
        `SELECT id, guild_id as guildId, user_id as userId, moderator_id as moderatorId, type, reason, timestamp, duration, metadata FROM moderation_actions WHERE guild_id = ? AND type = ? ORDER BY timestamp DESC LIMIT ?`,
      )
      .all(guildId, type, limit) as Array<
      Omit<ModerationAction, "metadata"> & { metadata: string | null }
    >;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }
}
