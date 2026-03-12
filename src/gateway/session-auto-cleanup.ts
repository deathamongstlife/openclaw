/**
 * Automated session cleanup for cron, hook, and subagent sessions.
 * These sessions accumulate over time and should be cleaned up after they complete.
 */

import { loadConfig } from "../config/config.js";
import {
  loadSessionStore,
  updateSessionStore,
  type SessionEntry,
} from "../config/sessions.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  archiveSessionTranscriptsForSession,
  emitSessionUnboundLifecycleEvent,
} from "./session-reset-service.js";
import { resolveGatewaySessionStoreTarget } from "./session-utils.js";

const log = createSubsystemLogger("session-cleanup");

// Sessions older than this without activity are eligible for cleanup
const AUTO_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Maximum number of automated sessions to clean per cycle
const MAX_CLEANUP_PER_CYCLE = 50;

type AutomatedSessionKind = "cron" | "hook" | "subagent" | "node";

function getSessionKind(sessionKey: string): AutomatedSessionKind | null {
  if (sessionKey.startsWith("cron:")) {
    return "cron";
  }
  if (sessionKey.startsWith("hook:")) {
    return "hook";
  }
  if (sessionKey.startsWith("node-") || sessionKey.startsWith("node:")) {
    return "node";
  }
  // CRITICAL FIX (#43193): Enhanced subagent session detection.
  // Subagent sessions are spawned sessions that contain a parent reference.
  // Detect sessions with spawn metadata or non-main agent sessions.
  if (sessionKey.includes(":") && !sessionKey.startsWith("agent:main:")) {
    return "subagent";
  }
  // Additional subagent patterns: sessions created via sessions_spawn
  if (sessionKey.includes(":spawn:") || sessionKey.includes("-spawned-")) {
    return "subagent";
  }
  return null;
}

function isEligibleForAutoCleanup(
  sessionKey: string,
  entry: SessionEntry,
  now: number,
): boolean {
  const kind = getSessionKind(sessionKey);
  if (!kind) {
    return false;
  }

  // Don't clean up sessions that were recently updated
  const age = entry.updatedAt ? now - entry.updatedAt : 0;
  if (age < AUTO_SESSION_TTL_MS) {
    return false;
  }

  // CRITICAL FIX (#43193): Additional heuristics for zombie session detection
  // 1. Sessions that never sent a system prompt (never initialized)
  if (!entry.systemSent) {
    return true;
  }

  // 2. Sessions with no message history (empty/stalled)
  if (entry.messageCount !== undefined && entry.messageCount === 0) {
    return true;
  }

  // 3. Cron/hook sessions should always be cleaned up if they're old enough
  // (they're ephemeral by nature)
  if (kind === "cron" || kind === "hook") {
    return true;
  }

  return true;
}

/**
 * Clean up stale automated sessions (cron, hooks, subagents).
 * Returns the number of sessions cleaned up.
 */
export async function cleanupAutomatedSessions(): Promise<{
  cleaned: number;
  errors: number;
}> {
  const cfg = loadConfig();
  const now = Date.now();
  let cleaned = 0;
  let errors = 0;

  try {
    // Load all session stores for all agents
    const storeTargets = new Map<string, string>();
    const storeCache = new Map<string, Record<string, SessionEntry>>();

    // Iterate through all sessions and find eligible automated sessions
    const eligibleSessions: Array<{
      key: string;
      storePath: string;
      entry: SessionEntry;
    }> = [];

    // For now, we'll scan the main agent's session store
    // TODO: Extend to scan all agent session stores
    const mainTarget = resolveGatewaySessionStoreTarget({ cfg, key: "agent:main:main" });
    const mainStore = loadSessionStore(mainTarget.storePath);

    for (const [sessionKey, entry] of Object.entries(mainStore)) {
      if (isEligibleForAutoCleanup(sessionKey, entry, now)) {
        eligibleSessions.push({
          key: sessionKey,
          storePath: mainTarget.storePath,
          entry,
        });
      }
    }

    // Limit cleanup per cycle to avoid long-running operations
    const toClean = eligibleSessions.slice(0, MAX_CLEANUP_PER_CYCLE);

    if (toClean.length > 0) {
      log.info(
        `Found ${eligibleSessions.length} eligible automated sessions for cleanup (processing ${toClean.length} this cycle)`,
      );
    }

    // Clean up each session
    for (const { key, storePath, entry } of toClean) {
      try {
        // Archive transcripts if they exist
        if (entry.sessionId) {
          const target = resolveGatewaySessionStoreTarget({ cfg, key });
          const archived = archiveSessionTranscriptsForSession({
            sessionId: entry.sessionId,
            storePath,
            sessionFile: entry.sessionFile,
            agentId: target.agentId,
            reason: "deleted",
          });

          if (archived.length > 0) {
            log.info(`Archived ${archived.length} transcript(s) for automated session: ${key}`);
          }
        }

        // Remove from session store
        await updateSessionStore(storePath, (store) => {
          delete store[key];
          return undefined;
        });

        // Emit lifecycle event for cleanup hooks
        await emitSessionUnboundLifecycleEvent({
          targetSessionKey: key,
          reason: "session-delete",
          emitHooks: true,
        });

        cleaned++;
        log.info(`Cleaned up automated session: ${key}`);
      } catch (err) {
        errors++;
        log.warn(`Failed to clean up automated session ${key}: ${String(err)}`);
      }
    }

    if (cleaned > 0) {
      log.info(`Automated session cleanup complete: cleaned=${cleaned} errors=${errors}`);
    }

    return { cleaned, errors };
  } catch (err) {
    log.error(`Automated session cleanup failed: ${String(err)}`);
    return { cleaned, errors: errors + 1 };
  }
}

/**
 * Start periodic cleanup of automated sessions.
 * Returns a function to stop the cleanup timer.
 */
export function startAutomatedSessionCleanup(params: {
  intervalMs?: number;
}): () => void {
  const intervalMs = params.intervalMs ?? 60 * 60 * 1000; // Default: 1 hour

  log.info(`Starting automated session cleanup (interval: ${intervalMs}ms)`);

  const timer = setInterval(() => {
    void cleanupAutomatedSessions().catch((err) => {
      log.error(`Automated session cleanup error: ${String(err)}`);
    });
  }, intervalMs);

  // Run cleanup once on startup (after a short delay)
  setTimeout(() => {
    void cleanupAutomatedSessions().catch((err) => {
      log.error(`Initial automated session cleanup error: ${String(err)}`);
    });
  }, 30_000); // 30 seconds after startup

  return () => {
    clearInterval(timer);
    log.info("Stopped automated session cleanup");
  };
}
