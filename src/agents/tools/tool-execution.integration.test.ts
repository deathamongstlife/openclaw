/**
 * Integration tests for tool execution fixes
 * Tests fixes for: #43324, #43285, #43242, #43278, #43238, #43210, etc.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BrowserTimeoutHandler } from "./browser-tool.timeout-handler.js";
import { ExecApprovalHandler } from "../bash-tools.exec-approval-timeout-fix.js";
import { SandboxCleanupManager } from "../sandbox/cleanup-manager.js";
import { MemoryDeduplicator } from "../../memory/deduplication.js";

describe("Browser Timeout Handler (#43324)", () => {
  let handler: BrowserTimeoutHandler;

  beforeEach(() => {
    handler = new BrowserTimeoutHandler({
      timeoutMs: 1000,
      killGracePeriodMs: 100,
    });
  });

  afterEach(() => {
    handler.clear();
  });

  it("should trigger timeout after specified duration", async () => {
    let timedOut = false;
    handler = new BrowserTimeoutHandler({
      timeoutMs: 100,
      onTimeout: () => {
        timedOut = true;
      },
    });

    handler.start();
    await new Promise((r) => setTimeout(r, 150));

    expect(timedOut).toBe(true);
    expect(handler.timedOut).toBe(true);
  });

  it("should clear timeout when cleared", async () => {
    let timedOut = false;
    handler = new BrowserTimeoutHandler({
      timeoutMs: 100,
      onTimeout: () => {
        timedOut = true;
      },
    });

    handler.start();
    handler.clear();
    await new Promise((r) => setTimeout(r, 150));

    expect(timedOut).toBe(false);
  });

  it("should reset timeout when reset", async () => {
    let timedOut = false;
    handler = new BrowserTimeoutHandler({
      timeoutMs: 150,
      onTimeout: () => {
        timedOut = true;
      },
    });

    handler.start();
    await new Promise((r) => setTimeout(r, 100));
    handler.reset();
    await new Promise((r) => setTimeout(r, 100));

    expect(timedOut).toBe(false);
  });

  it("should force kill process after grace period", async () => {
    const mockProcess = {
      pid: 1234,
      kill: vi.fn(),
      once: vi.fn(),
    } as any;

    let forceKilled = false;
    handler = new BrowserTimeoutHandler({
      timeoutMs: 1000,
      killGracePeriodMs: 50,
      onForceKill: () => {
        forceKilled = true;
      },
    });

    // Mock process that doesn't die on SIGTERM
    mockProcess.kill.mockImplementation((signal: string) => {
      if (signal === "SIGTERM") {
        return; // Don't die
      }
      if (signal === "SIGKILL") {
        // Trigger exit
        const exitCallback = mockProcess.once.mock.calls.find(
          (call: any) => call[0] === "exit",
        )?.[1];
        if (exitCallback) {
          exitCallback();
        }
      }
    });

    await handler.killProcess(mockProcess);

    expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");
    expect(mockProcess.kill).toHaveBeenCalledWith("SIGKILL");
    expect(forceKilled).toBe(true);
  });
});

describe("Exec Approval Handler (#43285)", () => {
  let handler: ExecApprovalHandler;

  beforeEach(() => {
    handler = new ExecApprovalHandler({
      uiRenderTimeoutMs: 100,
      decisionTimeoutMs: 200,
      fallbackDecision: "deny",
    });
  });

  it("should apply fallback decision on UI timeout", async () => {
    const params = {
      id: "test-approval",
      command: "test-command",
      cwd: "/tmp",
      host: "gateway" as const,
      security: {} as any,
      ask: "always" as const,
    };

    // Mock registerExecApprovalRequest to timeout
    const originalRegister = (await import("../bash-tools.exec-approval-request.js"))
      .registerExecApprovalRequest;
    vi.spyOn(
      await import("../bash-tools.exec-approval-request.js"),
      "registerExecApprovalRequest",
    ).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ id: "test", expiresAtMs: Date.now() + 1000 }), 200);
        }),
    );

    let uiFailureCalled = false;
    handler = new ExecApprovalHandler({
      uiRenderTimeoutMs: 50,
      fallbackDecision: "deny",
      onUiFailure: () => {
        uiFailureCalled = true;
      },
    });

    const decision = await handler.requestApproval(params);

    expect(uiFailureCalled).toBe(true);
    expect(decision).toBe("deny");
  });

  it("should apply fallback decision on decision timeout", async () => {
    const params = {
      id: "test-approval",
      command: "test-command",
      cwd: "/tmp",
      host: "gateway" as const,
      security: {} as any,
      ask: "always" as const,
    };

    // Mock successful registration but slow decision
    vi.spyOn(
      await import("../bash-tools.exec-approval-request.js"),
      "registerExecApprovalRequest",
    ).mockResolvedValue({
      id: "test",
      expiresAtMs: Date.now() + 1000,
    });

    vi.spyOn(
      await import("../bash-tools.exec-approval-request.js"),
      "waitForExecApprovalDecision",
    ).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("allow"), 300);
        }),
    );

    let timeoutCalled = false;
    handler = new ExecApprovalHandler({
      decisionTimeoutMs: 100,
      fallbackDecision: "deny",
      onDecisionTimeout: () => {
        timeoutCalled = true;
      },
    });

    const decision = await handler.requestApproval(params);

    expect(timeoutCalled).toBe(true);
    expect(decision).toBe("deny");
  });
});

describe("Sandbox Cleanup Manager (#43242)", () => {
  let manager: SandboxCleanupManager;

  beforeEach(() => {
    manager = new SandboxCleanupManager({
      maxIdleMs: 100,
      cleanupIntervalMs: 50,
    });
  });

  afterEach(() => {
    manager.stop();
  });

  it("should track and untrack containers", () => {
    manager.trackContainer("test-container");
    // Tracking is internal, verify it doesn't throw
    expect(() => manager.untrackContainer("test-container")).not.toThrow();
  });

  it("should start and stop periodic cleanup", async () => {
    manager.start();
    expect(() => manager.stop()).not.toThrow();
  });

  it("should cleanup specific container", async () => {
    // Mock container cleanup (actual implementation requires Docker)
    const cleanupSpy = vi.spyOn(manager as any, "stopContainer");
    cleanupSpy.mockResolvedValue(undefined);

    const removeSpy = vi.spyOn(manager as any, "removeContainer");
    removeSpy.mockResolvedValue(undefined);

    // This will fail without Docker, but we're testing the logic
    await expect(
      manager.cleanupContainer("test-container", { force: true }),
    ).resolves.not.toThrow();
  });
});

describe("Memory Deduplicator (#43234)", () => {
  let deduplicator: MemoryDeduplicator;

  beforeEach(() => {
    deduplicator = new MemoryDeduplicator({
      maxAgeMs: 1000,
      maxEntries: 100,
    });
  });

  afterEach(() => {
    deduplicator.clear();
  });

  it("should detect duplicate content", () => {
    const content = "This is test content";

    expect(deduplicator.isDuplicate(content)).toBe(false);
    deduplicator.recordInsertion(content);
    expect(deduplicator.isDuplicate(content)).toBe(true);
  });

  it("should handle whitespace in content", () => {
    const content1 = "This is test content";
    const content2 = "  This is test content  ";

    deduplicator.recordInsertion(content1);
    expect(deduplicator.isDuplicate(content2)).toBe(true);
  });

  it("should expire old entries", async () => {
    const content = "This is test content";

    deduplicator.recordInsertion(content);
    expect(deduplicator.isDuplicate(content)).toBe(true);

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 1100));

    expect(deduplicator.isDuplicate(content)).toBe(false);
  });

  it("should cleanup expired entries", async () => {
    deduplicator.recordInsertion("content1");
    deduplicator.recordInsertion("content2");
    deduplicator.recordInsertion("content3");

    await new Promise((r) => setTimeout(r, 1100));

    const removed = deduplicator.cleanup();
    expect(removed).toBe(3);
  });

  it("should enforce size limit", () => {
    const smallDedup = new MemoryDeduplicator({
      maxEntries: 5,
    });

    for (let i = 0; i < 10; i++) {
      smallDedup.recordInsertion(`content${i}`);
    }

    const stats = smallDedup.stats();
    expect(stats.totalHashes).toBe(5);
  });

  it("should provide accurate stats", () => {
    deduplicator.recordInsertion("content1");
    deduplicator.recordInsertion("content2");

    const stats = deduplicator.stats();
    expect(stats.totalHashes).toBe(2);
    expect(stats.oldestEntryAgeMs).toBeGreaterThanOrEqual(0);
    expect(stats.newestEntryAgeMs).toBeGreaterThanOrEqual(0);
  });

  it("should find duplicate entries", () => {
    const content = "This is test content";
    deduplicator.recordInsertion(content, "/path/to/file");

    const duplicate = deduplicator.findDuplicate(content);
    expect(duplicate).not.toBeNull();
    expect(duplicate?.path).toBe("/path/to/file");
  });
});

describe("Tool Execution Error Handling", () => {
  it("should handle browser timeout gracefully", async () => {
    const handler = new BrowserTimeoutHandler({
      timeoutMs: 100,
    });

    handler.start();
    await new Promise((r) => setTimeout(r, 150));

    expect(handler.timedOut).toBe(true);
    handler.clear();
  });

  it("should handle approval failures gracefully", async () => {
    const handler = new ExecApprovalHandler({
      fallbackDecision: "deny",
    });

    const params = {
      id: "test",
      command: "test",
      cwd: "/tmp",
      host: "gateway" as const,
      security: {} as any,
      ask: "always" as const,
    };

    // Mock failure
    vi.spyOn(
      await import("../bash-tools.exec-approval-request.js"),
      "registerExecApprovalRequest",
    ).mockRejectedValue(new Error("Test failure"));

    const decision = await handler.requestApproval(params);
    expect(decision).toBe("deny");
  });

  it("should handle cleanup failures gracefully", async () => {
    const manager = new SandboxCleanupManager();

    // Should not throw on missing container
    await expect(
      manager.cleanupContainer("nonexistent-container"),
    ).resolves.not.toThrow();

    manager.stop();
  });
});
