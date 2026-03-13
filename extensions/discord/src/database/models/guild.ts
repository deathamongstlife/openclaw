import type Database from "better-sqlite3";
import { getDatabase } from "../client.js";

export interface Guild {
  guildId: string;
  name: string | null;
  prefix: string | null;
  language: string;
  timezone: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuildModules {
  guildId: string;
  moderation: boolean;
  automod: boolean;
  logging: boolean;
  welcome: boolean;
  autorole: boolean;
  music: boolean;
  utility: boolean;
  fun: boolean;
  analytics: boolean;
  economy: boolean;
  automation: boolean;
}

export interface GuildSettings {
  guildId: string;
  welcomeMessage: string | null;
  welcomeChannel: string | null;
  logChannel: string | null;
  modLogChannel: string | null;
  musicChannel: string | null;
  djRole: string | null;
}

export interface GuildAutomod {
  guildId: string;
  antiSpam: boolean;
  linkFilter: boolean;
  inviteFilter: boolean;
  mentionLimit: number;
  maxMessages: number;
  maxMessagesWindow: number;
}

export class GuildModel {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDatabase();
  }

  /**
   * Get or create a guild
   */
  getOrCreate(guildId: string, name?: string): Guild {
    let guild = this.get(guildId);

    if (!guild) {
      const now = Date.now();
      this.db
        .prepare(`INSERT INTO guilds (guild_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`)
        .run(guildId, name ?? null, now, now);

      // Create default modules
      this.db.prepare(`INSERT INTO guild_modules (guild_id) VALUES (?)`).run(guildId);

      // Create default settings
      this.db.prepare(`INSERT INTO guild_settings (guild_id) VALUES (?)`).run(guildId);

      // Create default automod
      this.db.prepare(`INSERT INTO guild_automod (guild_id) VALUES (?)`).run(guildId);

      guild = this.get(guildId)!;
    }

    return guild;
  }

  /**
   * Get a guild by ID
   */
  get(guildId: string): Guild | null {
    const row = this.db
      .prepare(
        `SELECT guild_id as guildId, name, prefix, language, timezone, created_at as createdAt, updated_at as updatedAt FROM guilds WHERE guild_id = ?`,
      )
      .get(guildId) as Guild | undefined;

    return row ?? null;
  }

  /**
   * Update guild name
   */
  updateName(guildId: string, name: string): void {
    this.db
      .prepare(`UPDATE guilds SET name = ?, updated_at = ? WHERE guild_id = ?`)
      .run(name, Date.now(), guildId);
  }

  /**
   * Update guild prefix
   */
  updatePrefix(guildId: string, prefix: string | null): void {
    this.db
      .prepare(`UPDATE guilds SET prefix = ?, updated_at = ? WHERE guild_id = ?`)
      .run(prefix, Date.now(), guildId);
  }

  /**
   * Get guild modules
   */
  getModules(guildId: string): GuildModules {
    const row = this.db
      .prepare(
        `SELECT guild_id as guildId, moderation, automod, logging, welcome, autorole, music, utility, fun, analytics, economy, automation FROM guild_modules WHERE guild_id = ?`,
      )
      .get(guildId) as Record<string, string | number> | undefined;

    if (!row) {
      // Return defaults
      return {
        guildId,
        moderation: true,
        automod: false,
        logging: false,
        welcome: false,
        autorole: false,
        music: false,
        utility: true,
        fun: true,
        analytics: false,
        economy: false,
        automation: false,
      };
    }

    return {
      guildId: row.guildId as string,
      moderation: Boolean(row.moderation),
      automod: Boolean(row.automod),
      logging: Boolean(row.logging),
      welcome: Boolean(row.welcome),
      autorole: Boolean(row.autorole),
      music: Boolean(row.music),
      utility: Boolean(row.utility),
      fun: Boolean(row.fun),
      analytics: Boolean(row.analytics),
      economy: Boolean(row.economy),
      automation: Boolean(row.automation),
    };
  }

  /**
   * Update a guild module state
   */
  updateModule(
    guildId: string,
    module: keyof Omit<GuildModules, "guildId">,
    enabled: boolean,
  ): void {
    this.db
      .prepare(`UPDATE guild_modules SET ${module} = ? WHERE guild_id = ?`)
      .run(enabled ? 1 : 0, guildId);
  }

  /**
   * Get guild settings
   */
  getSettings(guildId: string): GuildSettings {
    const row = this.db
      .prepare(
        `SELECT guild_id as guildId, welcome_message as welcomeMessage, welcome_channel as welcomeChannel, log_channel as logChannel, mod_log_channel as modLogChannel, music_channel as musicChannel, dj_role as djRole FROM guild_settings WHERE guild_id = ?`,
      )
      .get(guildId) as GuildSettings | undefined;

    return (
      row ?? {
        guildId,
        welcomeMessage: null,
        welcomeChannel: null,
        logChannel: null,
        modLogChannel: null,
        musicChannel: null,
        djRole: null,
      }
    );
  }

  /**
   * Update guild settings
   */
  updateSettings(guildId: string, settings: Partial<Omit<GuildSettings, "guildId">>): void {
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updates.push(`${snakeKey} = ?`);
      values.push(value);
    }

    if (updates.length > 0) {
      values.push(guildId);
      this.db
        .prepare(`UPDATE guild_settings SET ${updates.join(", ")} WHERE guild_id = ?`)
        .run(...values);
    }
  }

  /**
   * Get guild automod settings
   */
  getAutomod(guildId: string): GuildAutomod {
    const row = this.db
      .prepare(
        `SELECT guild_id as guildId, anti_spam as antiSpam, link_filter as linkFilter, invite_filter as inviteFilter, mention_limit as mentionLimit, max_messages as maxMessages, max_messages_window as maxMessagesWindow FROM guild_automod WHERE guild_id = ?`,
      )
      .get(guildId) as Record<string, string | number> | undefined;

    if (!row) {
      return {
        guildId,
        antiSpam: false,
        linkFilter: false,
        inviteFilter: false,
        mentionLimit: 10,
        maxMessages: 5,
        maxMessagesWindow: 5000,
      };
    }

    return {
      guildId: row.guildId as string,
      antiSpam: Boolean(row.antiSpam),
      linkFilter: Boolean(row.linkFilter),
      inviteFilter: Boolean(row.inviteFilter),
      mentionLimit: Number(row.mentionLimit),
      maxMessages: Number(row.maxMessages),
      maxMessagesWindow: Number(row.maxMessagesWindow),
    };
  }

  /**
   * Update guild automod settings
   */
  updateAutomod(guildId: string, settings: Partial<Omit<GuildAutomod, "guildId">>): void {
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updates.push(`${snakeKey} = ?`);
      values.push(typeof value === "boolean" ? (value ? 1 : 0) : value);
    }

    if (updates.length > 0) {
      values.push(guildId);
      this.db
        .prepare(`UPDATE guild_automod SET ${updates.join(", ")} WHERE guild_id = ?`)
        .run(...values);
    }
  }

  /**
   * Get mod roles for a guild
   */
  getModRoles(guildId: string): string[] {
    const rows = this.db
      .prepare(`SELECT role_id FROM guild_mod_roles WHERE guild_id = ?`)
      .all(guildId) as Array<{ role_id: string }>;

    return rows.map((r) => r.role_id);
  }

  /**
   * Add a mod role
   */
  addModRole(guildId: string, roleId: string): void {
    try {
      this.db
        .prepare(`INSERT INTO guild_mod_roles (guild_id, role_id) VALUES (?, ?)`)
        .run(guildId, roleId);
    } catch {
      // Already exists
    }
  }

  /**
   * Remove a mod role
   */
  removeModRole(guildId: string, roleId: string): void {
    this.db
      .prepare(`DELETE FROM guild_mod_roles WHERE guild_id = ? AND role_id = ?`)
      .run(guildId, roleId);
  }

  /**
   * Get auto roles for a guild
   */
  getAutoRoles(guildId: string): string[] {
    const rows = this.db
      .prepare(`SELECT role_id FROM guild_auto_roles WHERE guild_id = ?`)
      .all(guildId) as Array<{ role_id: string }>;

    return rows.map((r) => r.role_id);
  }

  /**
   * Add an auto role
   */
  addAutoRole(guildId: string, roleId: string): void {
    try {
      this.db
        .prepare(`INSERT INTO guild_auto_roles (guild_id, role_id) VALUES (?, ?)`)
        .run(guildId, roleId);
    } catch {
      // Already exists
    }
  }

  /**
   * Remove an auto role
   */
  removeAutoRole(guildId: string, roleId: string): void {
    this.db
      .prepare(`DELETE FROM guild_auto_roles WHERE guild_id = ? AND role_id = ?`)
      .run(guildId, roleId);
  }

  /**
   * Get bad words for a guild
   */
  getBadWords(guildId: string): string[] {
    const rows = this.db
      .prepare(`SELECT word FROM guild_bad_words WHERE guild_id = ?`)
      .all(guildId) as Array<{ word: string }>;

    return rows.map((r) => r.word);
  }

  /**
   * Add a bad word
   */
  addBadWord(guildId: string, word: string): void {
    try {
      this.db
        .prepare(`INSERT INTO guild_bad_words (guild_id, word) VALUES (?, ?)`)
        .run(guildId, word.toLowerCase());
    } catch {
      // Already exists
    }
  }

  /**
   * Remove a bad word
   */
  removeBadWord(guildId: string, word: string): void {
    this.db
      .prepare(`DELETE FROM guild_bad_words WHERE guild_id = ? AND word = ?`)
      .run(guildId, word.toLowerCase());
  }

  /**
   * Get allowed domains for a guild
   */
  getAllowedDomains(guildId: string): string[] {
    const rows = this.db
      .prepare(`SELECT domain FROM guild_allowed_domains WHERE guild_id = ?`)
      .all(guildId) as Array<{ domain: string }>;

    return rows.map((r) => r.domain);
  }

  /**
   * Add an allowed domain
   */
  addAllowedDomain(guildId: string, domain: string): void {
    try {
      this.db
        .prepare(`INSERT INTO guild_allowed_domains (guild_id, domain) VALUES (?, ?)`)
        .run(guildId, domain.toLowerCase());
    } catch {
      // Already exists
    }
  }

  /**
   * Remove an allowed domain
   */
  removeAllowedDomain(guildId: string, domain: string): void {
    this.db
      .prepare(`DELETE FROM guild_allowed_domains WHERE guild_id = ? AND domain = ?`)
      .run(guildId, domain.toLowerCase());
  }
}
