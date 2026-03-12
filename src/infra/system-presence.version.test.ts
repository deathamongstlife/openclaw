import { describe, expect, it, vi } from "vitest";
import { withEnvAsync } from "../test-utils/env.js";

async function withPresenceModule<T>(
  env: Record<string, string | undefined>,
  run: (module: typeof import("./system-presence.js")) => Promise<T> | T,
): Promise<T> {
  return withEnvAsync(env, async () => {
    vi.resetModules();
    const module = await import("./system-presence.js");
    return await run(module);
  });
}

describe("system-presence version fallback", () => {
  it("uses runtime VERSION when JARVIS_VERSION is not set", async () => {
    await withPresenceModule(
      {
        JARVIS_SERVICE_VERSION: "2.4.6-service",
        npm_package_version: "1.0.0-package",
      },
      async ({ listSystemPresence }) => {
        const { VERSION } = await import("../version.js");
        const selfEntry = listSystemPresence().find((entry) => entry.reason === "self");
        expect(selfEntry?.version).toBe(VERSION);
      },
    );
  });

  it("prefers JARVIS_VERSION over runtime VERSION", async () => {
    await withPresenceModule(
      {
        JARVIS_VERSION: "9.9.9-cli",
        JARVIS_SERVICE_VERSION: "2.4.6-service",
        npm_package_version: "1.0.0-package",
      },
      ({ listSystemPresence }) => {
        const selfEntry = listSystemPresence().find((entry) => entry.reason === "self");
        expect(selfEntry?.version).toBe("9.9.9-cli");
      },
    );
  });

  it("uses runtime VERSION when JARVIS_VERSION and JARVIS_SERVICE_VERSION are blank", async () => {
    await withPresenceModule(
      {
        JARVIS_VERSION: " ",
        JARVIS_SERVICE_VERSION: "\t",
        npm_package_version: "1.0.0-package",
      },
      async ({ listSystemPresence }) => {
        const { VERSION } = await import("../version.js");
        const selfEntry = listSystemPresence().find((entry) => entry.reason === "self");
        expect(selfEntry?.version).toBe(VERSION);
      },
    );
  });
});
