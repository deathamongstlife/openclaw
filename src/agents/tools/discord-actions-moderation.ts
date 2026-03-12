import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { DiscordActionConfig } from "../../config/config.js";
import { PermissionFlagsBits } from "discord-api-types/v10";
import {
  banMemberDiscord,
  hasAnyGuildPermissionDiscord,
  kickMemberDiscord,
  timeoutMemberDiscord,
} from "../../discord/send.js";
import {
  bulkDeleteMessagesDiscord,
  createAutoModRuleDiscord,
  deleteAutoModRuleDiscord,
  editAutoModRuleDiscord,
  listAutoModRulesDiscord,
} from "../../discord/send.moderation-advanced.js";
import {
  type ActionGate,
  jsonResult,
  readNumberParam,
  readStringArrayParam,
  readStringParam,
} from "./common.js";
import {
  isDiscordModerationAction,
  readDiscordModerationCommand,
  requiredGuildPermissionForModerationAction,
} from "./discord-actions-moderation-shared.js";

async function verifySenderModerationPermission(params: {
  guildId: string;
  senderUserId?: string;
  requiredPermission: bigint;
  accountId?: string;
}) {
  // CLI/manual flows may not have sender context; enforce only when present.
  if (!params.senderUserId) {
    return;
  }
  const hasPermission = await hasAnyGuildPermissionDiscord(
    params.guildId,
    params.senderUserId,
    [params.requiredPermission],
    params.accountId ? { accountId: params.accountId } : undefined,
  );
  if (!hasPermission) {
    throw new Error("Sender does not have required permissions for this moderation action.");
  }
}

export async function handleDiscordModerationAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  if (!isDiscordModerationAction(action)) {
    throw new Error(`Unknown action: ${action}`);
  }
  if (!isActionEnabled("moderation", false)) {
    throw new Error("Discord moderation is disabled.");
  }
  const command = readDiscordModerationCommand(action, params);
  const accountId = readStringParam(params, "accountId");
  const senderUserId = readStringParam(params, "senderUserId");
  await verifySenderModerationPermission({
    guildId: command.guildId,
    senderUserId,
    requiredPermission: requiredGuildPermissionForModerationAction(command.action),
    accountId,
  });
  switch (command.action) {
    case "timeout": {
      const member = accountId
        ? await timeoutMemberDiscord(
            {
              guildId: command.guildId,
              userId: command.userId,
              durationMinutes: command.durationMinutes,
              until: command.until,
              reason: command.reason,
            },
            { accountId },
          )
        : await timeoutMemberDiscord({
            guildId: command.guildId,
            userId: command.userId,
            durationMinutes: command.durationMinutes,
            until: command.until,
            reason: command.reason,
          });
      return jsonResult({ ok: true, member });
    }
    case "kick": {
      if (accountId) {
        await kickMemberDiscord(
          {
            guildId: command.guildId,
            userId: command.userId,
            reason: command.reason,
          },
          { accountId },
        );
      } else {
        await kickMemberDiscord({
          guildId: command.guildId,
          userId: command.userId,
          reason: command.reason,
        });
      }
      return jsonResult({ ok: true });
    }
    case "ban": {
      if (accountId) {
        await banMemberDiscord(
          {
            guildId: command.guildId,
            userId: command.userId,
            reason: command.reason,
            deleteMessageDays: command.deleteMessageDays,
          },
          { accountId },
        );
      } else {
        await banMemberDiscord({
          guildId: command.guildId,
          userId: command.userId,
          reason: command.reason,
          deleteMessageDays: command.deleteMessageDays,
        });
      }
      return jsonResult({ ok: true });
    }
  }
}

export async function handleDiscordAutoModAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  if (!isActionEnabled("autoModeration")) {
    throw new Error("Discord automod is disabled.");
  }

  const accountId = readStringParam(params, "accountId");
  const senderUserId = readStringParam(params, "senderUserId");
  const guildId = readStringParam(params, "guildId", { required: true });

  async function verifyAutoModPermission() {
    if (!senderUserId) {
      return;
    }
    const hasPermission = await hasAnyGuildPermissionDiscord(
      guildId,
      senderUserId,
      [PermissionFlagsBits.ManageGuild],
      accountId ? { accountId } : undefined,
    );
    if (!hasPermission) {
      throw new Error("Missing permission: MANAGE_GUILD required for automod actions");
    }
  }

  switch (action) {
    case "automodList": {
      const rules = accountId
        ? await listAutoModRulesDiscord(guildId, { accountId })
        : await listAutoModRulesDiscord(guildId);
      return jsonResult({ ok: true, rules });
    }
    case "automodCreate": {
      await verifyAutoModPermission();
      const name = readStringParam(params, "name", { required: true });
      const eventType = readNumberParam(params, "eventType", { integer: true });
      const triggerType = readNumberParam(params, "triggerType", { integer: true });

      if (eventType === undefined || triggerType === undefined) {
        throw new Error("eventType and triggerType are required for automod rule creation");
      }

      const triggerMetadata = params.triggerMetadata as Record<string, unknown> | undefined;
      const actions = params.actions as unknown[] | undefined;
      const enabled = params.enabled as boolean | undefined;
      const exemptRoles = readStringArrayParam(params, "exemptRoles");
      const exemptChannels = readStringArrayParam(params, "exemptChannels");

      const rule = accountId
        ? await createAutoModRuleDiscord(
            {
              guildId,
              name,
              eventType,
              triggerType,
              triggerMetadata,
              actions,
              enabled,
              exemptRoles,
              exemptChannels,
            },
            { accountId },
          )
        : await createAutoModRuleDiscord({
            guildId,
            name,
            eventType,
            triggerType,
            triggerMetadata,
            actions,
            enabled,
            exemptRoles,
            exemptChannels,
          });
      return jsonResult({ ok: true, rule });
    }
    case "automodEdit": {
      await verifyAutoModPermission();
      const ruleId = readStringParam(params, "ruleId", { required: true });
      const name = readStringParam(params, "name");
      const eventType = readNumberParam(params, "eventType", { integer: true });
      const triggerMetadata = params.triggerMetadata as Record<string, unknown> | undefined;
      const actions = params.actions as unknown[] | undefined;
      const enabled = params.enabled as boolean | undefined;
      const exemptRoles = readStringArrayParam(params, "exemptRoles");
      const exemptChannels = readStringArrayParam(params, "exemptChannels");

      const rule = accountId
        ? await editAutoModRuleDiscord(
            {
              guildId,
              ruleId,
              name,
              eventType,
              triggerMetadata,
              actions,
              enabled,
              exemptRoles,
              exemptChannels,
            },
            { accountId },
          )
        : await editAutoModRuleDiscord({
            guildId,
            ruleId,
            name,
            eventType,
            triggerMetadata,
            actions,
            enabled,
            exemptRoles,
            exemptChannels,
          });
      return jsonResult({ ok: true, rule });
    }
    case "automodDelete": {
      await verifyAutoModPermission();
      const ruleId = readStringParam(params, "ruleId", { required: true });

      if (accountId) {
        await deleteAutoModRuleDiscord({ guildId, ruleId }, { accountId });
      } else {
        await deleteAutoModRuleDiscord({ guildId, ruleId });
      }
      return jsonResult({ ok: true });
    }
    default:
      throw new Error(`Unknown automod action: ${action}`);
  }
}

export async function handleDiscordBulkModerationAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  if (!isActionEnabled("bulkModeration")) {
    throw new Error("Discord bulk moderation is disabled.");
  }

  const accountId = readStringParam(params, "accountId");
  const senderUserId = readStringParam(params, "senderUserId");

  switch (action) {
    case "bulkDelete": {
      const channelId = readStringParam(params, "channelId", { required: true });
      const messageIds = readStringArrayParam(params, "messageIds");
      const limit = readNumberParam(params, "limit", { integer: true });
      const beforeId = readStringParam(params, "beforeId");
      const afterId = readStringParam(params, "afterId");

      if (senderUserId && messageIds && messageIds.length > 0) {
        // Need to fetch channel to get guild ID for permission check
        // For simplicity, we'll require the caller to provide guildId
        const guildId = readStringParam(params, "guildId");
        if (guildId) {
          const hasPermission = await hasAnyGuildPermissionDiscord(
            guildId,
            senderUserId,
            [PermissionFlagsBits.ManageMessages],
            accountId ? { accountId } : undefined,
          );
          if (!hasPermission) {
            throw new Error("Missing permission: MANAGE_MESSAGES required for bulk delete");
          }
        }
      }

      const result = accountId
        ? await bulkDeleteMessagesDiscord(
            { channelId, messageIds, limit, beforeId, afterId },
            { accountId },
          )
        : await bulkDeleteMessagesDiscord({ channelId, messageIds, limit, beforeId, afterId });
      return jsonResult({ ok: true, deletedCount: result.deletedCount });
    }
    default:
      throw new Error(`Unknown bulk moderation action: ${action}`);
  }
}
