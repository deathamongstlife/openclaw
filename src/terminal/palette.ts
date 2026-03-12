// JARVIS palette tokens for CLI/UI theming. "JARVIS seam" == use this palette.
// Keep in sync with docs/cli/index.md (CLI palette section).
export const JARVIS_PALETTE = {
  accent: "#00D9FF",
  accentBright: "#4FC3F7",
  accentDim: "#0088FF",
  info: "#00B8D4",
  success: "#00E676",
  warn: "#FFB300",
  error: "#FF1744",
  muted: "#607D8B",
} as const;

// Legacy export for backward compatibility
export const LOBSTER_PALETTE = JARVIS_PALETTE;
