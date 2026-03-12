/**
 * Sandbox container cleanup manager
 * Fixes #43242: Sandbox cleanup fails, orphaned containers
 */

import { createSubsystemLogger } from "../../logging/subsystem.js";
import { dockerContainerState, execDocker } from "./docker.js";
import { readBrowserRegistry, updateBrowserRegistry } from "./registry.js";

const logger = createSubsystemLogger("sandbox-cleanup");

export type CleanupOptions = {
  /** Force cleanup even if container is running */
  force?: boolean;
  /** Maximum age in ms for idle containers */
  maxIdleMs?: number;
  /** Cleanup interval in ms */
  cleanupIntervalMs?: number;
  /** Whether to remove volumes */
  removeVolumes?: boolean;
};

const DEFAULT_MAX_IDLE_MS = 600000; // 10 minutes
const DEFAULT_CLEANUP_INTERVAL_MS = 300000; // 5 minutes

export class SandboxCleanupManager {
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private activeContainers = new Set<string>();

  constructor(private readonly options: CleanupOptions = {}) {
    this.setupShutdownHandlers();
  }

  /**
   * Start periodic cleanup
   */
  start(): void {
    if (this.cleanupTimer) {
      return;
    }

    const interval = this.options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;
    logger.info("Starting periodic cleanup", { intervalMs: interval });

    this.cleanupTimer = setInterval(() => {
      this.cleanupOrphanedContainers().catch((err) => {
        logger.error("Periodic cleanup failed", { error: String(err) });
      });
    }, interval);
  }

  /**
   * Stop periodic cleanup
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info("Stopped periodic cleanup");
    }
  }

  /**
   * Track a container as active
   */
  trackContainer(containerName: string): void {
    this.activeContainers.add(containerName);
  }

  /**
   * Untrack a container
   */
  untrackContainer(containerName: string): void {
    this.activeContainers.delete(containerName);
  }

  /**
   * Cleanup orphaned containers
   */
  async cleanupOrphanedContainers(): Promise<void> {
    logger.info("Starting orphaned container cleanup");

    try {
      // Get all jarvis sandbox containers
      const containers = await this.listSandboxContainers();
      logger.info("Found sandbox containers", { count: containers.length });

      const maxIdleMs = this.options.maxIdleMs ?? DEFAULT_MAX_IDLE_MS;
      const now = Date.now();
      let cleanedCount = 0;

      for (const container of containers) {
        try {
          // Skip actively tracked containers
          if (this.activeContainers.has(container.name)) {
            continue;
          }

          // Check if container is idle
          const idleMs = now - container.lastUsedMs;
          if (idleMs < maxIdleMs) {
            continue;
          }

          // Cleanup idle container
          await this.cleanupContainer(container.name, { force: true });
          cleanedCount++;

          logger.info("Cleaned up idle container", {
            name: container.name,
            idleMs,
            maxIdleMs,
          });
        } catch (err) {
          logger.error("Failed to cleanup container", {
            name: container.name,
            error: String(err),
          });
        }
      }

      logger.info("Orphaned container cleanup complete", { cleanedCount });
    } catch (err) {
      logger.error("Orphaned container cleanup failed", { error: String(err) });
      throw err;
    }
  }

  /**
   * Cleanup a specific container
   */
  async cleanupContainer(containerName: string, options: { force?: boolean } = {}): Promise<void> {
    logger.info("Cleaning up container", { name: containerName, force: options.force });

    try {
      // Check if container exists
      const state = await dockerContainerState(containerName);
      if (!state.exists) {
        logger.info("Container does not exist", { name: containerName });
        return;
      }

      // Stop if running
      if (state.running) {
        if (!options.force) {
          logger.warn("Container is running, skipping cleanup", { name: containerName });
          return;
        }
        await this.stopContainer(containerName);
      }

      // Remove container
      await this.removeContainer(containerName);

      // Update registry
      await this.updateRegistryAfterCleanup(containerName);

      // Untrack
      this.untrackContainer(containerName);

      logger.info("Container cleanup complete", { name: containerName });
    } catch (err) {
      logger.error("Container cleanup failed", {
        name: containerName,
        error: String(err),
      });
      throw err;
    }
  }

  /**
   * Cleanup all sandbox containers (for shutdown)
   */
  async cleanupAll(): Promise<void> {
    logger.info("Cleaning up all sandbox containers");

    try {
      const containers = await this.listSandboxContainers();
      logger.info("Found containers to cleanup", { count: containers.length });

      for (const container of containers) {
        try {
          await this.cleanupContainer(container.name, { force: true });
        } catch (err) {
          logger.error("Failed to cleanup container", {
            name: container.name,
            error: String(err),
          });
        }
      }

      logger.info("Cleanup all complete");
    } catch (err) {
      logger.error("Cleanup all failed", { error: String(err) });
      throw err;
    }
  }

  /**
   * Stop a container with timeout
   */
  private async stopContainer(containerName: string, timeoutSec: number = 10): Promise<void> {
    logger.info("Stopping container", { name: containerName, timeoutSec });

    try {
      await execDocker(["stop", "-t", String(timeoutSec), containerName], {
        allowFailure: true,
      });
    } catch {
      logger.warn("Stop failed, forcing kill", { name: containerName });
      await execDocker(["kill", containerName], { allowFailure: true });
    }
  }

  /**
   * Remove a container
   */
  private async removeContainer(containerName: string): Promise<void> {
    logger.info("Removing container", { name: containerName });

    const args = ["rm"];
    if (this.options.force) {
      args.push("-f");
    }
    if (this.options.removeVolumes) {
      args.push("-v");
    }
    args.push(containerName);

    await execDocker(args, { allowFailure: true });
  }

  /**
   * List all sandbox containers
   */
  private async listSandboxContainers(): Promise<Array<{ name: string; lastUsedMs: number }>> {
    const result = await execDocker(
      ["ps", "-a", "--filter", "label=jarvis.sandboxBrowser=1", "--format", "{{.Names}}"],
      { allowFailure: true },
    );

    if (result.code !== 0) {
      return [];
    }

    const names = result.stdout
      .toString("utf8")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Get last used time from registry
    const registry = await readBrowserRegistry();
    const containers = names.map((name) => {
      const entry = registry.entries.find((e) => e.containerName === name);
      return {
        name,
        lastUsedMs: entry?.lastUsedAtMs ?? 0,
      };
    });

    return containers;
  }

  /**
   * Update registry after cleanup
   */
  private async updateRegistryAfterCleanup(containerName: string): Promise<void> {
    try {
      const registry = await readBrowserRegistry();
      const updatedEntries = registry.entries.filter((e) => e.containerName !== containerName);
      await updateBrowserRegistry({
        entries: updatedEntries,
      });
    } catch (err) {
      logger.warn("Failed to update registry after cleanup", { error: String(err) });
    }
  }

  /**
   * Setup shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const handleShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }
      this.isShuttingDown = true;

      logger.info("Received shutdown signal, cleaning up", { signal });
      this.stop();

      try {
        await this.cleanupAll();
      } catch (err) {
        logger.error("Shutdown cleanup failed", { error: String(err) });
      }

      process.exit(0);
    };

    process.once("SIGTERM", () => handleShutdown("SIGTERM"));
    process.once("SIGINT", () => handleShutdown("SIGINT"));
    process.once("beforeExit", () => {
      if (!this.isShuttingDown) {
        handleShutdown("beforeExit").catch(() => {});
      }
    });
  }
}

/**
 * Global cleanup manager instance
 */
let globalCleanupManager: SandboxCleanupManager | null = null;

/**
 * Get or create global cleanup manager
 */
export function getCleanupManager(options?: CleanupOptions): SandboxCleanupManager {
  if (!globalCleanupManager) {
    globalCleanupManager = new SandboxCleanupManager(options);
    globalCleanupManager.start();
  }
  return globalCleanupManager;
}

/**
 * Cleanup a container using the global manager
 */
export async function cleanupSandboxContainer(
  containerName: string,
  options?: { force?: boolean },
): Promise<void> {
  const manager = getCleanupManager();
  await manager.cleanupContainer(containerName, options);
}

/**
 * Track a container using the global manager
 */
export function trackSandboxContainer(containerName: string): void {
  const manager = getCleanupManager();
  manager.trackContainer(containerName);
}

/**
 * Untrack a container using the global manager
 */
export function untrackSandboxContainer(containerName: string): void {
  const manager = getCleanupManager();
  manager.untrackContainer(containerName);
}
