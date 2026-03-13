import os from "node:os";
// Bridge to provide DiscordBotStore instance for thread management
import path from "node:path";
import { DiscordBotStore } from "./store.js";

let storeInstance: DiscordBotStore | null = null;

export function getStoreInstance(): DiscordBotStore {
  if (!storeInstance) {
    const baseDir = path.join(os.homedir(), ".jarvis", "extensions", "discord");
    storeInstance = new DiscordBotStore(baseDir);
  }
  return storeInstance;
}
