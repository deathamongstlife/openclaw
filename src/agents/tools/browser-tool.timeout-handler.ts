/**
 * Browser tool timeout handler with force kill capability
 * Fixes #43324: Browser tool hangs on timeout in sandbox
 */

import { type ChildProcess } from "node:child_process";

export type TimeoutHandlerOptions = {
  /** Timeout in milliseconds before killing the browser */
  timeoutMs: number;
  /** Grace period in milliseconds between SIGTERM and SIGKILL */
  killGracePeriodMs?: number;
  /** Callback when timeout occurs */
  onTimeout?: () => void;
  /** Callback when force kill occurs */
  onForceKill?: () => void;
};

export class BrowserTimeoutHandler {
  private timeoutTimer: NodeJS.Timeout | null = null;
  private killTimer: NodeJS.Timeout | null = null;
  private isTimedOut = false;
  private isForceKilled = false;

  constructor(private readonly options: TimeoutHandlerOptions) {}

  /**
   * Start the timeout timer
   */
  start(): void {
    this.clear();
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.options.timeoutMs);
  }

  /**
   * Clear all timers
   */
  clear(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.killTimer) {
      clearTimeout(this.killTimer);
      this.killTimer = null;
    }
  }

  /**
   * Reset the timeout timer (e.g., on activity)
   */
  reset(): void {
    this.clear();
    this.start();
  }

  /**
   * Check if timeout has occurred
   */
  get timedOut(): boolean {
    return this.isTimedOut;
  }

  /**
   * Check if force kill has occurred
   */
  get forceKilled(): boolean {
    return this.isForceKilled;
  }

  /**
   * Handle timeout - send SIGTERM then schedule SIGKILL
   */
  private handleTimeout(): void {
    if (this.isTimedOut) {
      return;
    }
    this.isTimedOut = true;
    this.options.onTimeout?.();
  }

  /**
   * Kill a process with proper timeout handling
   * First tries SIGTERM, then SIGKILL after grace period
   */
  async killProcess(process: ChildProcess): Promise<void> {
    if (!process.pid) {
      return;
    }

    // Try SIGTERM first
    try {
      process.kill("SIGTERM");
    } catch (err) {
      // Process may already be dead
      return;
    }

    // Wait for graceful shutdown
    const gracePeriod = this.options.killGracePeriodMs ?? 5000;
    await this.waitForExit(process, gracePeriod);

    // Force kill if still alive
    if (!this.isProcessDead(process)) {
      try {
        process.kill("SIGKILL");
        this.isForceKilled = true;
        this.options.onForceKill?.();
      } catch (err) {
        // Process may have died between checks
      }
    }
  }

  /**
   * Wait for process to exit, up to timeout
   */
  private waitForExit(process: ChildProcess, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        resolve();
      };

      process.once("exit", cleanup);
      process.once("error", cleanup);
    });
  }

  /**
   * Check if process is dead
   */
  private isProcessDead(process: ChildProcess): boolean {
    if (!process.pid) {
      return true;
    }
    try {
      // Sending signal 0 checks if process exists without killing it
      process.kill(0);
      return false;
    } catch {
      return true;
    }
  }
}

/**
 * Create a timeout handler with AbortSignal support
 */
export function createBrowserTimeoutWithSignal(
  options: TimeoutHandlerOptions,
): {
  handler: BrowserTimeoutHandler;
  signal: AbortSignal;
  abort: () => void;
} {
  const controller = new AbortController();
  const handler = new BrowserTimeoutHandler({
    ...options,
    onTimeout: () => {
      controller.abort();
      options.onTimeout?.();
    },
  });

  handler.start();

  return {
    handler,
    signal: controller.signal,
    abort: () => controller.abort(),
  };
}
