import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/jarvis" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchJarvisChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveJarvisUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopJarvisChrome: vi.fn(async () => {}),
}));
