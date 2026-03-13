import { Type, Static } from "@sinclair/typebox";
import type { Client, TextChannel, ThreadChannel, GuildChannel } from "discord.js";
import { ChannelType } from "discord.js";
import type { AnyAgentTool } from "jarvis/plugin-sdk/discord";
import { ConfigManager } from "../bot-features/config.js";
import { ManagementManager } from "../bot-features/management.js";
import { ModerationManager } from "../bot-features/moderation.js";
import { UtilityManager } from "../bot-features/utility.js";
import type { DiscordBotStoreAdapter, ServerConfigView } from "../database/store-adapter.js";
import type { MusicService } from "../music/service.js";
import { createMusicTools } from "./music.js";

// Type guards for Discord channels
function isTextOrThreadChannel(
  channel: GuildChannel | null,
): channel is TextChannel | ThreadChannel {
  if (!channel) return false;
  return channel.isTextBased() || channel.isThread();
}

function isTextChannel(channel: GuildChannel | null): channel is TextChannel {
  if (!channel) return false;
  return channel.isTextBased() && !channel.isThread();
}

function stringEnum<T extends readonly string[]>(values: T, description: string) {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: [...values],
    description,
  });
}

// Create all bot tools
export function createDiscordBotTools(
  store: DiscordBotStoreAdapter,
  client: Client,
  musicService?: MusicService,
): AnyAgentTool[] {
  const moderation = new ModerationManager(store);
  const management = new ManagementManager(store);
  const utility = new UtilityManager(store);
  const config = new ConfigManager(store);

  const tools: AnyAgentTool[] = [
    createWarnUserTool(moderation, client),
    createKickUserTool(moderation, client),
    createBanUserTool(moderation, client),
    createUnbanUserTool(moderation, client),
    createTimeoutUserTool(moderation, client),
    createClearWarningsTool(moderation, client),
    createSetSlowmodeTool(moderation, client),
    createLockChannelTool(moderation, client),
    createPurgeMessagesTool(moderation, client),
    createGetUserInfoTool(utility, client),
    createGetServerInfoTool(utility, client),
    createGetRoleInfoTool(utility, client),
    createGetModerationHistoryTool(utility, client),
    createCreateRoleTool(management, client),
    createDeleteRoleTool(management, client),
    createAssignRoleTool(management, client),
    createRemoveRoleTool(management, client),
    createSetNicknameTool(management, client),
    createSetWelcomeMessageTool(config, client),
    createSetWelcomeChannelTool(config, client),
    createSetLogChannelTool(config, client),
    createToggleModuleTool(config, client),
    createAddModRoleTool(config, client),
    createRemoveModRoleTool(config, client),
    createAddAutoRoleTool(config, client),
    createRemoveAutoRoleTool(config, client),
    createUpdateAutomodRulesTool(config, client),
    createGetConfigTool(config, client),
  ];

  // Add music tools if music service is available
  if (musicService) {
    tools.push(...createMusicTools(musicService, client));
  }

  return tools;
}

// Moderation Tools

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

// Utility Tools

function createGetUserInfoTool(utility: UtilityManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    userId: Type.String({ description: "The user ID to get info about" }),
  });

  return {
    name: "discord_get_user_info",
    label: "Get User Info",
    description:
      "Get detailed information about a Discord user in a server, including roles, join date, warnings, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const user = await client.users.fetch(params.userId);
      const info = await utility.getUserInfo(guild, user);
      return { success: true, data: info, formatted: utility.formatUserInfo(info) };
    },
  };
}

function createGetServerInfoTool(utility: UtilityManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_get_server_info",
    label: "Get Server Info",
    description:
      "Get detailed information about a Discord server including member count, roles, channels, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const info = await utility.getServerInfo(guild);
      return { success: true, data: info, formatted: utility.formatServerInfo(info) };
    },
  };
}

function createGetRoleInfoTool(utility: UtilityManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    roleId: Type.String({ description: "The role ID" }),
  });

  return {
    name: "discord_get_role_info",
    label: "Get Role Info",
    description:
      "Get detailed information about a Discord role including member count, permissions, color, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const role = await guild.roles.fetch(params.roleId);
      if (!role) {
        return { success: false, message: "Role not found" };
      }

      const info = await utility.getRoleInfo(role);
      return { success: true, data: info, formatted: utility.formatRoleInfo(info) };
    },
  };
}

function createGetModerationHistoryTool(utility: UtilityManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    userId: Type.Optional(Type.String({ description: "Optional: filter by user ID" })),
    limit: Type.Optional(
      Type.Number({
        description: "Number of recent actions to retrieve (default: 10)",
        minimum: 1,
        maximum: 50,
      }),
    ),
  });

  return {
    name: "discord_get_moderation_history",
    label: "Get Moderation History",
    description:
      "Get recent moderation actions for a server or specific user, including warns, kicks, bans, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const formatted = await utility.getModerationHistory(
        params.guildId,
        params.userId,
        params.limit ?? 10,
      );
      return { success: true, message: formatted };
    },
  };
}

// Management Tools

function createCreateRoleTool(management: ManagementManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user creating the role" }),
    name: Type.String({ description: "Role name" }),
    color: Type.Optional(Type.String({ description: "Hex color (e.g., #FF0000)" })),
    hoist: Type.Optional(Type.Boolean({ description: "Display separately in member list" })),
    mentionable: Type.Optional(Type.Boolean({ description: "Allow @mention of this role" })),
  });

  return {
    name: "discord_create_role",
    label: "Create Role",
    description: "Create a new role in a Discord server. Requires management permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await management.createRole(
        guild,
        executor,
        params.name,
        params.color,
        params.hoist,
        params.mentionable,
      );
      return result;
    },
  };
}

function createDeleteRoleTool(management: ManagementManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user deleting the role" }),
    roleId: Type.String({ description: "The role ID to delete" }),
  });

  return {
    name: "discord_delete_role",
    label: "Delete Role",
    description: "Delete a role from a Discord server. Requires management permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await management.deleteRole(guild, executor, params.roleId);
      return result;
    },
  };
}

function createAssignRoleTool(management: ManagementManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user assigning the role" }),
    userId: Type.String({ description: "The user to assign the role to" }),
    roleId: Type.String({ description: "The role ID to assign" }),
  });

  return {
    name: "discord_assign_role",
    label: "Assign Role",
    description: "Assign a role to a user in a Discord server. Requires management permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const user = await client.users.fetch(params.userId);
      const result = await management.assignRole(guild, executor, user, params.roleId);
      return result;
    },
  };
}

function createRemoveRoleTool(management: ManagementManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user removing the role" }),
    userId: Type.String({ description: "The user to remove the role from" }),
    roleId: Type.String({ description: "The role ID to remove" }),
  });

  return {
    name: "discord_remove_role",
    label: "Remove Role",
    description: "Remove a role from a user in a Discord server. Requires management permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const user = await client.users.fetch(params.userId);
      const result = await management.removeRole(guild, executor, user, params.roleId);
      return result;
    },
  };
}

function createSetNicknameTool(management: ManagementManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user setting the nickname" }),
    userId: Type.String({ description: "The user whose nickname to set" }),
    nickname: Type.Union([
      Type.String({ description: "New nickname" }),
      Type.Null({ description: "null to clear nickname" }),
    ]),
  });

  return {
    name: "discord_set_nickname",
    label: "Set User Nickname",
    description:
      "Set or clear a user's nickname in a Discord server. Requires management permissions.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const user = await client.users.fetch(params.userId);
      const result = await management.setNickname(guild, executor, user, params.nickname);
      return result;
    },
  };
}

// Configuration Tools

function createSetWelcomeMessageTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    message: Type.Union([
      Type.String({
        description:
          "Welcome message. Variables: {user}, {username}, {tag}, {server}, {memberCount}",
      }),
      Type.Null({ description: "null to clear welcome message" }),
    ]),
  });

  return {
    name: "discord_set_welcome_message",
    label: "Set Welcome Message",
    description:
      "Set or clear the welcome message for new members. Supports variables like {user}, {username}, {server}, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.setWelcomeMessage(params.guildId, executor, params.message);
      return result;
    },
  };
}

function createSetWelcomeChannelTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    channelId: Type.Union([
      Type.String({ description: "Channel ID for welcome messages" }),
      Type.Null({ description: "null to clear welcome channel" }),
    ]),
  });

  return {
    name: "discord_set_welcome_channel",
    label: "Set Welcome Channel",
    description:
      "Set or clear the channel where welcome messages will be sent when new members join.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.setWelcomeChannel(params.guildId, executor, params.channelId);
      return result;
    },
  };
}

function createSetLogChannelTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    channelId: Type.Union([
      Type.String({ description: "Channel ID for logging events" }),
      Type.Null({ description: "null to clear log channel" }),
    ]),
  });

  return {
    name: "discord_set_log_channel",
    label: "Set Log Channel",
    description:
      "Set or clear the channel where bot will log events like message deletes, member joins, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.setLogChannel(params.guildId, executor, params.channelId);
      return result;
    },
  };
}

const MODULE_TYPES = ["moderation", "automod", "logging", "welcome", "autorole"] as const;

function createToggleModuleTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    module: stringEnum(MODULE_TYPES, "Module to enable/disable"),
    enabled: Type.Boolean({ description: "true to enable, false to disable" }),
  });

  return {
    name: "discord_toggle_module",
    label: "Toggle Bot Module",
    description:
      "Enable or disable a bot module (moderation, automod, logging, welcome, autorole).",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.toggleModule(
        params.guildId,
        executor,
        params.module,
        params.enabled,
      );
      return result;
    },
  };
}

function createAddModRoleTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    roleId: Type.String({ description: "Role ID to add as moderator role" }),
  });

  return {
    name: "discord_add_mod_role",
    label: "Add Moderator Role",
    description:
      "Add a role to the list of moderator roles. Users with this role can use moderation commands.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.addModRole(params.guildId, executor, params.roleId);
      return result;
    },
  };
}

function createRemoveModRoleTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    roleId: Type.String({ description: "Role ID to remove from moderator roles" }),
  });

  return {
    name: "discord_remove_mod_role",
    label: "Remove Moderator Role",
    description: "Remove a role from the list of moderator roles.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.removeModRole(params.guildId, executor, params.roleId);
      return result;
    },
  };
}

function createAddAutoRoleTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    roleId: Type.String({
      description: "Role ID to automatically assign to new members",
    }),
  });

  return {
    name: "discord_add_auto_role",
    label: "Add Auto-Role",
    description:
      "Add a role that will be automatically assigned to new members when they join the server.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.addAutoRole(params.guildId, executor, params.roleId);
      return result;
    },
  };
}

function createRemoveAutoRoleTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    roleId: Type.String({ description: "Role ID to remove from auto-roles" }),
  });

  return {
    name: "discord_remove_auto_role",
    label: "Remove Auto-Role",
    description: "Remove a role from the list of automatically assigned roles.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);
      const result = await config.removeAutoRole(params.guildId, executor, params.roleId);
      return result;
    },
  };
}

function createUpdateAutomodRulesTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    executorId: Type.String({ description: "The user configuring the bot" }),
    antiSpam: Type.Optional(Type.Boolean({ description: "Enable spam detection" })),
    linkFilter: Type.Optional(Type.Boolean({ description: "Filter non-whitelisted links" })),
    inviteFilter: Type.Optional(Type.Boolean({ description: "Filter Discord invite links" })),
    mentionLimit: Type.Optional(
      Type.Number({
        description: "Max mentions per message",
        minimum: 1,
        maximum: 50,
      }),
    ),
    badWords: Type.Optional(Type.Array(Type.String(), { description: "List of prohibited words" })),
    allowedDomains: Type.Optional(
      Type.Array(Type.String(), { description: "Whitelisted domains for link filter" }),
    ),
  });

  return {
    name: "discord_update_automod_rules",
    label: "Update Auto-Moderation Rules",
    description: "Update auto-moderation rules for spam detection, link filtering, bad words, etc.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const guild = client.guilds.cache.get(params.guildId);
      if (!guild) {
        return { success: false, message: "Server not found" };
      }

      const executor = await guild.members.fetch(params.executorId);

      const rules: Partial<ServerConfigView["automodRules"]> = {};
      if (params.antiSpam !== undefined) rules.antiSpam = params.antiSpam;
      if (params.linkFilter !== undefined) rules.linkFilter = params.linkFilter;
      if (params.inviteFilter !== undefined) rules.inviteFilter = params.inviteFilter;
      if (params.mentionLimit !== undefined) rules.mentionLimit = params.mentionLimit;
      if (params.badWords !== undefined) rules.badWords = params.badWords;
      if (params.allowedDomains !== undefined) rules.allowedDomains = params.allowedDomains;

      const result = await config.updateAutomodRules(params.guildId, executor, rules);
      return result;
    },
  };
}

function createGetConfigTool(config: ConfigManager, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_get_config",
    label: "Get Server Configuration",
    description:
      "Get the current bot configuration for a Discord server, including all module settings, roles, channels, and auto-mod rules.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const serverConfig = await config.getConfig(params.guildId);
      const formatted = config.formatConfig(serverConfig);
      return { success: true, data: serverConfig, formatted };
    },
  };
}
