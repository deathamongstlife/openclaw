import type { Client } from "discord.js";
import type { AnyAgentTool } from "jarvis/plugin-sdk/discord";
import { ConfigManager } from "../bot-features/config.js";
import { ManagementManager } from "../bot-features/management.js";
import { ModerationManager } from "../bot-features/moderation.js";
import { UtilityManager } from "../bot-features/utility.js";
import type { DiscordBotStoreAdapter } from "../database/store-adapter.js";
import type { MusicService } from "../music/service.js";
import { createModerationTools } from "./moderation.js";
import { createMusicTools } from "./music.js";

// Create all bot tools
export function createDiscordBotTools(
  store: DiscordBotStoreAdapter,
  client: Client,
  musicService?: MusicService,
): AnyAgentTool[] {
  const moderation = new ModerationManager(store);
  const management = new ManagementManager(store);
  const utility = new UtilityManager(store);
  const config = new ConfigManager(store);

  const tools: AnyAgentTool[] = [
    ...createModerationTools(moderation, client),
    // TODO: Add utility, management, and config tools from split files
  ];

  // Add music tools if music service is available
  if (musicService) {
    tools.push(...createMusicTools(musicService, client));
  }

  return tools;
}
