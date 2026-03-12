import type {
  APIAuditLogEntry,
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIGuildScheduledEvent,
  APIRole,
  APIVoiceState,
} from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import { resolveDiscordRest } from "./send.shared.js";
import type { DiscordReactOpts } from "./send.types.js";

export type DiscordGuildEdit = {
  guildId: string;
  name?: string;
  iconUrl?: string;
  verificationLevel?: number;
  defaultMessageNotifications?: number;
};

export type DiscordAuditLogQuery = {
  guildId: string;
  actionType?: number;
  userId?: string;
  limit?: number;
};

export type DiscordMemberEdit = {
  guildId: string;
  userId: string;
  nickname?: string;
  roleIds?: string[];
};

export type DiscordMemberSearch = {
  guildId: string;
  query: string;
  limit?: number;
};

export type DiscordRoleCreate = {
  guildId: string;
  name: string;
  permissions?: string;
  color?: number;
  hoist?: boolean;
  mentionable?: boolean;
};

export type DiscordRoleEdit = {
  guildId: string;
  roleId: string;
  name?: string;
  permissions?: string;
  color?: number;
  position?: number;
  hoist?: boolean;
  mentionable?: boolean;
};

export type DiscordRoleDelete = {
  guildId: string;
  roleId: string;
};

export type DiscordScheduledEventEdit = {
  guildId: string;
  eventId: string;
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
};

export type DiscordScheduledEventDelete = {
  guildId: string;
  eventId: string;
};

export type DiscordVoiceChannelCreate = {
  guildId: string;
  name: string;
  parentId?: string;
  bitrate?: number;
  userLimit?: number;
};

export type DiscordVoiceChannelEdit = {
  channelId: string;
  name?: string;
  bitrate?: number;
  userLimit?: number;
};

export async function fetchGuildSettingsDiscord(
  guildId: string,
  opts: DiscordReactOpts = {},
): Promise<APIGuild> {
  const rest = resolveDiscordRest(opts);
  return (await rest.get(Routes.guild(guildId))) as APIGuild;
}

export async function editGuildDiscord(
  payload: DiscordGuildEdit,
  opts: DiscordReactOpts = {},
): Promise<APIGuild> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (payload.iconUrl) {
    body.icon = payload.iconUrl;
  }
  if (typeof payload.verificationLevel === "number") {
    body.verification_level = payload.verificationLevel;
  }
  if (typeof payload.defaultMessageNotifications === "number") {
    body.default_message_notifications = payload.defaultMessageNotifications;
  }

  return (await rest.patch(Routes.guild(payload.guildId), { body })) as APIGuild;
}

export async function fetchAuditLogDiscord(
  query: DiscordAuditLogQuery,
  opts: DiscordReactOpts = {},
): Promise<APIAuditLogEntry[]> {
  const rest = resolveDiscordRest(opts);
  const params = new URLSearchParams();

  if (query.actionType !== undefined) {
    params.set("action_type", query.actionType.toString());
  }
  if (query.userId) {
    params.set("user_id", query.userId);
  }
  if (query.limit) {
    params.set("limit", query.limit.toString());
  }

  const url = `${Routes.guildAuditLog(query.guildId)}?${params.toString()}`;
  const response = (await rest.get(url)) as { audit_log_entries?: APIAuditLogEntry[] };
  return response.audit_log_entries ?? [];
}

export async function editMemberDiscord(
  payload: DiscordMemberEdit,
  opts: DiscordReactOpts = {},
): Promise<APIGuildMember> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.nickname !== undefined) {
    body.nick = payload.nickname;
  }
  if (payload.roleIds) {
    body.roles = payload.roleIds;
  }

  return (await rest.patch(Routes.guildMember(payload.guildId, payload.userId), { body })) as APIGuildMember;
}

export async function searchMembersDiscord(
  query: DiscordMemberSearch,
  opts: DiscordReactOpts = {},
): Promise<APIGuildMember[]> {
  const rest = resolveDiscordRest(opts);
  const params = new URLSearchParams();
  params.set("query", query.query);
  params.set("limit", (query.limit ?? 10).toString());

  const url = `${Routes.guildMembersSearch(query.guildId)}?${params.toString()}`;
  return (await rest.get(url)) as APIGuildMember[];
}

export async function createRoleDiscord(
  payload: DiscordRoleCreate,
  opts: DiscordReactOpts = {},
): Promise<APIRole> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {
    name: payload.name,
  };

  if (payload.permissions) {
    body.permissions = payload.permissions;
  }
  if (typeof payload.color === "number") {
    body.color = payload.color;
  }
  if (typeof payload.hoist === "boolean") {
    body.hoist = payload.hoist;
  }
  if (typeof payload.mentionable === "boolean") {
    body.mentionable = payload.mentionable;
  }

  return (await rest.post(Routes.guildRoles(payload.guildId), { body })) as APIRole;
}

export async function editRoleDiscord(
  payload: DiscordRoleEdit,
  opts: DiscordReactOpts = {},
): Promise<APIRole> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (payload.permissions) {
    body.permissions = payload.permissions;
  }
  if (typeof payload.color === "number") {
    body.color = payload.color;
  }
  if (typeof payload.position === "number") {
    body.position = payload.position;
  }
  if (typeof payload.hoist === "boolean") {
    body.hoist = payload.hoist;
  }
  if (typeof payload.mentionable === "boolean") {
    body.mentionable = payload.mentionable;
  }

  return (await rest.patch(Routes.guildRole(payload.guildId, payload.roleId), { body })) as APIRole;
}

export async function deleteRoleDiscord(payload: DiscordRoleDelete, opts: DiscordReactOpts = {}) {
  const rest = resolveDiscordRest(opts);
  await rest.delete(Routes.guildRole(payload.guildId, payload.roleId));
  return { ok: true };
}

export async function editScheduledEventDiscord(
  payload: DiscordScheduledEventEdit,
  opts: DiscordReactOpts = {},
): Promise<APIGuildScheduledEvent> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (payload.description !== undefined) {
    body.description = payload.description;
  }
  if (payload.startTime) {
    body.scheduled_start_time = payload.startTime;
  }
  if (payload.endTime) {
    body.scheduled_end_time = payload.endTime;
  }
  if (typeof payload.status === "number") {
    body.status = payload.status;
  }

  return (await rest.patch(Routes.guildScheduledEvent(payload.guildId, payload.eventId), {
    body,
  })) as APIGuildScheduledEvent;
}

export async function deleteScheduledEventDiscord(
  payload: DiscordScheduledEventDelete,
  opts: DiscordReactOpts = {},
) {
  const rest = resolveDiscordRest(opts);
  await rest.delete(Routes.guildScheduledEvent(payload.guildId, payload.eventId));
  return { ok: true };
}

export async function createVoiceChannelDiscord(
  payload: DiscordVoiceChannelCreate,
  opts: DiscordReactOpts = {},
): Promise<APIChannel> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {
    name: payload.name,
    type: 2,
  };

  if (payload.parentId) {
    body.parent_id = payload.parentId;
  }
  if (typeof payload.bitrate === "number") {
    body.bitrate = payload.bitrate;
  }
  if (typeof payload.userLimit === "number") {
    body.user_limit = payload.userLimit;
  }

  return (await rest.post(Routes.guildChannels(payload.guildId), { body })) as APIChannel;
}

export async function editVoiceChannelDiscord(
  payload: DiscordVoiceChannelEdit,
  opts: DiscordReactOpts = {},
): Promise<APIChannel> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (typeof payload.bitrate === "number") {
    body.bitrate = payload.bitrate;
  }
  if (typeof payload.userLimit === "number") {
    body.user_limit = payload.userLimit;
  }

  return (await rest.patch(Routes.channel(payload.channelId), { body })) as APIChannel;
}

export async function fetchVoiceActivityDiscord(
  guildId: string,
  opts: DiscordReactOpts = {},
): Promise<APIVoiceState[]> {
  const rest = resolveDiscordRest(opts);
  return (await rest.get(Routes.guildVoiceStates(guildId))) as APIVoiceState[];
}
