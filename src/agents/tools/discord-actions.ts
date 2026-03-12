import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { OpenClawConfig } from "../../config/config.js";
import { createDiscordActionGate } from "../../discord/accounts.js";
import { readStringParam } from "./common.js";
import { handleDiscordAnalyticsAction } from "./discord-actions-analytics.js";
import { handleDiscordGuildAction } from "./discord-actions-guild.js";
import { handleDiscordMessagingAction } from "./discord-actions-messaging.js";
import {
  handleDiscordAutoModAction,
  handleDiscordBulkModerationAction,
  handleDiscordModerationAction,
} from "./discord-actions-moderation.js";
import { handleDiscordPresenceAction } from "./discord-actions-presence.js";
import { handleDiscordWebhookAction } from "./discord-actions-webhooks.js";

const messagingActions = new Set([
  "react",
  "reactions",
  "sticker",
  "poll",
  "permissions",
  "fetchMessage",
  "readMessages",
  "sendMessage",
  "editMessage",
  "deleteMessage",
  "threadCreate",
  "threadList",
  "threadReply",
  "pinMessage",
  "unpinMessage",
  "listPins",
  "searchMessages",
]);

const guildActions = new Set([
  "memberInfo",
  "roleInfo",
  "emojiList",
  "emojiUpload",
  "stickerUpload",
  "roleAdd",
  "roleRemove",
  "channelInfo",
  "channelList",
  "voiceStatus",
  "eventList",
  "eventCreate",
  "channelCreate",
  "channelEdit",
  "channelDelete",
  "channelMove",
  "categoryCreate",
  "categoryEdit",
  "categoryDelete",
  "channelPermissionSet",
  "channelPermissionRemove",
  "serverSettings",
  "serverEdit",
  "auditLog",
  "memberEdit",
  "memberSearch",
  "roleCreate",
  "roleEdit",
  "roleDelete",
  "eventEdit",
  "eventDelete",
  "voiceCreate",
  "voiceEdit",
  "voiceActivity",
]);

const moderationActions = new Set(["timeout", "kick", "ban"]);

const autoModActions = new Set(["automodList", "automodCreate", "automodEdit", "automodDelete"]);

const bulkModerationActions = new Set(["bulkDelete"]);

const webhookActions = new Set([
  "webhookList",
  "webhookCreate",
  "webhookEdit",
  "webhookDelete",
  "webhookTest",
]);

const analyticsActions = new Set([
  "channelActivity",
  "findInactiveChannels",
  "suggestChannelOrg",
  "roleHierarchy",
  "roleConflicts",
  "suggestRoleOpt",
  "memberActivity",
  "joinLeaveStats",
  "topContributors",
]);

const presenceActions = new Set(["setPresence"]);

export async function handleDiscordAction(
  params: Record<string, unknown>,
  cfg: OpenClawConfig,
  options?: {
    mediaLocalRoots?: readonly string[];
  },
): Promise<AgentToolResult<unknown>> {
  const action = readStringParam(params, "action", { required: true });
  const accountId = readStringParam(params, "accountId");
  const isActionEnabled = createDiscordActionGate({ cfg, accountId });

  if (messagingActions.has(action)) {
    return await handleDiscordMessagingAction(action, params, isActionEnabled, options, cfg);
  }
  if (guildActions.has(action)) {
    return await handleDiscordGuildAction(action, params, isActionEnabled);
  }
  if (moderationActions.has(action)) {
    return await handleDiscordModerationAction(action, params, isActionEnabled);
  }
  if (autoModActions.has(action)) {
    return await handleDiscordAutoModAction(action, params, isActionEnabled);
  }
  if (bulkModerationActions.has(action)) {
    return await handleDiscordBulkModerationAction(action, params, isActionEnabled);
  }
  if (webhookActions.has(action)) {
    return await handleDiscordWebhookAction(action, params, isActionEnabled);
  }
  if (analyticsActions.has(action)) {
    return await handleDiscordAnalyticsAction(action, params, isActionEnabled);
  }
  if (presenceActions.has(action)) {
    return await handleDiscordPresenceAction(action, params, isActionEnabled);
  }
  throw new Error(`Unknown action: ${action}`);
}
