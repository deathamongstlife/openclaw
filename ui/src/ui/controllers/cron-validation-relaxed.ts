/**
 * Relaxed cron form validation
 * Addresses issue #43335 - Control UI cron form validation too strict
 */

import { toNumber } from "../format.ts";
import type { CronFormState } from "../ui-types.ts";
import type { CronFieldErrors } from "./cron.ts";

/**
 * Validate cron expression with more lenient rules
 */
function validateCronExpression(expr: string): { valid: boolean; error?: string } {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { valid: false, error: "Cron expression is required" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length < 5 || parts.length > 7) {
    return {
      valid: false,
      error: "Cron expression must have 5-7 fields (minute hour day month weekday [year] [second])",
    };
  }

  return { valid: true };
}

/**
 * Validate webhook URL with more lenient rules
 */
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: "Webhook URL is required" };
  }

  // Accept http, https, and localhost
  if (!/^https?:\/\//i.test(trimmed) && !/^localhost:/i.test(trimmed)) {
    return {
      valid: false,
      error: "Webhook URL must start with http://, https://, or localhost:",
    };
  }

  // Try to parse as URL
  try {
    new URL(trimmed.startsWith("localhost:") ? `http://${trimmed}` : trimmed);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid webhook URL format" };
  }
}

/**
 * Relaxed cron form validation
 * - More helpful error messages
 * - Accept wider range of inputs
 * - Validate formats without being overly strict
 */
export function validateCronFormRelaxed(form: CronFormState): CronFieldErrors {
  const errors: CronFieldErrors = {};

  if (!form.name.trim()) {
    errors.name = "Job name is required";
  } else if (form.name.trim().length > 100) {
    errors.name = "Job name must be 100 characters or less";
  }

  if (form.scheduleKind === "at") {
    const ms = Date.parse(form.scheduleAt);
    if (!Number.isFinite(ms)) {
      errors.scheduleAt = "Invalid date format. Use ISO 8601 or local format (e.g., 2026-12-31T12:00:00)";
    } else if (ms < Date.now()) {
      errors.scheduleAt = "Schedule time must be in the future";
    }
  } else if (form.scheduleKind === "every") {
    const amount = toNumber(form.everyAmount, 0);
    if (amount <= 0) {
      errors.everyAmount = "Interval must be a positive number";
    } else if (amount > 365 * 24 * 60) {
      errors.everyAmount = "Interval too large (maximum 1 year)";
    }
  } else {
    const validation = validateCronExpression(form.cronExpr);
    if (!validation.valid) {
      errors.cronExpr = validation.error ?? "Invalid cron expression";
    }

    if (!form.scheduleExact) {
      const staggerAmount = form.staggerAmount.trim();
      if (staggerAmount) {
        const stagger = toNumber(staggerAmount, -1);
        if (stagger < 0 || !Number.isFinite(stagger)) {
          errors.staggerAmount = "Stagger amount must be a non-negative number";
        } else if (stagger > 3600) {
          errors.staggerAmount = "Stagger amount too large (maximum 3600 seconds)";
        }
      }
    }
  }

  if (!form.payloadText.trim()) {
    errors.payloadText =
      form.payloadKind === "systemEvent"
        ? "System event text is required"
        : "Agent message is required";
  } else if (form.payloadText.trim().length > 10000) {
    errors.payloadText = "Payload text must be 10000 characters or less";
  }

  if (form.payloadKind === "agentTurn") {
    const timeoutRaw = form.timeoutSeconds.trim();
    if (timeoutRaw) {
      const timeout = toNumber(timeoutRaw, -1);
      if (timeout < 0 || !Number.isFinite(timeout)) {
        errors.timeoutSeconds = "Timeout must be a non-negative number";
      } else if (timeout > 3600) {
        errors.timeoutSeconds = "Timeout too large (maximum 3600 seconds)";
      }
    }
  }

  if (form.deliveryMode === "webhook") {
    const validation = validateWebhookUrl(form.deliveryTo);
    if (!validation.valid) {
      errors.deliveryTo = validation.error ?? "Invalid webhook URL";
    }
  }

  if (form.failureAlertMode === "custom") {
    const afterRaw = form.failureAlertAfter.trim();
    if (afterRaw) {
      const after = toNumber(afterRaw, -1);
      if (after < 0 || !Number.isFinite(after)) {
        errors.failureAlertAfter = "Failure alert threshold must be a non-negative number";
      } else if (after > 1000) {
        errors.failureAlertAfter = "Threshold too large (maximum 1000 consecutive failures)";
      }
    }

    const cooldownRaw = form.failureAlertCooldownSeconds.trim();
    if (cooldownRaw) {
      const cooldown = toNumber(cooldownRaw, -1);
      if (cooldown < 0 || !Number.isFinite(cooldown)) {
        errors.failureAlertCooldownSeconds = "Cooldown must be a non-negative number";
      } else if (cooldown > 86400) {
        errors.failureAlertCooldownSeconds = "Cooldown too large (maximum 24 hours)";
      }
    }
  }

  return errors;
}

/**
 * Get helpful validation hints for cron form fields
 */
export function getCronFieldHint(field: keyof CronFormState): string {
  const hints: Partial<Record<keyof CronFormState, string>> = {
    name: "Enter a descriptive name for this cron job",
    scheduleAt: "Use ISO 8601 format: YYYY-MM-DDTHH:MM:SS or local format",
    everyAmount: "Enter interval in minutes (e.g., 5, 60, 1440)",
    cronExpr: "Use standard cron format: minute hour day month weekday",
    staggerAmount: "Optional: spread job execution over this many seconds",
    payloadText: "The message or event to trigger",
    payloadModel: "Model to use for agent turns",
    timeoutSeconds: "Optional: maximum execution time in seconds",
    deliveryTo: "Webhook URL or channel destination",
  };

  return hints[field] ?? "";
}

/**
 * Auto-fix common cron expression issues
 */
export function autoFixCronExpression(expr: string): string {
  let fixed = expr.trim();

  // Replace common mistakes
  fixed = fixed.replace(/\*/g, "*");
  fixed = fixed.replace(/,\s+/g, ",");
  fixed = fixed.replace(/\s+/g, " ");

  // Ensure proper field count
  const parts = fixed.split(" ");
  if (parts.length === 5) {
    return fixed;
  }

  return fixed;
}
