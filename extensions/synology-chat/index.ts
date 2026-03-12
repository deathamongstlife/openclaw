import type { JarvisPluginApi } from "openclaw/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk/synology-chat";
import { createSynologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for Jarvis",
  configSchema: emptyPluginConfigSchema(),
  register(api: JarvisPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: createSynologyChatPlugin() });
  },
};

export default plugin;
