import chalk, { Chalk } from "chalk";
import { JARVIS_PALETTE } from "./palette.js";

const hasForceColor =
  typeof process.env.FORCE_COLOR === "string" &&
  process.env.FORCE_COLOR.trim().length > 0 &&
  process.env.FORCE_COLOR.trim() !== "0";

const baseChalk = process.env.NO_COLOR && !hasForceColor ? new Chalk({ level: 0 }) : chalk;

const hex = (value: string) => baseChalk.hex(value);

export const theme = {
  accent: hex(JARVIS_PALETTE.accent),
  accentBright: hex(JARVIS_PALETTE.accentBright),
  accentDim: hex(JARVIS_PALETTE.accentDim),
  info: hex(JARVIS_PALETTE.info),
  success: hex(JARVIS_PALETTE.success),
  warn: hex(JARVIS_PALETTE.warn),
  error: hex(JARVIS_PALETTE.error),
  muted: hex(JARVIS_PALETTE.muted),
  heading: baseChalk.bold.hex(JARVIS_PALETTE.accent),
  command: hex(JARVIS_PALETTE.accentBright),
  option: hex(JARVIS_PALETTE.warn),
} as const;

export const isRich = () => Boolean(baseChalk.level > 0);

export const colorize = (rich: boolean, color: (value: string) => string, value: string) =>
  rich ? color(value) : value;
