import { describe, it, expect } from "vitest";
import {
  LOCAL_MODEL_CATALOG,
  getModelById,
  getModelByName,
  getModelsByCapability,
  getModelsBySize,
} from "./catalog.js";

describe("LOCAL_MODEL_CATALOG", () => {
  it("should contain at least 7 models", () => {
    expect(LOCAL_MODEL_CATALOG.length).toBeGreaterThanOrEqual(7);
  });

  it("should have all required fields for each model", () => {
    for (const model of LOCAL_MODEL_CATALOG) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.displayName).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(model.size).toBeTruthy();
      expect(model.capabilities).toBeTruthy();
      expect(Array.isArray(model.capabilities)).toBe(true);
      expect(model.contextWindow).toBeGreaterThan(0);
      expect(model.defaultQuantization).toBeTruthy();
      expect(model.supportedQuantizations).toBeTruthy();
      expect(Array.isArray(model.supportedQuantizations)).toBe(true);
      expect(model.minVRAM).toBeGreaterThanOrEqual(0);
      expect(model.minRAM).toBeGreaterThan(0);
      expect(model.recommendedVRAM).toBeGreaterThanOrEqual(model.minVRAM);
      expect(model.recommendedRAM).toBeGreaterThanOrEqual(model.minRAM);
    }
  });

  it("should have Ollama model names for all models", () => {
    for (const model of LOCAL_MODEL_CATALOG) {
      expect(model.ollamaModelName).toBeTruthy();
    }
  });

  it("should have unique model IDs", () => {
    const ids = LOCAL_MODEL_CATALOG.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("getModelById", () => {
  it("should return model by ID", () => {
    const model = getModelById("llama-3.3-70b");
    expect(model).toBeTruthy();
    expect(model?.displayName).toBe("Llama 3.3 70B");
  });

  it("should return undefined for non-existent ID", () => {
    const model = getModelById("non-existent-model");
    expect(model).toBeUndefined();
  });
});

describe("getModelByName", () => {
  it("should return model by name", () => {
    const model = getModelByName("llama3.3:70b");
    expect(model).toBeTruthy();
    expect(model?.id).toBe("llama-3.3-70b");
  });

  it("should return model by ollamaModelName", () => {
    const model = getModelByName("llama3.2:3b");
    expect(model).toBeTruthy();
    expect(model?.id).toBe("llama-3.2-3b");
  });

  it("should return undefined for non-existent name", () => {
    const model = getModelByName("non-existent-model");
    expect(model).toBeUndefined();
  });
});

describe("getModelsByCapability", () => {
  it("should return models with reasoning capability", () => {
    const models = getModelsByCapability("reasoning");
    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      expect(model.capabilities).toContain("reasoning");
    }
  });

  it("should return models with code capability", () => {
    const models = getModelsByCapability("code");
    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      expect(model.capabilities).toContain("code");
    }
  });

  it("should return empty array for non-existent capability", () => {
    const models = getModelsByCapability("non-existent");
    expect(models).toEqual([]);
  });
});

describe("getModelsBySize", () => {
  it("should return models in size range", () => {
    const models = getModelsBySize(3, 8);
    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      const sizeMatch = model.size.match(/(\d+)B/);
      expect(sizeMatch).toBeTruthy();

      if (sizeMatch) {
        const size = Number.parseInt(sizeMatch[1]);
        expect(size).toBeGreaterThanOrEqual(3);
        expect(size).toBeLessThanOrEqual(8);
      }
    }
  });

  it("should return large models only", () => {
    const models = getModelsBySize(70, 100);
    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      const sizeMatch = model.size.match(/(\d+)B/);
      expect(sizeMatch).toBeTruthy();

      if (sizeMatch) {
        const size = Number.parseInt(sizeMatch[1]);
        expect(size).toBeGreaterThanOrEqual(70);
      }
    }
  });

  it("should return empty array for invalid range", () => {
    const models = getModelsBySize(1000, 2000);
    expect(models).toEqual([]);
  });
});
