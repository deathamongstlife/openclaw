import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          OPENCLAW_STATE_DIR: "/tmp/openclaw-state",
          OPENCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "jarvis-gateway",
        windowsTaskName: "Jarvis Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/openclaw-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/openclaw-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "jarvis-gateway",
        windowsTaskName: "Jarvis Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u jarvis-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "jarvis-gateway",
        windowsTaskName: "Jarvis Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "Jarvis Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "jarvis gateway install",
        startCommand: "jarvis gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.openclaw.gateway.plist",
        systemdServiceName: "jarvis-gateway",
        windowsTaskName: "Jarvis Gateway",
      }),
    ).toEqual([
      "jarvis gateway install",
      "jarvis gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "jarvis gateway install",
        startCommand: "jarvis gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.openclaw.gateway.plist",
        systemdServiceName: "jarvis-gateway",
        windowsTaskName: "Jarvis Gateway",
      }),
    ).toEqual([
      "jarvis gateway install",
      "jarvis gateway",
      "systemctl --user start jarvis-gateway.service",
    ]);
  });
});
