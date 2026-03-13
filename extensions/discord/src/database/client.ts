import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Type for better-sqlite3 Database
type Database = any;
type DatabaseType = any;

let db: DatabaseType | null = null;
let sqliteAvailable: boolean | null = null;

/**
 * Check if SQLite is available
 */
export function isSQLiteAvailable(): boolean {
  if (sqliteAvailable === null) {
    // Lazy check on first call
    try {
      require.resolve("better-sqlite3");
      sqliteAvailable = true;
    } catch {
      sqliteAvailable = false;
    }
  }
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
  if (!isSQLiteAvailable()) {
    return null;
  }

  if (db) {
    return db;
  }

  try {
    // Dynamically require better-sqlite3 only when needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");

    const dbPath = getDbPath();
    const jarvisDir = join(homedir(), ".jarvis", "discord");

    // Ensure directory exists
    if (!existsSync(jarvisDir)) {
      mkdirSync(jarvisDir, { recursive: true });
    }

    // Create database connection
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");

    return db;
  } catch {
    return null;
  }
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
