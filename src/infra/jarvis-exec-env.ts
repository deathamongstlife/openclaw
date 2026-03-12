export const JARVIS_CLI_ENV_VAR = "JARVIS_CLI";
export const JARVIS_CLI_ENV_VALUE = "1";

export function markJarvisExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [JARVIS_CLI_ENV_VAR]: JARVIS_CLI_ENV_VALUE,
  };
}

export function ensureJarvisExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[JARVIS_CLI_ENV_VAR] = JARVIS_CLI_ENV_VALUE;
  return env;
}
