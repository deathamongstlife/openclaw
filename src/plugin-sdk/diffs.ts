// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export type { JarvisConfig } from "../config/config.js";
export { resolvePreferredJarvisTmpDir } from "../infra/tmp-openclaw-dir.js";
export type {
  AnyAgentTool,
  JarvisPluginApi,
  JarvisPluginConfigSchema,
  PluginLogger,
} from "../plugins/types.js";
