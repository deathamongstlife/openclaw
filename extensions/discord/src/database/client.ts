import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Try to import better-sqlite3, but don't fail if it's not available
let Database: typeof import("better-sqlite3").default | null = null;
let sqliteAvailable = false;

try {
  const mod = await import("better-sqlite3");
  Database = mod.default;
  sqliteAvailable = true;
} catch {
  // better-sqlite3 not available - will use JSON fallback
  sqliteAvailable = false;
}

type DatabaseType = Database extends null ? never : ReturnType<typeof Database>;

let db: DatabaseType | null = null;

/**
 * Check if SQLite is available
 */
export function isSQLiteAvailable(): boolean {
  return sqliteAvailable;
}

/**
 * Get the database directory path
 */
export function getDbPath(): string {
  const jarvisDir = join(homedir(), ".jarvis", "discord");
  return join(jarvisDir, "bot.db");
}

/**
 * Initialize and return the database connection
 * Returns null if SQLite is not available
 */
export function getDatabase(): DatabaseType | null {
  if (!sqliteAvailable || !Database) {
    return null;
  }

  if (db) {
    return db;
  }

  const dbPath = getDbPath();
  const jarvisDir = join(homedir(), ".jarvis", "discord");

  // Ensure directory exists
  if (!existsSync(jarvisDir)) {
    mkdirSync(jarvisDir, { recursive: true });
  }

  // Create database connection
  db = new Database(dbPath) as DatabaseType;

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");

  // Note: Migrations are skipped for now to avoid async complexity
  // They should be run manually if needed via a separate initialization script

  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Execute a function within a transaction
 * Returns null if SQLite is not available
 */
export function transaction<T>(fn: (db: DatabaseType) => T): T | null {
  const database = getDatabase();
  if (!database) {
    return null;
  }
  const txn = database.transaction(fn);
  return txn(database);
}
