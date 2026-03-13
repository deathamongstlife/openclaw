import { matchIntent, type Intent } from "./intents.js";

export interface ParsedCommand {
  intent: Intent;
  confidence: number;
  parameters: Record<string, unknown>;
  originalMessage: string;
}

/**
 * Extract user mentions from Discord message
 */
function extractUserMentions(text: string): string[] {
  const mentionRegex = /<@!?(\d+)>/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Extract role mentions from Discord message
 */
function extractRoleMentions(text: string): string[] {
  const roleRegex = /<@&(\d+)>/g;
  const roles: string[] = [];
  let match;

  while ((match = roleRegex.exec(text)) !== null) {
    roles.push(match[1]);
  }

  return roles;
}

/**
 * Extract channel mentions from Discord message
 */
function extractChannelMentions(text: string): string[] {
  const channelRegex = /<#(\d+)>/g;
  const channels: string[] = [];
  let match;

  while ((match = channelRegex.exec(text)) !== null) {
    channels.push(match[1]);
  }

  return channels;
}

/**
 * Extract duration from text (e.g., "10 minutes", "1 hour", "2 days")
 */
function extractDuration(text: string): number | null {
  const durationRegex = /(\d+)\s*(second|sec|s|minute|min|m|hour|hr|h|day|d)s?/i;
  const match = text.match(durationRegex);

  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    second: 1000,
    sec: 1000,
    s: 1000,
    minute: 60000,
    min: 60000,
    m: 60000,
    hour: 3600000,
    hr: 3600000,
    h: 3600000,
    day: 86400000,
    d: 86400000,
  };

  return value * (multipliers[unit] ?? 1000);
}

/**
 * Extract reason from moderation command
 */
function extractReason(text: string): string {
  const reasonRegex = /(?:for|because|reason:?)\s+(.+)/i;
  const match = text.match(reasonRegex);
  return match ? match[1].trim() : "No reason provided";
}

/**
 * Extract number from text
 */
function extractNumber(text: string): number | null {
  const numberRegex = /\b(\d+)\b/;
  const match = text.match(numberRegex);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Remove Discord formatting from text
 */
function stripDiscordFormatting(text: string): string {
  return text
    .replace(/<@!?(\d+)>/g, "@user") // User mentions
    .replace(/<@&(\d+)>/g, "@role") // Role mentions
    .replace(/<#(\d+)>/g, "#channel") // Channel mentions
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/__(.+?)__/g, "$1") // Underline
    .replace(/~~(.+?)~~/g, "$1") // Strikethrough
    .replace(/`(.+?)`/g, "$1") // Inline code
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .trim();
}

/**
 * Parse natural language message into structured command
 */
export function parseCommand(message: string): ParsedCommand {
  const strippedMessage = stripDiscordFormatting(message);
  const { intent, confidence, matches } = matchIntent(strippedMessage);

  const parameters: Record<string, unknown> = {
    userMentions: extractUserMentions(message),
    roleMentions: extractRoleMentions(message),
    channelMentions: extractChannelMentions(message),
  };

  // Intent-specific parameter extraction
  switch (intent) {
    case "moderation.warn":
    case "moderation.kick":
    case "moderation.ban":
    case "moderation.timeout":
    case "moderation.mute":
      parameters.targetUser = parameters.userMentions?.[0] ?? null;
      parameters.reason = extractReason(message);
      if (intent === "moderation.timeout" || intent === "moderation.mute") {
        parameters.duration = extractDuration(message);
      }
      break;

    case "moderation.purge":
      parameters.count = extractNumber(message) ?? 10;
      break;

    case "moderation.slowmode":
      parameters.duration = extractDuration(message) ?? 5000; // Default 5 seconds
      break;

    case "music.play":
      if (matches && matches[1]) {
        parameters.query = matches[1].trim();
      }
      break;

    case "music.volume":
      parameters.level = extractNumber(message) ?? 50;
      break;

    case "music.seek":
      parameters.position = extractDuration(message) ?? 0;
      break;

    case "user.info":
      parameters.targetUser = parameters.userMentions?.[0] ?? null;
      break;

    case "utility.poll":
      if (matches && matches[1]) {
        parameters.question = matches[1].trim();
      }
      break;

    case "utility.remind":
      if (matches) {
        parameters.message = matches[1]?.trim();
        parameters.time = matches[2]?.trim();
        parameters.duration = extractDuration(message);
      }
      break;

    case "config.module.enable":
    case "config.module.disable":
      if (matches && matches[1]) {
        parameters.module = matches[1].trim().toLowerCase();
      }
      break;

    default:
      break;
  }

  return {
    intent,
    confidence,
    parameters,
    originalMessage: message,
  };
}

/**
 * Check if message looks like a command (starts with mention or keyword)
 */
export function looksLikeCommand(message: string, botId: string): boolean {
  const trimmed = message.trim();

  // Check for bot mention at start
  if (trimmed.startsWith(`<@${botId}>`) || trimmed.startsWith(`<@!${botId}>`)) {
    return true;
  }

  // Check for common command keywords
  const commandKeywords = [
    /^(help|ping)\b/i,
    /^(warn|kick|ban|timeout|mute|purge|lock|unlock)/i,
    /^(play|pause|skip|stop|queue|volume)/i,
    /^(remind|poll|tag)/i,
    /^(enable|disable|config|set)/i,
  ];

  return commandKeywords.some((regex) => regex.test(trimmed));
}

/**
 * Remove bot mention from start of message
 */
export function removeBotMention(message: string, botId: string): string {
  return message.replace(new RegExp(`^<@!?${botId}>\\s*`, "i"), "").trim();
}
