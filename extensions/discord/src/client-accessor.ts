import type { Client } from "discord.js";

// Store the Discord client instance set by the plugin
let discordClient: Client | null = null;

/**
 * Set the Discord client instance.
 * This should be called once during plugin initialization.
 */
export function setDiscordClient(client: Client): void {
  discordClient = client;
}

/**
 * Get the Discord client instance.
 * Throws if called before the client has been set.
 */
export function getDiscordClient(): Client {
  if (!discordClient) {
    throw new Error(
      "Discord client not initialized. Ensure the channel plugin is registered first.",
    );
  }
  return discordClient;
}

/**
 * Check if the Discord client has been initialized.
 */
export function hasDiscordClient(): boolean {
  return discordClient !== null;
}
