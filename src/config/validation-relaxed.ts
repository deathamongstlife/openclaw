/**
 * Relaxed config validation for nested objects
 * Addresses issue #43320 - Config validation rejects valid nested objects
 */

import type { OpenClawConfig } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  path: string;
  message: string;
  value?: unknown;
};

export type ValidationWarning = {
  path: string;
  message: string;
  value?: unknown;
};

/**
 * Check if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Validate nested object structure
 */
export function validateNestedObject(
  obj: unknown,
  path: string,
  schema: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isPlainObject(obj)) {
    errors.push({
      path,
      message: `Expected object, got ${typeof obj}`,
      value: obj,
    });
    return { valid: false, errors, warnings };
  }

  for (const [key, value] of Object.entries(obj)) {
    const keyPath = path ? `${path}.${key}` : key;

    if (!(key in schema)) {
      warnings.push({
        path: keyPath,
        message: "Unknown property (may be ignored)",
        value,
      });
      continue;
    }

    const schemaValue = schema[key];

    if (isPlainObject(value) && isPlainObject(schemaValue)) {
      const result = validateNestedObject(value, keyPath, schemaValue as Record<string, unknown>);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate config with relaxed rules
 */
export function validateConfigRelaxed(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isPlainObject(config)) {
    errors.push({
      path: "",
      message: "Config must be an object",
      value: config,
    });
    return { valid: false, errors, warnings };
  }

  const cfg = config as Partial<OpenClawConfig>;

  if (cfg.gateway && isPlainObject(cfg.gateway)) {
    if (cfg.gateway.port !== undefined) {
      const port = cfg.gateway.port;
      if (typeof port !== "number" || port < 1 || port > 65535) {
        errors.push({
          path: "gateway.port",
          message: "Port must be a number between 1 and 65535",
          value: port,
        });
      }
    }

    if (cfg.gateway.bind !== undefined) {
      const bind = cfg.gateway.bind;
      const validBindValues = ["loopback", "local", "tailscale", "all"];
      if (typeof bind !== "string" || !validBindValues.includes(bind)) {
        errors.push({
          path: "gateway.bind",
          message: `Bind must be one of: ${validBindValues.join(", ")}`,
          value: bind,
        });
      }
    }
  }

  if (cfg.agents && !Array.isArray(cfg.agents)) {
    if (isPlainObject(cfg.agents)) {
      warnings.push({
        path: "agents",
        message: "Agents should be an array, not an object (may work but not recommended)",
        value: cfg.agents,
      });
    } else {
      errors.push({
        path: "agents",
        message: "Agents must be an array",
        value: cfg.agents,
      });
    }
  }

  if (cfg.channels && isPlainObject(cfg.channels)) {
    for (const [channelType, channelConfig] of Object.entries(cfg.channels)) {
      if (!isPlainObject(channelConfig) && channelConfig !== null && channelConfig !== undefined) {
        warnings.push({
          path: `channels.${channelType}`,
          message: "Channel config should be an object or null",
          value: channelConfig,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize config by removing unknown properties
 */
export function sanitizeConfig(
  config: Record<string, unknown>,
  knownKeys: Set<string>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (knownKeys.has(key)) {
      if (isPlainObject(value)) {
        sanitized[key] = { ...value };
      } else if (Array.isArray(value)) {
        sanitized[key] = [...value];
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Merge configs with nested object support
 */
export function mergeConfigs(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }

    if (value === null) {
      result[key] = null;
      continue;
    }

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeConfigs(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push("Validation errors:");
    for (const error of result.errors) {
      lines.push(`  - ${error.path}: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("Validation warnings:");
    for (const warning of result.warnings) {
      lines.push(`  - ${warning.path}: ${warning.message}`);
    }
  }

  return lines.join("\n");
}
