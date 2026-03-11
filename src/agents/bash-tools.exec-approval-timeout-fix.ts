/**
 * Exec approval timeout and UI failure fixes
 * Fixes #43285: Exec tool approval mechanism broken
 */

import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  type ExecApprovalRegistration,
  registerExecApprovalRequest,
  waitForExecApprovalDecision,
  type RequestExecApprovalDecisionParams,
} from "./bash-tools.exec-approval-request.js";

const logger = createSubsystemLogger("exec-approval");

export type ExecApprovalOptions = {
  /** Maximum time to wait for approval UI to render */
  uiRenderTimeoutMs?: number;
  /** Maximum time to wait for user decision */
  decisionTimeoutMs?: number;
  /** Fallback decision when approval fails */
  fallbackDecision?: "allow" | "deny" | "error";
  /** Callback when UI fails to render */
  onUiFailure?: (error: Error) => void;
  /** Callback when decision times out */
  onDecisionTimeout?: () => void;
};

const DEFAULT_UI_RENDER_TIMEOUT_MS = 10000; // 10 seconds
const DEFAULT_DECISION_TIMEOUT_MS = 300000; // 5 minutes
const DEFAULT_FALLBACK_DECISION = "deny";

export class ExecApprovalHandler {
  private readonly options: Required<ExecApprovalOptions>;

  constructor(options: ExecApprovalOptions = {}) {
    this.options = {
      uiRenderTimeoutMs: options.uiRenderTimeoutMs ?? DEFAULT_UI_RENDER_TIMEOUT_MS,
      decisionTimeoutMs: options.decisionTimeoutMs ?? DEFAULT_DECISION_TIMEOUT_MS,
      fallbackDecision: options.fallbackDecision ?? DEFAULT_FALLBACK_DECISION,
      onUiFailure: options.onUiFailure ?? (() => {}),
      onDecisionTimeout: options.onDecisionTimeout ?? (() => {}),
    };
  }

  /**
   * Request approval with proper timeout and error handling
   */
  async requestApproval(
    params: RequestExecApprovalDecisionParams,
  ): Promise<string | null> {
    try {
      // Step 1: Register the approval request with UI render timeout
      const registration = await this.registerWithTimeout(params);

      // If decision was made during registration, return it
      if (registration.finalDecision !== undefined) {
        return registration.finalDecision;
      }

      // Step 2: Wait for decision with timeout
      return await this.waitForDecisionWithTimeout(registration.id);
    } catch (err) {
      return this.handleApprovalFailure(err, params);
    }
  }

  /**
   * Register approval request with UI render timeout
   */
  private async registerWithTimeout(
    params: RequestExecApprovalDecisionParams,
  ): Promise<ExecApprovalRegistration> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.uiRenderTimeoutMs);

    try {
      // Attempt to register with timeout
      const registration = await Promise.race([
        registerExecApprovalRequest(params),
        this.createAbortPromise(controller.signal, "UI render timeout"),
      ]);

      clearTimeout(timeout);
      return registration;
    } catch (err) {
      clearTimeout(timeout);

      if (this.isTimeoutError(err)) {
        const uiError = new Error(
          `Approval UI failed to render within ${this.options.uiRenderTimeoutMs}ms`,
        );
        this.options.onUiFailure(uiError);
        logger.error("Approval UI render timeout", { params, error: uiError });
        throw uiError;
      }
      throw err;
    }
  }

  /**
   * Wait for decision with timeout
   */
  private async waitForDecisionWithTimeout(approvalId: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.decisionTimeoutMs);

    try {
      const decision = await Promise.race([
        waitForExecApprovalDecision(approvalId),
        this.createAbortPromise(controller.signal, "Decision timeout"),
      ]);

      clearTimeout(timeout);
      return decision;
    } catch (err) {
      clearTimeout(timeout);

      if (this.isTimeoutError(err)) {
        this.options.onDecisionTimeout();
        logger.warn("Approval decision timeout", {
          approvalId,
          timeoutMs: this.options.decisionTimeoutMs,
        });
        return this.applyFallbackDecision("timeout");
      }
      throw err;
    }
  }

  /**
   * Handle approval failure and apply fallback
   */
  private handleApprovalFailure(
    err: unknown,
    params: RequestExecApprovalDecisionParams,
  ): string | null {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Approval request failed", {
      error: errorMessage,
      command: params.command,
      id: params.id,
    });

    if (this.options.fallbackDecision === "error") {
      throw new Error(`Exec approval failed: ${errorMessage}`, { cause: err });
    }

    return this.applyFallbackDecision("error");
  }

  /**
   * Apply fallback decision
   */
  private applyFallbackDecision(reason: "timeout" | "error"): string | null {
    const decision = this.options.fallbackDecision;
    logger.info("Applying fallback decision", { decision, reason });

    switch (decision) {
      case "allow":
        return "allow";
      case "deny":
        return "deny";
      case "error":
        throw new Error(`Approval ${reason} and fallback is set to error`);
    }
  }

  /**
   * Create a promise that rejects on abort
   */
  private createAbortPromise<T>(signal: AbortSignal, reason: string): Promise<T> {
    return new Promise((_, reject) => {
      if (signal.aborted) {
        reject(new Error(reason));
        return;
      }
      signal.addEventListener("abort", () => {
        reject(new Error(reason));
      });
    });
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(err: unknown): boolean {
    if (!(err instanceof Error)) {
      return false;
    }
    const message = err.message.toLowerCase();
    return message.includes("timeout") || message.includes("aborted");
  }
}

/**
 * Retry approval request with exponential backoff
 */
export async function requestApprovalWithRetry(
  params: RequestExecApprovalDecisionParams,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    handler?: ExecApprovalHandler;
  } = {},
): Promise<string | null> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 1000;
  const maxDelay = options.maxDelayMs ?? 10000;
  const handler = options.handler ?? new ExecApprovalHandler();

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await handler.requestApproval(params);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);

      // Don't retry if it's a timeout (decision already made or expired)
      if (message.includes("Decision timeout")) {
        throw err;
      }

      // Don't retry if it's a user denial
      if (message.includes("denied") || message.includes("rejected")) {
        throw err;
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        logger.info("Retrying approval request", { attempt: attempt + 1, delayMs: delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Approval request failed after ${maxRetries} attempts`, {
    cause: lastError,
  });
}
