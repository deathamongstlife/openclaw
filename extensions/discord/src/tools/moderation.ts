import { Type, Static } from "@sinclair/typebox";
import type { Client } from "discord.js";
import type { AnyAgentTool } from "jarvis/plugin-sdk/discord";
import { ModerationManager } from "../bot-features/moderation.js";
import { isTextOrThreadChannel, isTextChannel } from "./type-helpers.js";

export function createModerationTools(
  moderation: ModerationManager,
  client: Client,
): AnyAgentTool[] {
  return [
    createWarnUserTool(moderation, client),
    createKickUserTool(moderation, client),
    createBanUserTool(moderation, client),
    createUnbanUserTool(moderation, client),
    createTimeoutUserTool(moderation, client),
    createClearWarningsTool(moderation, client),
    createSetSlowmodeTool(moderation, client),
    createLockChannelTool(moderation, client),
    createPurgeMessagesTool(moderation, client),
  ];
}

function createWarnUserTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user to warn" }),
    reason: Type.String({ description: "Reason for the warning" }),
  });

  return {
    name: "discord_warn_user",
    label: "Warn Discord User",
    description:
      "Warn a user in a Discord server. Records the warning and notifies the user via DM if possible. Requires moderation permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const user = await client.users.fetch(params.userId);

      const result = await moderation.warnUser(guild, moderator, user, params.reason);
      return result;
    },
  };
}

function createKickUserTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user to kick" }),
    reason: Type.String({ description: "Reason for the kick" }),
  });

  return {
    name: "discord_kick_user",
    label: "Kick Discord User",
    description:
      "Kick a user from a Discord server. Requires moderation permissions and proper role hierarchy.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const user = await client.users.fetch(params.userId);

      const result = await moderation.kickUser(guild, moderator, user, params.reason);
      return result;
    },
  };
}

function createBanUserTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user to ban" }),
    reason: Type.String({ description: "Reason for the ban" }),
    deleteMessageDays: Type.Optional(
      Type.Number({
        description: "Days of messages to delete (0-7). Default: 0",
        minimum: 0,
        maximum: 7,
      }),
    ),
  });

  return {
    name: "discord_ban_user",
    label: "Ban Discord User",
    description:
      "Ban a user from a Discord server. Can optionally delete recent messages. Requires moderation permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const user = await client.users.fetch(params.userId);

      const result = await moderation.banUser(
        guild,
        moderator,
        user,
        params.reason,
        params.deleteMessageDays ?? 0,
      );
      return result;
    },
  };
}

function createUnbanUserTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user ID to unban" }),
    reason: Type.String({ description: "Reason for the unban" }),
  });

  return {
    name: "discord_unban_user",
    label: "Unban Discord User",
    description: "Unban a user from a Discord server. Requires moderation permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const result = await moderation.unbanUser(guild, moderator, params.userId, params.reason);
      return result;
    },
  };
}

function createTimeoutUserTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user to timeout" }),
    durationMinutes: Type.Number({
      description: "Timeout duration in minutes (max 40320 = 28 days)",
      minimum: 1,
      maximum: 40320,
    }),
    reason: Type.String({ description: "Reason for the timeout" }),
  });

  return {
    name: "discord_timeout_user",
    label: "Timeout Discord User",
    description:
      "Timeout (mute) a user in a Discord server for a specified duration. Max 28 days. Requires moderation permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const user = await client.users.fetch(params.userId);

      const durationMs = params.durationMinutes * 60 * 1000;
      const result = await moderation.timeoutUser(
        guild,
        moderator,
        user,
        durationMs,
        params.reason,
      );
      return result;
    },
  };
}

function createClearWarningsTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    userId: Type.String({ description: "The user whose warnings to clear" }),
  });

  return {
    name: "discord_clear_warnings",
    label: "Clear User Warnings",
    description:
      "Clear all active warnings for a user in a Discord server. Requires moderation permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const user = await client.users.fetch(params.userId);

      const result = await moderation.clearWarnings(guild, moderator, user);
      return result;
    },
  };
}

function createSetSlowmodeTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    channelId: Type.String({ description: "The channel ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    seconds: Type.Number({
      description: "Slowmode duration in seconds (0-21600). 0 = disable",
      minimum: 0,
      maximum: 21600,
    }),
  });

  return {
    name: "discord_set_slowmode",
    label: "Set Channel Slowmode",
    description:
      "Set slowmode for a Discord channel. Users can only send messages every X seconds. Max 6 hours. Set to 0 to disable.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const channel = await guild.channels.fetch(params.channelId);
      if (!isTextOrThreadChannel(channel)) {
        return { success: false, message: "Channel not found or not a text channel" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const result = await moderation.setSlowmode(channel, moderator, params.seconds);
      return result;
    },
  };
}

function createLockChannelTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    channelId: Type.String({ description: "The channel ID to lock/unlock" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    lock: Type.Boolean({ description: "true to lock, false to unlock" }),
  });

  return {
    name: "discord_lock_channel",
    label: "Lock/Unlock Channel",
    description:
      "Lock or unlock a Discord channel. Locked channels prevent @everyone from sending messages.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const channel = await guild.channels.fetch(params.channelId);
      if (!isTextOrThreadChannel(channel)) {
        return { success: false, message: "Channel not found or not a text channel" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const result = await moderation.lockChannel(channel, moderator, params.lock);
      return result;
    },
  };
}

function createPurgeMessagesTool(moderation: ModerationManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    channelId: Type.String({ description: "The channel ID" }),
    moderatorId: Type.String({ description: "The moderator's user ID" }),
    count: Type.Number({
      description: "Number of messages to delete (1-100)",
      minimum: 1,
      maximum: 100,
    }),
    userId: Type.Optional(
      Type.String({ description: "Optional: only delete messages from this user" }),
    ),
  });

  return {
    name: "discord_purge_messages",
    label: "Purge Messages",
    description:
      "Bulk delete messages in a Discord channel. Can filter by user. Messages must be less than 14 days old.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const channel = await guild.channels.fetch(params.channelId);
      if (!isTextChannel(channel)) {
        return { success: false, message: "Channel not found or not a text channel" };
      }

      const moderator = await guild.members.fetch(params.moderatorId);
      const result = await moderation.purgeMessages(
        channel,
        moderator,
        params.count,
        params.userId,
      );
      return result;
    },
  };
}
