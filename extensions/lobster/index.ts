import type {
  AnyAgentTool,
  JarvisPluginApi,
  JarvisPluginToolFactory,
} from "openclaw/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: JarvisPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as JarvisPluginToolFactory,
    { optional: true },
  );
}
