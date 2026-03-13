import { z } from "zod";

/**
 * Lavalink node configuration
 */
export const LavalinkNodeSchema = z.object({
  host: z.string(),
  port: z.number().min(1).max(65535),
  password: z.string(),
  secure: z.boolean().default(false),
});

export type LavalinkNode = z.infer<typeof LavalinkNodeSchema>;

/**
 * Music module configuration
 */
export const MusicConfigSchema = z.object({
  enabled: z.boolean().default(false),
  lavalinkNodes: z.array(LavalinkNodeSchema).default([]),
  defaultVolume: z.number().min(1).max(100).default(50),
  maxQueueSize: z.number().min(1).default(100),
  maxPlaylistSize: z.number().min(1).default(50),
});

export type MusicConfig = z.infer<typeof MusicConfigSchema>;

/**
 * PluralKit integration configuration
 */
export const PluralKitConfigSchema = z.object({
  enabled: z.boolean().default(false),
  cacheEnabled: z.boolean().default(true),
  cacheTTL: z.number().min(0).default(86400000), // 24 hours in ms
});

export type PluralKitConfig = z.infer<typeof PluralKitConfigSchema>;

/**
 * Natural language processing configuration
 */
export const NLPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.6),
  contextTimeout: z.number().min(0).default(300000), // 5 minutes in ms
});

export type NLPConfig = z.infer<typeof NLPConfigSchema>;

/**
 * Main Discord bot configuration
 */
export const DiscordBotConfigSchema = z.object({
  music: MusicConfigSchema.default({}),
  pluralkit: PluralKitConfigSchema.default({}),
  nlp: NLPConfigSchema.default({}),
});

export type DiscordBotConfig = z.infer<typeof DiscordBotConfigSchema>;

/**
 * Default configuration
 */
export const defaultConfig: DiscordBotConfig = {
  music: {
    enabled: false,
    lavalinkNodes: [],
    defaultVolume: 50,
    maxQueueSize: 100,
    maxPlaylistSize: 50,
  },
  pluralkit: {
    enabled: false,
    cacheEnabled: true,
    cacheTTL: 86400000,
  },
  nlp: {
    enabled: true,
    confidenceThreshold: 0.6,
    contextTimeout: 300000,
  },
};
