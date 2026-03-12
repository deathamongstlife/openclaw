import { createPluginRuntimeStore } from "jarvis/plugin-sdk/compat";
import type { PluginRuntime } from "jarvis/plugin-sdk/slack";

const { setRuntime: setSlackRuntime, getRuntime: getSlackRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Slack runtime not initialized");
export { getSlackRuntime, setSlackRuntime };
