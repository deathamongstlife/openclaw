import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import { PermissionFlagsBits } from "discord-api-types/v10";
import type { DiscordActionConfig } from "../../config/config.js";
import { hasAnyGuildPermissionDiscord } from "../../discord/send.js";
import {
  createWebhookDiscord,
  deleteWebhookDiscord,
  editWebhookDiscord,
  executeWebhookDiscord,
  listWebhooksDiscord,
} from "../../discord/send.webhooks.js";
import { type ActionGate, jsonResult, readStringParam } from "./common.js";

async function verifySenderWebhookPermission(params: {
  guildId: string;
  senderUserId?: string;
  accountId?: string;
}) {
  if (!params.senderUserId) {
    return;
  }
  const hasPermission = await hasAnyGuildPermissionDiscord(
    params.guildId,
    params.senderUserId,
    [PermissionFlagsBits.ManageWebhooks],
    params.accountId ? { accountId: params.accountId } : undefined,
  );
  if (!hasPermission) {
    throw new Error("Missing permission: MANAGE_WEBHOOKS required for this action");
  }
}

export async function handleDiscordWebhookAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  if (!isActionEnabled("webhookManagement")) {
    throw new Error("Discord webhook management is disabled.");
  }

  const accountId = readStringParam(params, "accountId");
  const senderUserId = readStringParam(params, "senderUserId");

  switch (action) {
    case "webhookList": {
      const channelId = readStringParam(params, "channelId", { required: true });
      const webhooks = accountId
        ? await listWebhooksDiscord(channelId, { accountId })
        : await listWebhooksDiscord(channelId);
      return jsonResult({ ok: true, webhooks });
    }

    case "webhookCreate": {
      const channelId = readStringParam(params, "channelId", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const avatarUrl = readStringParam(params, "avatarUrl");
      const guildId = readStringParam(params, "guildId", { required: true });

      await verifySenderWebhookPermission({ guildId, senderUserId, accountId });

      const webhook = accountId
        ? await createWebhookDiscord({ channelId, name, avatarUrl }, { accountId })
        : await createWebhookDiscord({ channelId, name, avatarUrl });

      return jsonResult({ ok: true, webhook });
    }

    case "webhookEdit": {
      const webhookId = readStringParam(params, "webhookId", { required: true });
      const name = readStringParam(params, "name");
      const avatarUrl = readStringParam(params, "avatarUrl");
      const channelId = readStringParam(params, "channelId");
      const guildId = readStringParam(params, "guildId", { required: true });

      await verifySenderWebhookPermission({ guildId, senderUserId, accountId });

      const webhook = accountId
        ? await editWebhookDiscord({ webhookId, name, avatarUrl, channelId }, { accountId })
        : await editWebhookDiscord({ webhookId, name, avatarUrl, channelId });

      return jsonResult({ ok: true, webhook });
    }

    case "webhookDelete": {
      const webhookId = readStringParam(params, "webhookId", { required: true });
      const guildId = readStringParam(params, "guildId", { required: true });

      await verifySenderWebhookPermission({ guildId, senderUserId, accountId });

      if (accountId) {
        await deleteWebhookDiscord(webhookId, { accountId });
      } else {
        await deleteWebhookDiscord(webhookId);
      }

      return jsonResult({ ok: true });
    }

    case "webhookTest": {
      const webhookId = readStringParam(params, "webhookId", { required: true });
      const webhookToken = readStringParam(params, "webhookToken", { required: true });
      const content = readStringParam(params, "content", { required: true });
      const username = readStringParam(params, "username");
      const avatarUrl = readStringParam(params, "avatarUrl");

      const result = accountId
        ? await executeWebhookDiscord(
            { webhookId, webhookToken, content, username, avatarUrl },
            { accountId },
          )
        : await executeWebhookDiscord({ webhookId, webhookToken, content, username, avatarUrl });

      return jsonResult({ ok: true, result });
    }

    default:
      throw new Error(`Unknown webhook action: ${action}`);
  }
}
