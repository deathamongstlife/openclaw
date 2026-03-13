import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { getDatabase } from "../database/client.js";
import type { Intent } from "./intents.js";

export interface ConversationContext {
  id: number;
  guildId: string;
  channelId: string;
  userId: string;
  data: ContextData;
  createdAt: number;
  expiresAt: number;
}

export interface ContextData {
  lastIntent?: Intent;
  lastParameters?: Record<string, unknown>;
  awaitingResponse?: boolean;
  awaitingType?: "confirmation" | "selection" | "input";
  pendingAction?: string;
  metadata?: Record<string, unknown>;
}

export class ConversationContextManager {
  private db: Database.Database;
  private defaultTTL: number = 300000; // 5 minutes

  constructor(db?: Database.Database, ttl?: number) {
    this.db = db ?? getDatabase();
    if (ttl) {
      this.defaultTTL = ttl;
    }
  }

  /**
   * Get context for a conversation
   */
  getContext(guildId: string, channelId: string, userId: string): ConversationContext | null {
    const now = Date.now();

    const row = this.db
      .prepare(
        `SELECT id, guild_id as guildId, channel_id as channelId, user_id as userId, context_data as contextData, created_at as createdAt, expires_at as expiresAt FROM conversation_context WHERE guild_id = ? AND channel_id = ? AND user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(guildId, channelId, userId, now) as
      | (Omit<ConversationContext, "data"> & { contextData: string })
      | undefined;

    if (!row) {
      return null;
    }

    return {
      ...row,
      data: JSON.parse(row.contextData),
    };
  }

  /**
   * Set context for a conversation
   */
  setContext(
    guildId: string,
    channelId: string,
    userId: string,
    data: ContextData,
    ttl?: number,
  ): ConversationContext {
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTTL);

    // Delete any existing context for this conversation
    this.clearContext(guildId, channelId, userId);

    const result = this.db
      .prepare(
        `INSERT INTO conversation_context (guild_id, channel_id, user_id, context_data, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(guildId, channelId, userId, JSON.stringify(data), now, expiresAt);

    return {
      id: result.lastInsertRowid as number,
      guildId,
      channelId,
      userId,
      data,
      createdAt: now,
      expiresAt,
    };
  }

  /**
   * Update existing context
   */
  updateContext(
    guildId: string,
    channelId: string,
    userId: string,
    updates: Partial<ContextData>,
    extendTTL = true,
  ): ConversationContext | null {
    const existing = this.getContext(guildId, channelId, userId);

    if (!existing) {
      return null;
    }

    const updatedData = { ...existing.data, ...updates };
    const expiresAt = extendTTL ? Date.now() + this.defaultTTL : existing.expiresAt;

    this.db
      .prepare(`UPDATE conversation_context SET context_data = ?, expires_at = ? WHERE id = ?`)
      .run(JSON.stringify(updatedData), expiresAt, existing.id);

    return {
      ...existing,
      data: updatedData,
      expiresAt,
    };
  }

  /**
   * Clear context for a conversation
   */
  clearContext(guildId: string, channelId: string, userId: string): void {
    this.db
      .prepare(
        `DELETE FROM conversation_context WHERE guild_id = ? AND channel_id = ? AND user_id = ?`,
      )
      .run(guildId, channelId, userId);
  }

  /**
   * Clean up expired contexts
   */
  cleanExpired(): number {
    const now = Date.now();
    const result = this.db
      .prepare(`DELETE FROM conversation_context WHERE expires_at <= ?`)
      .run(now);

    return result.changes;
  }

  /**
   * Check if user is awaiting a response
   */
  isAwaitingResponse(guildId: string, channelId: string, userId: string): boolean {
    const context = this.getContext(guildId, channelId, userId);
    return context?.data?.awaitingResponse ?? false;
  }

  /**
   * Get the type of response being awaited
   */
  getAwaitingType(
    guildId: string,
    channelId: string,
    userId: string,
  ): "confirmation" | "selection" | "input" | null {
    const context = this.getContext(guildId, channelId, userId);
    return context?.data?.awaitingType ?? null;
  }

  /**
   * Mark that we're awaiting a response
   */
  setAwaiting(
    guildId: string,
    channelId: string,
    userId: string,
    type: "confirmation" | "selection" | "input",
    pendingAction?: string,
    metadata?: Record<string, unknown>,
  ): void {
    const existing = this.getContext(guildId, channelId, userId);

    if (existing) {
      this.updateContext(guildId, channelId, userId, {
        awaitingResponse: true,
        awaitingType: type,
        pendingAction,
        metadata: { ...existing.data.metadata, ...metadata },
      });
    } else {
      this.setContext(guildId, channelId, userId, {
        awaitingResponse: true,
        awaitingType: type,
        pendingAction,
        metadata,
      });
    }
  }

  /**
   * Clear awaiting state
   */
  clearAwaiting(guildId: string, channelId: string, userId: string): void {
    const existing = this.getContext(guildId, channelId, userId);

    if (existing) {
      this.updateContext(guildId, channelId, userId, {
        awaitingResponse: false,
        awaitingType: undefined,
        pendingAction: undefined,
      });
    }
  }
}
