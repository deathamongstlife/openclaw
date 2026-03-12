import type { APIWebhook } from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import { resolveDiscordRest } from "./send.shared.js";
import type { DiscordReactOpts } from "./send.types.js";

export type DiscordWebhookCreate = {
  channelId: string;
  name: string;
  avatarUrl?: string;
};

export type DiscordWebhookEdit = {
  webhookId: string;
  name?: string;
  avatarUrl?: string;
  channelId?: string;
};

export type DiscordWebhookExecute = {
  webhookId: string;
  webhookToken: string;
  content: string;
  username?: string;
  avatarUrl?: string;
};

export async function listWebhooksDiscord(
  channelId: string,
  opts: DiscordReactOpts = {},
): Promise<APIWebhook[]> {
  const rest = resolveDiscordRest(opts);
  return (await rest.get(Routes.channelWebhooks(channelId))) as APIWebhook[];
}

export async function createWebhookDiscord(
  payload: DiscordWebhookCreate,
  opts: DiscordReactOpts = {},
): Promise<APIWebhook> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {
    name: payload.name,
  };

  if (payload.avatarUrl) {
    body.avatar = payload.avatarUrl;
  }

  return (await rest.post(Routes.channelWebhooks(payload.channelId), { body })) as APIWebhook;
}

export async function editWebhookDiscord(
  payload: DiscordWebhookEdit,
  opts: DiscordReactOpts = {},
): Promise<APIWebhook> {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {};

  if (payload.name) {
    body.name = payload.name;
  }
  if (payload.avatarUrl) {
    body.avatar = payload.avatarUrl;
  }
  if (payload.channelId) {
    body.channel_id = payload.channelId;
  }

  return (await rest.patch(Routes.webhook(payload.webhookId), { body })) as APIWebhook;
}

export async function deleteWebhookDiscord(webhookId: string, opts: DiscordReactOpts = {}) {
  const rest = resolveDiscordRest(opts);
  await rest.delete(Routes.webhook(webhookId));
  return { ok: true };
}

export async function executeWebhookDiscord(
  payload: DiscordWebhookExecute,
  opts: DiscordReactOpts = {},
) {
  const rest = resolveDiscordRest(opts);
  const body: Record<string, unknown> = {
    content: payload.content,
  };

  if (payload.username) {
    body.username = payload.username;
  }
  if (payload.avatarUrl) {
    body.avatar_url = payload.avatarUrl;
  }

  return await rest.post(Routes.webhook(payload.webhookId, payload.webhookToken), { body });
}
