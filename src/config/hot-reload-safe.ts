/**
 * Safe hot reload with validation and rollback
 * Addresses issue #43299 - Hot reload breaks on syntax errors
 */

import type { JarvisConfig } from "./types.js";
import { validateConfigRelaxed, type ValidationResult } from "./validation-relaxed.js";

export type HotReloadState = {
  currentConfig: JarvisConfig;
  previousConfig: JarvisConfig | null;
  pendingConfig: JarvisConfig | null;
  reloadInProgress: boolean;
  lastReloadTime: number;
  reloadCount: number;
  failedReloadCount: number;
};

export type HotReloadResult = {
  success: boolean;
  applied: boolean;
  validation: ValidationResult;
  error?: string;
  rolledBack: boolean;
};

/**
 * Validate config before reload
 */
function validateConfigForReload(config: unknown): ValidationResult {
  const result = validateConfigRelaxed(config);

  if (!result.valid) {
    return result;
  }

  return result;
}

/**
 * Create config snapshot for rollback
 */
function createConfigSnapshot(config: JarvisConfig): JarvisConfig {
  return JSON.parse(JSON.stringify(config)) as JarvisConfig;
}

/**
 * Attempt to apply config changes
 */
export async function applyConfigHotReload(
  state: HotReloadState,
  newConfig: unknown,
  onApply: (config: JarvisConfig) => Promise<void>,
): Promise<HotReloadResult> {
  if (state.reloadInProgress) {
    return {
      success: false,
      applied: false,
      validation: {
        valid: false,
        errors: [{ path: "", message: "Reload already in progress" }],
        warnings: [],
      },
      rolledBack: false,
    };
  }

  state.reloadInProgress = true;

  try {
    const validation = validateConfigForReload(newConfig);

    if (!validation.valid) {
      state.failedReloadCount++;
      return {
        success: false,
        applied: false,
        validation,
        error: "Config validation failed",
        rolledBack: false,
      };
    }

    state.previousConfig = createConfigSnapshot(state.currentConfig);
    state.pendingConfig = newConfig as JarvisConfig;

    try {
      await onApply(state.pendingConfig);

      state.currentConfig = state.pendingConfig;
      state.pendingConfig = null;
      state.lastReloadTime = Date.now();
      state.reloadCount++;

      return {
        success: true,
        applied: true,
        validation,
        rolledBack: false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (state.previousConfig) {
        try {
          await onApply(state.previousConfig);

          state.currentConfig = state.previousConfig;
          state.pendingConfig = null;
          state.failedReloadCount++;

          return {
            success: false,
            applied: false,
            validation,
            error: `Config application failed: ${errorMessage}. Rolled back to previous config.`,
            rolledBack: true,
          };
        } catch (rollbackErr) {
          const rollbackMessage =
            rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);

          return {
            success: false,
            applied: false,
            validation,
            error: `Config application failed: ${errorMessage}. Rollback also failed: ${rollbackMessage}`,
            rolledBack: false,
          };
        }
      }

      state.failedReloadCount++;

      return {
        success: false,
        applied: false,
        validation,
        error: `Config application failed: ${errorMessage}`,
        rolledBack: false,
      };
    }
  } finally {
    state.reloadInProgress = false;
  }
}

/**
 * Initialize hot reload state
 */
export function initializeHotReloadState(config: JarvisConfig): HotReloadState {
  return {
    currentConfig: config,
    previousConfig: null,
    pendingConfig: null,
    reloadInProgress: false,
    lastReloadTime: Date.now(),
    reloadCount: 0,
    failedReloadCount: 0,
  };
}

/**
 * Get config diff
 */
export function getConfigDiff(
  oldConfig: JarvisConfig,
  newConfig: JarvisConfig,
): string[] {
  const changes: string[] = [];

  function compareObjects(
    old: Record<string, unknown>,
    next: Record<string, unknown>,
    path = "",
  ) {
    const allKeys = new Set([...Object.keys(old), ...Object.keys(next)]);

    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      const oldValue = old[key];
      const nextValue = next[key];

      if (oldValue === nextValue) {
        continue;
      }

      if (oldValue === undefined) {
        changes.push(`+ ${keyPath}`);
      } else if (nextValue === undefined) {
        changes.push(`- ${keyPath}`);
      } else if (
        typeof oldValue === "object" &&
        typeof nextValue === "object" &&
        oldValue !== null &&
        nextValue !== null &&
        !Array.isArray(oldValue) &&
        !Array.isArray(nextValue)
      ) {
        compareObjects(
          oldValue as Record<string, unknown>,
          nextValue as Record<string, unknown>,
          keyPath,
        );
      } else {
        changes.push(`~ ${keyPath}`);
      }
    }
  }

  compareObjects(oldConfig as unknown as Record<string, unknown>, newConfig as unknown as Record<string, unknown>);

  return changes;
}

/**
 * Check if reload is safe (no breaking changes)
 */
export function isReloadSafe(oldConfig: JarvisConfig, newConfig: JarvisConfig): boolean {
  const breakingChanges = [
    "gateway.port",
    "gateway.bind",
    "gateway.tls",
    "gateway.auth",
  ];

  const changes = getConfigDiff(oldConfig, newConfig);

  for (const change of changes) {
    const changePath = change.substring(2);
    if (breakingChanges.some((breaking) => changePath.startsWith(breaking))) {
      return false;
    }
  }

  return true;
}
