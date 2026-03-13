import { describe, it, expect } from "vitest";
import { PluralKitAPI } from "./api.js";

describe("PluralKitAPI", () => {
  it("should instantiate with default base URL", () => {
    const api = new PluralKitAPI();
    expect(api).toBeDefined();
  });

  it("should instantiate with custom base URL", () => {
    const api = new PluralKitAPI("https://custom.api.url");
    expect(api).toBeDefined();
  });

  it("should have getMessage method", () => {
    const api = new PluralKitAPI();
    expect(typeof api.getMessage).toBe("function");
  });

  it("should have getSystem method", () => {
    const api = new PluralKitAPI();
    expect(typeof api.getSystem).toBe("function");
  });

  it("should have getMember method", () => {
    const api = new PluralKitAPI();
    expect(typeof api.getMember).toBe("function");
  });
});
