// Narrow plugin-sdk surface for the bundled llm-task plugin.
// Keep this list additive and scoped to symbols used under extensions/llm-task.

export { resolvePreferredJarvisTmpDir } from "../infra/tmp-jarvis-dir.js";
export type { AnyAgentTool, JarvisPluginApi } from "../plugins/types.js";
