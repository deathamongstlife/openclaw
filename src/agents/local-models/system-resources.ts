/**
 * System resource detection for determining which models can run.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import type { SystemResources } from "./types.js";

const execAsync = promisify(exec);

/**
 * Detect available system resources (RAM, VRAM, GPU).
 */
export async function detectSystemResources(): Promise<SystemResources> {
  const totalRAM = os.totalmem() / (1024 ** 3); // Convert to GB
  const freeRAM = os.freemem() / (1024 ** 3);
  const cpuCores = os.cpus().length;

  const gpuInfo = await detectGPU();

  return {
    totalRAM: Math.round(totalRAM * 10) / 10,
    availableRAM: Math.round(freeRAM * 10) / 10,
    totalVRAM: gpuInfo.vram,
    availableVRAM: gpuInfo.vram, // Approximate, may need refinement
    hasGPU: gpuInfo.hasGPU,
    gpuName: gpuInfo.name,
    cpuCores,
  };
}

interface GPUInfo {
  hasGPU: boolean;
  name?: string;
  vram: number;
}

/**
 * Detect GPU and VRAM using platform-specific commands.
 */
async function detectGPU(): Promise<GPUInfo> {
  const platform = os.platform();

  try {
    if (platform === "darwin") {
      // macOS - Use system_profiler
      const { stdout } = await execAsync("system_profiler SPDisplaysDataType");
      const vramMatch = stdout.match(/VRAM.*?:\s*(\d+)\s*MB/i);
      const nameMatch = stdout.match(/Chipset Model:\s*(.+)/);

      if (vramMatch) {
        return {
          hasGPU: true,
          name: nameMatch?.[1]?.trim(),
          vram: Math.round(Number.parseInt(vramMatch[1]) / 1024), // Convert MB to GB
        };
      }

      // Try Metal for Apple Silicon
      const metalMatch = stdout.match(/Metal.*?:\s*Supported/i);
      if (metalMatch) {
        // Apple Silicon typically shares memory - estimate based on total RAM
        const sharedMemory = Math.min(os.totalmem() / (1024 ** 3) * 0.5, 64); // Up to 50% of RAM, max 64GB
        return {
          hasGPU: true,
          name: "Apple Silicon GPU",
          vram: Math.round(sharedMemory),
        };
      }
    } else if (platform === "linux") {
      // Linux - Try nvidia-smi first
      try {
        const { stdout: nvidiaOut } = await execAsync("nvidia-smi --query-gpu=memory.total,name --format=csv,noheader,nounits");
        const lines = nvidiaOut.trim().split("\n");
        if (lines.length > 0) {
          const [vramMB, name] = lines[0].split(",").map((s) => s.trim());
          return {
            hasGPU: true,
            name,
            vram: Math.round(Number.parseInt(vramMB) / 1024),
          };
        }
      } catch {
        // nvidia-smi not available, try AMD
      }

      // Try AMD rocm-smi
      try {
        const { stdout: amdOut } = await execAsync("rocm-smi --showmeminfo vram");
        const vramMatch = amdOut.match(/VRAM Total Memory.*?:\s*(\d+)/i);
        if (vramMatch) {
          return {
            hasGPU: true,
            name: "AMD GPU",
            vram: Math.round(Number.parseInt(vramMatch[1]) / 1024 / 1024 / 1024), // Bytes to GB
          };
        }
      } catch {
        // AMD tools not available
      }

      // Try lspci for any GPU
      try {
        const { stdout: lspciOut } = await execAsync("lspci | grep -i vga");
        if (lspciOut) {
          return {
            hasGPU: true,
            name: lspciOut.split(":").pop()?.trim(),
            vram: 0, // Unknown VRAM
          };
        }
      } catch {
        // lspci failed
      }
    } else if (platform === "win32") {
      // Windows - Use wmic
      try {
        const { stdout } = await execAsync("wmic path win32_VideoController get AdapterRAM,Name");
        const lines = stdout.trim().split("\n").slice(1); // Skip header
        if (lines.length > 0) {
          const parts = lines[0].trim().split(/\s{2,}/);
          if (parts.length >= 2) {
            const vramBytes = Number.parseInt(parts[0]);
            const name = parts[1];
            return {
              hasGPU: true,
              name,
              vram: Math.round(vramBytes / (1024 ** 3)),
            };
          }
        }
      } catch {
        // wmic failed
      }
    }
  } catch (error) {
    // GPU detection failed, fall through to CPU-only
  }

  return {
    hasGPU: false,
    vram: 0,
  };
}

/**
 * Check if the system can run a model with the given requirements.
 */
export function canRunModel(resources: SystemResources, requiredVRAM: number, requiredRAM: number): boolean {
  if (resources.hasGPU && resources.totalVRAM >= requiredVRAM) {
    return resources.totalRAM >= requiredRAM * 0.3; // Only need ~30% of RAM when using GPU
  }

  // CPU-only mode requires all in RAM
  return resources.totalRAM >= requiredRAM;
}

/**
 * Get a human-readable description of system resources.
 */
export function formatSystemResources(resources: SystemResources): string {
  const lines: string[] = [
    `RAM: ${resources.availableRAM.toFixed(1)} GB available / ${resources.totalRAM.toFixed(1)} GB total`,
    `CPU: ${resources.cpuCores} cores`,
  ];

  if (resources.hasGPU) {
    lines.push(`GPU: ${resources.gpuName ?? "Unknown"}`);
    if (resources.totalVRAM > 0) {
      lines.push(`VRAM: ${resources.totalVRAM.toFixed(1)} GB`);
    }
  } else {
    lines.push("GPU: None detected (CPU-only mode)");
  }

  return lines.join("\n");
}

/**
 * Recommend a quantization level based on available resources.
 */
export function recommendQuantization(resources: SystemResources, modelVRAM: number): string {
  const availableMemory = resources.hasGPU ? resources.totalVRAM : resources.totalRAM;

  if (availableMemory >= modelVRAM * 2) {
    return "Q8_0"; // High quality
  }
  if (availableMemory >= modelVRAM * 1.5) {
    return "Q5_K_M"; // Good quality
  }
  return "Q4_K_M"; // Standard quality, best compatibility
}
