import { createPluginRuntimeStore } from "jarvis/plugin-sdk/compat";
import type { PluginRuntime } from "jarvis/plugin-sdk/mattermost";

const { setRuntime: setMattermostRuntime, getRuntime: getMattermostRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Mattermost runtime not initialized");
export { getMattermostRuntime, setMattermostRuntime };
