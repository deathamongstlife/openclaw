import { Type } from "@sinclair/typebox";
import type { TextChannel, ThreadChannel, GuildChannel } from "discord.js";

// Type guards for Discord channels
export function isTextOrThreadChannel(
  channel: GuildChannel | null,
): channel is TextChannel | ThreadChannel {
  if (!channel) return false;
  return channel.isTextBased() || channel.isThread();
}

export function isTextChannel(channel: GuildChannel | null): channel is TextChannel {
  if (!channel) return false;
  return channel.isTextBased() && !channel.isThread();
}

// Typebox helper for string enums
export function stringEnum<T extends readonly string[]>(values: T, description: string) {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: [...values],
    description,
  });
}
