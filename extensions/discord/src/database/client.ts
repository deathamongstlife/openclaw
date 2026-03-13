import { mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.js";

let db: Database.Database | null = null;

/**
 * Get the database directory path
 */
export function getDbPath(): string {
  const jarvisDir = join(homedir(), ".jarvis", "discord");
  return join(jarvisDir, "bot.db");
}

/**
 * Initialize and return the database connection
 */
export function getDatabase(): Database.Database {
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
  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");

  // Run migrations
  runMigrations(db);

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
 */
export function transaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDatabase();
  const txn = database.transaction(fn);
  return txn(database);
}
