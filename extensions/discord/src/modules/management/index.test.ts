import { describe, it, expect } from "vitest";
import { ManagementModule } from "./index.js";

describe("ManagementModule", () => {
  it("should instantiate without errors", () => {
    const module = new ManagementModule();
    expect(module).toBeDefined();
  });

  it("should have handleIntent method", () => {
    const module = new ManagementModule();
    expect(typeof module.handleIntent).toBe("function");
  });
});
