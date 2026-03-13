import { describe, it, expect } from "vitest";
import { UtilityModule } from "./index.js";

describe("UtilityModule", () => {
  it("should instantiate without errors", () => {
    const module = new UtilityModule();
    expect(module).toBeDefined();
  });

  it("should have handleIntent method", () => {
    const module = new UtilityModule();
    expect(typeof module.handleIntent).toBe("function");
  });
});
