import { describe, it, expect } from "vitest";
import {
  detectSystemResources,
  canRunModel,
  formatSystemResources,
  recommendQuantization,
} from "./system-resources.js";

describe("detectSystemResources", () => {
  it("should detect system resources", async () => {
    const resources = await detectSystemResources();

    expect(resources.totalRAM).toBeGreaterThan(0);
    expect(resources.availableRAM).toBeGreaterThan(0);
    expect(resources.availableRAM).toBeLessThanOrEqual(resources.totalRAM);
    expect(resources.cpuCores).toBeGreaterThan(0);
    expect(typeof resources.hasGPU).toBe("boolean");
    expect(resources.totalVRAM).toBeGreaterThanOrEqual(0);

    if (resources.hasGPU) {
      expect(resources.gpuName).toBeTruthy();
    }
  });

  it("should return reasonable values", async () => {
    const resources = await detectSystemResources();

    // Sanity checks
    expect(resources.totalRAM).toBeLessThan(2048); // Less than 2TB
    expect(resources.totalRAM).toBeGreaterThan(1); // More than 1GB
    expect(resources.cpuCores).toBeLessThan(256); // Less than 256 cores
  });
});

describe("canRunModel", () => {
  it("should allow model with sufficient GPU VRAM", () => {
    const resources = {
      totalRAM: 32,
      availableRAM: 16,
      totalVRAM: 24,
      availableVRAM: 20,
      hasGPU: true,
      gpuName: "Test GPU",
      cpuCores: 8,
    };

    const canRun = canRunModel(resources, 16, 32);
    expect(canRun).toBe(true);
  });

  it("should allow model with sufficient RAM (CPU-only)", () => {
    const resources = {
      totalRAM: 64,
      availableRAM: 48,
      totalVRAM: 0,
      availableVRAM: 0,
      hasGPU: false,
      cpuCores: 16,
    };

    const canRun = canRunModel(resources, 16, 48);
    expect(canRun).toBe(true);
  });

  it("should reject model with insufficient VRAM", () => {
    const resources = {
      totalRAM: 32,
      availableRAM: 16,
      totalVRAM: 8,
      availableVRAM: 6,
      hasGPU: true,
      gpuName: "Test GPU",
      cpuCores: 8,
    };

    const canRun = canRunModel(resources, 16, 32);
    expect(canRun).toBe(false);
  });

  it("should reject model with insufficient RAM", () => {
    const resources = {
      totalRAM: 8,
      availableRAM: 4,
      totalVRAM: 0,
      availableVRAM: 0,
      hasGPU: false,
      cpuCores: 4,
    };

    const canRun = canRunModel(resources, 0, 32);
    expect(canRun).toBe(false);
  });
});

describe("formatSystemResources", () => {
  it("should format system resources with GPU", () => {
    const resources = {
      totalRAM: 32,
      availableRAM: 16,
      totalVRAM: 24,
      availableVRAM: 20,
      hasGPU: true,
      gpuName: "NVIDIA RTX 4090",
      cpuCores: 16,
    };

    const formatted = formatSystemResources(resources);

    expect(formatted).toContain("RAM");
    expect(formatted).toContain("16.0 GB");
    expect(formatted).toContain("32.0 GB");
    expect(formatted).toContain("CPU");
    expect(formatted).toContain("16 cores");
    expect(formatted).toContain("GPU");
    expect(formatted).toContain("NVIDIA RTX 4090");
    expect(formatted).toContain("VRAM");
    expect(formatted).toContain("24.0 GB");
  });

  it("should format system resources without GPU", () => {
    const resources = {
      totalRAM: 16,
      availableRAM: 8,
      totalVRAM: 0,
      availableVRAM: 0,
      hasGPU: false,
      cpuCores: 8,
    };

    const formatted = formatSystemResources(resources);

    expect(formatted).toContain("RAM");
    expect(formatted).toContain("CPU");
    expect(formatted).toContain("GPU: None detected");
    expect(formatted).toContain("CPU-only mode");
    expect(formatted).not.toContain("VRAM");
  });
});

describe("recommendQuantization", () => {
  it("should recommend Q8_0 for high-end system", () => {
    const resources = {
      totalRAM: 128,
      availableRAM: 96,
      totalVRAM: 80,
      availableVRAM: 72,
      hasGPU: true,
      gpuName: "NVIDIA H100",
      cpuCores: 32,
    };

    const quant = recommendQuantization(resources, 24);
    expect(quant).toBe("Q8_0");
  });

  it("should recommend Q5_K_M for mid-range system", () => {
    const resources = {
      totalRAM: 64,
      availableRAM: 48,
      totalVRAM: 24,
      availableVRAM: 20,
      hasGPU: true,
      gpuName: "NVIDIA RTX 4090",
      cpuCores: 16,
    };

    const quant = recommendQuantization(resources, 16);
    expect(quant).toBe("Q5_K_M");
  });

  it("should recommend Q4_K_M for standard system", () => {
    const resources = {
      totalRAM: 32,
      availableRAM: 24,
      totalVRAM: 12,
      availableVRAM: 10,
      hasGPU: true,
      gpuName: "NVIDIA RTX 3080",
      cpuCores: 8,
    };

    const quant = recommendQuantization(resources, 12);
    expect(quant).toBe("Q4_K_M");
  });

  it("should recommend Q4_K_M for CPU-only system", () => {
    const resources = {
      totalRAM: 16,
      availableRAM: 12,
      totalVRAM: 0,
      availableVRAM: 0,
      hasGPU: false,
      cpuCores: 8,
    };

    const quant = recommendQuantization(resources, 8);
    expect(quant).toBe("Q4_K_M");
  });
});
