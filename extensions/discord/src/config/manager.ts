import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DiscordBotConfigSchema, defaultConfig, type DiscordBotConfig } from "./schema.js";

let cachedConfig: DiscordBotConfig | null = null;

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  const jarvisDir = join(homedir(), ".jarvis", "discord");
  return join(jarvisDir, "bot-config.json");
}

/**
 * Load configuration from disk
 */
export function loadConfig(): DiscordBotConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const data = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(data);
    const validated = DiscordBotConfigSchema.parse(parsed);
    cachedConfig = validated;
    return validated;
  } catch (error) {
    console.error("Failed to load Discord bot config:", error);
    return defaultConfig;
  }
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: DiscordBotConfig): void {
  const configPath = getConfigPath();
  const jarvisDir = join(homedir(), ".jarvis", "discord");

  // Ensure directory exists
  if (!existsSync(jarvisDir)) {
    mkdirSync(jarvisDir, { recursive: true });
  }

  try {
    const validated = DiscordBotConfigSchema.parse(config);
    writeFileSync(configPath, JSON.stringify(validated, null, 2), "utf-8");
    cachedConfig = validated;
  } catch (error) {
    console.error("Failed to save Discord bot config:", error);
    throw error;
  }
}

/**
 * Update configuration (merges with existing)
 */
export function updateConfig(updates: Partial<DiscordBotConfig>): DiscordBotConfig {
  const current = loadConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
  return updated;
}

/**
 * Clear cached configuration
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
