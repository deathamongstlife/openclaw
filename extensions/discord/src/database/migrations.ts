import type Database from "better-sqlite3";

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: (db) => {
      // Guilds (servers) configuration
      db.exec(`
        CREATE TABLE IF NOT EXISTS guilds (
          guild_id TEXT PRIMARY KEY,
          name TEXT,
          prefix TEXT DEFAULT NULL,
          language TEXT DEFAULT 'en',
          timezone TEXT DEFAULT 'UTC',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      // Guild modules (feature toggles)
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_modules (
          guild_id TEXT PRIMARY KEY,
          moderation INTEGER DEFAULT 1,
          automod INTEGER DEFAULT 0,
          logging INTEGER DEFAULT 0,
          welcome INTEGER DEFAULT 0,
          autorole INTEGER DEFAULT 0,
          music INTEGER DEFAULT 0,
          utility INTEGER DEFAULT 1,
          fun INTEGER DEFAULT 1,
          analytics INTEGER DEFAULT 0,
          economy INTEGER DEFAULT 0,
          automation INTEGER DEFAULT 0,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
      `);

      // Guild settings
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_settings (
          guild_id TEXT PRIMARY KEY,
          welcome_message TEXT,
          welcome_channel TEXT,
          log_channel TEXT,
          mod_log_channel TEXT,
          music_channel TEXT,
          dj_role TEXT,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
      `);

      // Mod roles
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_mod_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          role_id TEXT NOT NULL,
          UNIQUE(guild_id, role_id),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_mod_roles_guild ON guild_mod_roles(guild_id);
      `);

      // Auto roles
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_auto_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          role_id TEXT NOT NULL,
          UNIQUE(guild_id, role_id),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_auto_roles_guild ON guild_auto_roles(guild_id);
      `);

      // Automod configuration
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_automod (
          guild_id TEXT PRIMARY KEY,
          anti_spam INTEGER DEFAULT 0,
          link_filter INTEGER DEFAULT 0,
          invite_filter INTEGER DEFAULT 0,
          mention_limit INTEGER DEFAULT 10,
          max_messages INTEGER DEFAULT 5,
          max_messages_window INTEGER DEFAULT 5000,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
      `);

      // Automod bad words
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_bad_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          word TEXT NOT NULL,
          UNIQUE(guild_id, word),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_bad_words_guild ON guild_bad_words(guild_id);
      `);

      // Automod allowed domains
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_allowed_domains (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          domain TEXT NOT NULL,
          UNIQUE(guild_id, domain),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_allowed_domains_guild ON guild_allowed_domains(guild_id);
      `);

      // User warnings
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_warnings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          guild_id TEXT NOT NULL,
          moderator_id TEXT NOT NULL,
          reason TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          active INTEGER DEFAULT 1,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_warnings_user ON user_warnings(user_id, guild_id);
        CREATE INDEX IF NOT EXISTS idx_warnings_guild ON user_warnings(guild_id);
      `);

      // Moderation actions log
      db.exec(`
        CREATE TABLE IF NOT EXISTS moderation_actions (
          id TEXT PRIMARY KEY,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          moderator_id TEXT NOT NULL,
          type TEXT NOT NULL,
          reason TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          duration INTEGER,
          metadata TEXT,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_mod_actions_guild ON moderation_actions(guild_id);
        CREATE INDEX IF NOT EXISTS idx_mod_actions_user ON moderation_actions(user_id, guild_id);
        CREATE INDEX IF NOT EXISTS idx_mod_actions_type ON moderation_actions(type);
      `);

      // Event logs
      db.exec(`
        CREATE TABLE IF NOT EXISTS event_logs (
          id TEXT PRIMARY KEY,
          guild_id TEXT NOT NULL,
          type TEXT NOT NULL,
          user_id TEXT,
          channel_id TEXT,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_event_logs_guild ON event_logs(guild_id);
        CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(type);
        CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp);
      `);

      // User profiles
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id TEXT PRIMARY KEY,
          username TEXT,
          timezone TEXT DEFAULT 'UTC',
          locale TEXT DEFAULT 'en',
          ai_personality TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      // Guild members (per-guild user data)
      db.exec(`
        CREATE TABLE IF NOT EXISTS guild_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          joined_at INTEGER NOT NULL,
          message_count INTEGER DEFAULT 0,
          last_active INTEGER,
          UNIQUE(guild_id, user_id),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_members_guild ON guild_members(guild_id);
        CREATE INDEX IF NOT EXISTS idx_members_user ON guild_members(user_id);
      `);

      // PluralKit cache
      db.exec(`
        CREATE TABLE IF NOT EXISTS pluralkit_systems (
          system_id TEXT PRIMARY KEY,
          name TEXT,
          tag TEXT,
          avatar_url TEXT,
          cached_at INTEGER NOT NULL
        );
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS pluralkit_members (
          member_id TEXT PRIMARY KEY,
          system_id TEXT NOT NULL,
          name TEXT NOT NULL,
          display_name TEXT,
          avatar_url TEXT,
          proxy_tags TEXT,
          cached_at INTEGER NOT NULL,
          FOREIGN KEY (system_id) REFERENCES pluralkit_systems(system_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_pk_members_system ON pluralkit_members(system_id);
      `);

      // Music playlists
      db.exec(`
        CREATE TABLE IF NOT EXISTS music_playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          name TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          UNIQUE(guild_id, name),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_playlists_guild ON music_playlists(guild_id);
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS music_playlist_tracks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          playlist_id INTEGER NOT NULL,
          track_url TEXT NOT NULL,
          track_title TEXT,
          track_artist TEXT,
          added_by TEXT NOT NULL,
          added_at INTEGER NOT NULL,
          position INTEGER NOT NULL,
          FOREIGN KEY (playlist_id) REFERENCES music_playlists(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_playlist_tracks ON music_playlist_tracks(playlist_id);
      `);

      // Conversation context
      db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_context (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          context_data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_context_guild_channel ON conversation_context(guild_id, channel_id);
        CREATE INDEX IF NOT EXISTS idx_context_expires ON conversation_context(expires_at);
      `);

      // Reminders
      db.exec(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          remind_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          completed INTEGER DEFAULT 0,
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remind_at, completed);
        CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, completed);
      `);

      // Custom commands/tags
      db.exec(`
        CREATE TABLE IF NOT EXISTS custom_commands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          trigger TEXT NOT NULL,
          response TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          use_count INTEGER DEFAULT 0,
          UNIQUE(guild_id, trigger),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_custom_commands_guild ON custom_commands(guild_id);
      `);

      // Economy (optional)
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_economy (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          balance INTEGER DEFAULT 0,
          bank INTEGER DEFAULT 0,
          last_daily INTEGER,
          UNIQUE(guild_id, user_id),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_economy_guild ON user_economy(guild_id);
        CREATE INDEX IF NOT EXISTS idx_economy_balance ON user_economy(guild_id, balance DESC);
      `);

      // Analytics
      db.exec(`
        CREATE TABLE IF NOT EXISTS message_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          message_count INTEGER DEFAULT 1,
          date TEXT NOT NULL,
          UNIQUE(guild_id, user_id, channel_id, date),
          FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_guild_date ON message_analytics(guild_id, date);
      `);

      // Schema version tracking
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at INTEGER NOT NULL
        );
      `);
    },
  },
];

/**
 * Get the current schema version
 */
function getCurrentVersion(db: Database.Database): number {
  try {
    const row = db.prepare("SELECT MAX(version) as version FROM schema_version").get() as {
      version: number | null;
    };
    return row?.version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: Database.Database): void {
  const currentVersion = getCurrentVersion(db);

  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    return;
  }

  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}: ${migration.name}`);

    const runMigration = db.transaction(() => {
      migration.up(db);
      db.prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)").run(
        migration.version,
        Date.now(),
      );
    });

    runMigration();
    console.log(`Migration ${migration.version} completed`);
  }
}
