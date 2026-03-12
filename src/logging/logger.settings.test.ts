import { describe, expect, it } from "vitest";
import { __test__ } from "./logger.js";

describe("shouldSkipLoadConfigFallback", () => {
  it("matches config validate invocations", () => {
    expect(__test__.shouldSkipLoadConfigFallback(["node", "jarvis", "config", "validate"])).toBe(
      true,
    );
  });

  it("handles root flags before config validate", () => {
    expect(
      __test__.shouldSkipLoadConfigFallback([
        "node",
        "jarvis",
        "--profile",
        "work",
        "--no-color",
        "config",
        "validate",
        "--json",
      ]),
    ).toBe(true);
  });

  it("does not match other commands", () => {
    expect(__test__.shouldSkipLoadConfigFallback(["node", "jarvis", "config", "get", "foo"])).toBe(
      false,
    );
    expect(__test__.shouldSkipLoadConfigFallback(["node", "jarvis", "status"])).toBe(false);
  });
});
