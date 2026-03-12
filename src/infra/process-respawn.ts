import { spawn } from "node:child_process";
import { triggerJarvisRestart } from "./restart.js";
import { detectRespawnSupervisor } from "./supervisor-markers.js";

type RespawnMode = "spawned" | "supervised" | "disabled" | "failed";

export type GatewayRespawnResult = {
  mode: RespawnMode;
  pid?: number;
  detail?: string;
};

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/**
 * Attempt to restart this process with a fresh PID.
 * - supervised environments (launchd/systemd/schtasks): caller should exit and let supervisor restart
 * - JARVIS_NO_RESPAWN=1: caller should keep in-process restart behavior (tests/dev)
 * - otherwise: spawn detached child with current argv/execArgv, then caller exits
 */
export function restartGatewayProcessWithFreshPid(): GatewayRespawnResult {
  if (isTruthy(process.env.JARVIS_NO_RESPAWN)) {
    return { mode: "disabled" };
  }
  const supervisor = detectRespawnSupervisor(process.env);
  if (supervisor) {
    // For all supervised environments, attempt an explicit restart trigger
    // before falling back to exit(0).
    // macOS launchd: Use explicit restart to avoid bootout race conditions.
    // Windows schtasks: Must use explicit restart.
    // Linux systemd: Explicit restart is more reliable than exit(0).
    const restart = triggerJarvisRestart();
    if (!restart.ok) {
      // If explicit restart failed but we're supervised, fall back to exit(0)
      // for launchd/systemd (they will restart us via KeepAlive/Restart=always)
      if (supervisor === "launchd" || supervisor === "systemd") {
        return { mode: "supervised", detail: `fallback after ${restart.method} failure` };
      }
      // For schtasks, explicit restart is required
      return {
        mode: "failed",
        detail: restart.detail ?? `${restart.method} restart failed`,
      };
    }
    // CRITICAL FIX: For launchd, give the service time to register before exiting.
    // Without this delay, the process may exit before launchd completes bootstrap,
    // causing the gateway to never restart (self-decapitation).
    if (supervisor === "launchd") {
      return {
        mode: "supervised",
        detail: `via ${restart.method} (will delay exit for launchd registration)`,
      };
    }
    return { mode: "supervised", detail: `via ${restart.method}` };
  }
  if (process.platform === "win32") {
    // Detached respawn is unsafe on Windows without an identified Scheduled Task:
    // the child becomes orphaned if the original process exits.
    return {
      mode: "disabled",
      detail: "win32: detached respawn unsupported without Scheduled Task markers",
    };
  }

  try {
    const args = [...process.execArgv, ...process.argv.slice(1)];
    const child = spawn(process.execPath, args, {
      env: process.env,
      detached: true,
      stdio: "inherit",
    });
    child.unref();
    return { mode: "spawned", pid: child.pid ?? undefined };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { mode: "failed", detail };
  }
}
