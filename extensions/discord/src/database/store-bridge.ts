// Bridge to provide DiscordBotStoreAdapter instance for thread management
import { DiscordBotStoreAdapter } from "./store-adapter.js";

let storeInstance: DiscordBotStoreAdapter | null = null;

export function getStoreInstance(): DiscordBotStoreAdapter {
  if (!storeInstance) {
    storeInstance = new DiscordBotStoreAdapter();
  }
  return storeInstance;
}
