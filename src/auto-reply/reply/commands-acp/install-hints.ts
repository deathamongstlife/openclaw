import { existsSync } from "node:fs";
import path from "node:path";
import type { JarvisConfig } from "../../../config/config.js";

export function resolveConfiguredAcpBackendId(cfg: JarvisConfig): string {
  return cfg.acp?.backend?.trim() || "acpx";
}

export function resolveAcpInstallCommandHint(cfg: JarvisConfig): string {
  const configured = cfg.acp?.runtime?.installCommand?.trim();
  if (configured) {
    return configured;
  }
  const backendId = resolveConfiguredAcpBackendId(cfg).toLowerCase();
  if (backendId === "acpx") {
    const localPath = path.resolve(process.cwd(), "extensions/acpx");
    if (existsSync(localPath)) {
      return `jarvis plugins install ${localPath}`;
    }
    return "jarvis plugins install acpx";
  }
  return `Install and enable the plugin that provides ACP backend "${backendId}".`;
}
