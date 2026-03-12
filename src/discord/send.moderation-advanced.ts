import type { APIAutoModerationRule } from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import { resolveDiscordRest } from "./send.shared.js";
import type { DiscordReactOpts } from "./send.types.js";

export type DiscordAutoModRuleCreate = {
  guildId: string;
  name: string;
  eventType: number;
  triggerType: number;
  triggerMetadata?: Record<string, unknown>;
  actions?: unknown[];
  enabled?: boolean;
  exemptRoles?: string[];
  exemptChannels?: string[];
};

export type DiscordAutoModRuleEdit = {
  guildId: string;
  ruleId: string;
  name?: string;
  eventType?: number;
  triggerMetadata?: Record<string, unknown>;
  actions?: unknown[];
  enabled?: boolean;
  exemptRoles?: string[];
  exemptChannels?: string[];
};

export type DiscordAutoModRuleDelete = {
  guildId: string;
  ruleId: string;
};

export type DiscordBulkDelete = {
  channelId: string;
  messageIds?: string[];
  limit?: number;
  beforeId?: string;
  afterId?: string;
};

export async function listAutoModRulesDiscord(
  guildId: string,
  opts: DiscordReactOpts = {},
): Promise<APIAutoModerationRule[]> {
  const rest = resolveDiscordRest(opts);
  return (await rest.get(Routes.guildAutoModerationRules(guildId))) as APIAutoModerationRule[];
}

export async function createAutoModRuleDiscord(
  payload: DiscordAutoModRuleCreate,
  opts: DiscordReactOpts = {},
): Promise<APIAutoModerationRule> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {
    name: payload.name,
    event_type: payload.eventType,
    trigger_type: payload.triggerType,
  };

  if (payload.triggerMetadata) {
    body.trigger_metadata = payload.triggerMetadata;
  }
  if (payload.actions) {
    body.actions = payload.actions;
  }
  if (typeof payload.enabled === "boolean") {
    body.enabled = payload.enabled;
  }
  if (payload.exemptRoles) {
    body.exempt_roles = payload.exemptRoles;
  }
  if (payload.exemptChannels) {
    body.exempt_channels = payload.exemptChannels;
  }

  return (await rest.post(Routes.guildAutoModerationRules(payload.guildId), {
    body,
  })) as APIAutoModerationRule;
}

export async function editAutoModRuleDiscord(
  payload: DiscordAutoModRuleEdit,
  opts: DiscordReactOpts = {},
): Promise<APIAutoModerationRule> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (typeof payload.eventType === "number") {
    body.event_type = payload.eventType;
  }
  if (payload.triggerMetadata) {
    body.trigger_metadata = payload.triggerMetadata;
  }
  if (payload.actions) {
    body.actions = payload.actions;
  }
  if (typeof payload.enabled === "boolean") {
    body.enabled = payload.enabled;
  }
  if (payload.exemptRoles) {
    body.exempt_roles = payload.exemptRoles;
  }
  if (payload.exemptChannels) {
    body.exempt_channels = payload.exemptChannels;
  }

  return (await rest.patch(Routes.guildAutoModerationRule(payload.guildId, payload.ruleId), {
    body,
  })) as APIAutoModerationRule;
}

export async function deleteAutoModRuleDiscord(
  payload: DiscordAutoModRuleDelete,
  opts: DiscordReactOpts = {},
) {
  const rest = resolveDiscordRest(opts);
  await rest.delete(Routes.guildAutoModerationRule(payload.guildId, payload.ruleId));
  return { ok: true };
}

export async function bulkDeleteMessagesDiscord(
  payload: DiscordBulkDelete,
  opts: DiscordReactOpts = {},
): Promise<{ deletedCount: number }> {
  const rest = resolveDiscordRest(opts);

  if (payload.messageIds && payload.messageIds.length > 0) {
    const messageIds = payload.messageIds.slice(0, 100);
    await rest.post(Routes.channelBulkDelete(payload.channelId), {
      body: { messages: messageIds },
    });
    return { deletedCount: messageIds.length };
  }

  return { deletedCount: 0 };
}
