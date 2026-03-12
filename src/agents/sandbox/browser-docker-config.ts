/**
 * Browser Docker configuration for headless Chrome in containers
 * Fixes #43278: Browser tool screenshot fails in Docker sandbox
 */

export type BrowserDockerEnvironment = {
  /** Chrome flags for headless operation */
  chromeFlags: string[];
  /** Environment variables */
  env: Record<string, string>;
  /** Docker run arguments */
  dockerArgs: string[];
};

/**
 * Chrome flags required for stable headless operation in Docker
 */
export const DOCKER_CHROME_FLAGS = [
  // Disable GPU acceleration (not available in containers)
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-dev-shm-usage",

  // Security flags (container provides isolation)
  "--disable-setuid-sandbox",
  "--no-sandbox",

  // Stability flags
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-features=IsolateOrigins,site-per-process",

  // Memory and performance
  "--single-process",
  "--no-zygote",
  "--disable-extensions",
  "--disable-sync",

  // Display flags for headless
  "--headless=new",
  "--hide-scrollbars",
  "--mute-audio",

  // Screenshot flags
  "--force-device-scale-factor=1",
  "--window-size=1920,1080",
];

/**
 * Environment variables for headless Chrome in Docker
 */
export const DOCKER_CHROME_ENV = {
  // Display configuration (even though headless, needed for some operations)
  DISPLAY: ":99",
  CHROME_FLAGS: DOCKER_CHROME_FLAGS.join(" "),

  // Disable Chrome sandboxing (Docker provides isolation)
  CHROME_DEVEL_SANDBOX: "/usr/local/sbin/chrome-devel-sandbox",

  // Font configuration
  FONTCONFIG_PATH: "/etc/fonts",

  // Disable Chrome auto-update
  GOOGLE_DISABLE_AUTO_UPDATE: "1",

  // Memory limits
  NODE_OPTIONS: "--max-old-space-size=2048",
};

/**
 * Docker run arguments for browser container
 */
export const DOCKER_BROWSER_ARGS = [
  // Memory limits
  "--memory=2g",
  "--memory-swap=2g",

  // CPU limits (prevent runaway processes)
  "--cpus=2",

  // Shared memory size (important for Chrome)
  "--shm-size=2g",

  // Security options
  "--security-opt=seccomp=unconfined",
  "--cap-add=SYS_ADMIN",

  // Disable OOM killer for browser process
  "--oom-score-adj=-500",
];

/**
 * Build browser Docker environment configuration
 */
export function buildBrowserDockerEnvironment(options: {
  headless?: boolean;
  enableNoVnc?: boolean;
  cdpPort?: number;
  vncPort?: number;
  additionalFlags?: string[];
}): BrowserDockerEnvironment {
  const chromeFlags = [...DOCKER_CHROME_FLAGS];

  // Add custom flags
  if (options.additionalFlags) {
    chromeFlags.push(...options.additionalFlags);
  }

  // Remove headless flag if not headless mode
  if (options.headless === false) {
    const headlessIndex = chromeFlags.findIndex((f) => f.startsWith("--headless"));
    if (headlessIndex >= 0) {
      chromeFlags.splice(headlessIndex, 1);
    }
  }

  const env = { ...DOCKER_CHROME_ENV };

  // Add CDP configuration
  if (options.cdpPort) {
    env.CDP_PORT = String(options.cdpPort);
  }

  // Add VNC configuration
  if (options.enableNoVnc && options.vncPort) {
    env.VNC_PORT = String(options.vncPort);
    env.DISPLAY = ":0"; // Use display 0 for VNC
  }

  return {
    chromeFlags,
    env,
    dockerArgs: [...DOCKER_BROWSER_ARGS],
  };
}

/**
 * Validate browser Docker environment
 */
export function validateBrowserDockerEnvironment(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for required Docker version
  // (Done via Docker version check in docker.ts)

  // Check for sufficient shared memory
  try {
    const shmSize = process.env.SHM_SIZE;
    if (shmSize && parseInt(shmSize) < 2 * 1024 * 1024 * 1024) {
      issues.push("Shared memory size too small (need at least 2GB)");
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Build Chrome launch arguments for Docker environment
 */
export function buildChromeLaunchArgs(options: {
  userDataDir?: string;
  remoteDebuggingPort?: number;
  headless?: boolean;
  additionalArgs?: string[];
}): string[] {
  const config = buildBrowserDockerEnvironment({
    headless: options.headless !== false,
    cdpPort: options.remoteDebuggingPort,
  });

  const args = [...config.chromeFlags];

  // Add user data directory
  if (options.userDataDir) {
    args.push(`--user-data-dir=${options.userDataDir}`);
  }

  // Add remote debugging port
  if (options.remoteDebuggingPort) {
    args.push(`--remote-debugging-port=${options.remoteDebuggingPort}`);
    args.push("--remote-debugging-address=0.0.0.0");
  }

  // Add custom args
  if (options.additionalArgs) {
    args.push(...options.additionalArgs);
  }

  return args;
}

/**
 * Get environment variables for browser process
 */
export function getBrowserProcessEnv(baseEnv: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    ...DOCKER_CHROME_ENV,
  };
}
