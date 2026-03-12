import { createPluginRuntimeStore } from "jarvis/plugin-sdk/compat";
import type { PluginRuntime } from "jarvis/plugin-sdk/msteams";

const { setRuntime: setMSTeamsRuntime, getRuntime: getMSTeamsRuntime } =
  createPluginRuntimeStore<PluginRuntime>("MSTeams runtime not initialized");
export { getMSTeamsRuntime, setMSTeamsRuntime };
