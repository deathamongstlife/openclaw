import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { DiscordActionConfig } from "../../config/config.js";
import { getPresence } from "../../discord/monitor/presence-cache.js";
import {
  addRoleDiscord,
  createChannelDiscord,
  createScheduledEventDiscord,
  deleteChannelDiscord,
  editChannelDiscord,
  fetchChannelInfoDiscord,
  fetchMemberInfoDiscord,
  fetchRoleInfoDiscord,
  fetchVoiceStatusDiscord,
  hasAnyGuildPermissionDiscord,
  listGuildChannelsDiscord,
  listGuildEmojisDiscord,
  listScheduledEventsDiscord,
  moveChannelDiscord,
  removeChannelPermissionDiscord,
  removeRoleDiscord,
  setChannelPermissionDiscord,
  uploadEmojiDiscord,
  uploadStickerDiscord,
} from "../../discord/send.js";
import {
  createRoleDiscord,
  createVoiceChannelDiscord,
  deleteRoleDiscord,
  deleteScheduledEventDiscord,
  editGuildDiscord,
  editMemberDiscord,
  editRoleDiscord,
  editScheduledEventDiscord,
  editVoiceChannelDiscord,
  fetchAuditLogDiscord,
  fetchGuildSettingsDiscord,
  fetchVoiceActivityDiscord,
  searchMembersDiscord,
} from "../../discord/send.guild-advanced.js";
import { PermissionFlagsBits } from "discord-api-types/v10";
import {
  type ActionGate,
  jsonResult,
  parseAvailableTags,
  readNumberParam,
  readStringArrayParam,
  readStringParam,
} from "./common.js";
import { readDiscordParentIdParam } from "./discord-actions-shared.js";

type DiscordRoleMutation = (params: {
  guildId: string;
  userId: string;
  roleId: string;
}) => Promise<unknown>;
type DiscordRoleMutationWithAccount = (
  params: {
    guildId: string;
    userId: string;
    roleId: string;
  },
  options: { accountId: string },
) => Promise<unknown>;

async function runRoleMutation(params: {
  accountId?: string;
  values: Record<string, unknown>;
  mutate: DiscordRoleMutation & DiscordRoleMutationWithAccount;
}) {
  const guildId = readStringParam(params.values, "guildId", { required: true });
  const userId = readStringParam(params.values, "userId", { required: true });
  const roleId = readStringParam(params.values, "roleId", { required: true });
  if (params.accountId) {
    await params.mutate({ guildId, userId, roleId }, { accountId: params.accountId });
    return;
  }
  await params.mutate({ guildId, userId, roleId });
}

export async function handleDiscordGuildAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  const accountId = readStringParam(params, "accountId");
  switch (action) {
    case "memberInfo": {
      if (!isActionEnabled("memberInfo")) {
        throw new Error("Discord member info is disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const userId = readStringParam(params, "userId", {
        required: true,
      });
      const member = accountId
        ? await fetchMemberInfoDiscord(guildId, userId, { accountId })
        : await fetchMemberInfoDiscord(guildId, userId);
      const presence = getPresence(accountId, userId);
      const activities = presence?.activities ?? undefined;
      const status = presence?.status ?? undefined;
      return jsonResult({ ok: true, member, ...(presence ? { status, activities } : {}) });
    }
    case "roleInfo": {
      if (!isActionEnabled("roleInfo")) {
        throw new Error("Discord role info is disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const roles = accountId
        ? await fetchRoleInfoDiscord(guildId, { accountId })
        : await fetchRoleInfoDiscord(guildId);
      return jsonResult({ ok: true, roles });
    }
    case "emojiList": {
      if (!isActionEnabled("reactions")) {
        throw new Error("Discord reactions are disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const emojis = accountId
        ? await listGuildEmojisDiscord(guildId, { accountId })
        : await listGuildEmojisDiscord(guildId);
      return jsonResult({ ok: true, emojis });
    }
    case "emojiUpload": {
      if (!isActionEnabled("emojiUploads")) {
        throw new Error("Discord emoji uploads are disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const name = readStringParam(params, "name", { required: true });
      const mediaUrl = readStringParam(params, "mediaUrl", {
        required: true,
      });
      const roleIds = readStringArrayParam(params, "roleIds");
      const emoji = accountId
        ? await uploadEmojiDiscord(
            {
              guildId,
              name,
              mediaUrl,
              roleIds: roleIds?.length ? roleIds : undefined,
            },
            { accountId },
          )
        : await uploadEmojiDiscord({
            guildId,
            name,
            mediaUrl,
            roleIds: roleIds?.length ? roleIds : undefined,
          });
      return jsonResult({ ok: true, emoji });
    }
    case "stickerUpload": {
      if (!isActionEnabled("stickerUploads")) {
        throw new Error("Discord sticker uploads are disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const name = readStringParam(params, "name", { required: true });
      const description = readStringParam(params, "description", {
        required: true,
      });
      const tags = readStringParam(params, "tags", { required: true });
      const mediaUrl = readStringParam(params, "mediaUrl", {
        required: true,
      });
      const sticker = accountId
        ? await uploadStickerDiscord(
            {
              guildId,
              name,
              description,
              tags,
              mediaUrl,
            },
            { accountId },
          )
        : await uploadStickerDiscord({
            guildId,
            name,
            description,
            tags,
            mediaUrl,
          });
      return jsonResult({ ok: true, sticker });
    }
    case "roleAdd": {
      if (!isActionEnabled("roles", false)) {
        throw new Error("Discord role changes are disabled.");
      }
      await runRoleMutation({ accountId, values: params, mutate: addRoleDiscord });
      return jsonResult({ ok: true });
    }
    case "roleRemove": {
      if (!isActionEnabled("roles", false)) {
        throw new Error("Discord role changes are disabled.");
      }
      await runRoleMutation({ accountId, values: params, mutate: removeRoleDiscord });
      return jsonResult({ ok: true });
    }
    case "channelInfo": {
      if (!isActionEnabled("channelInfo")) {
        throw new Error("Discord channel info is disabled.");
      }
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const channel = accountId
        ? await fetchChannelInfoDiscord(channelId, { accountId })
        : await fetchChannelInfoDiscord(channelId);
      return jsonResult({ ok: true, channel });
    }
    case "channelList": {
      if (!isActionEnabled("channelInfo")) {
        throw new Error("Discord channel info is disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const channels = accountId
        ? await listGuildChannelsDiscord(guildId, { accountId })
        : await listGuildChannelsDiscord(guildId);
      return jsonResult({ ok: true, channels });
    }
    case "voiceStatus": {
      if (!isActionEnabled("voiceStatus")) {
        throw new Error("Discord voice status is disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const userId = readStringParam(params, "userId", {
        required: true,
      });
      const voice = accountId
        ? await fetchVoiceStatusDiscord(guildId, userId, { accountId })
        : await fetchVoiceStatusDiscord(guildId, userId);
      return jsonResult({ ok: true, voice });
    }
    case "eventList": {
      if (!isActionEnabled("events")) {
        throw new Error("Discord events are disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const events = accountId
        ? await listScheduledEventsDiscord(guildId, { accountId })
        : await listScheduledEventsDiscord(guildId);
      return jsonResult({ ok: true, events });
    }
    case "eventCreate": {
      if (!isActionEnabled("events")) {
        throw new Error("Discord events are disabled.");
      }
      const guildId = readStringParam(params, "guildId", {
        required: true,
      });
      const name = readStringParam(params, "name", { required: true });
      const startTime = readStringParam(params, "startTime", {
        required: true,
      });
      const endTime = readStringParam(params, "endTime");
      const description = readStringParam(params, "description");
      const channelId = readStringParam(params, "channelId");
      const location = readStringParam(params, "location");
      const entityTypeRaw = readStringParam(params, "entityType");
      const entityType = entityTypeRaw === "stage" ? 1 : entityTypeRaw === "external" ? 3 : 2;
      const payload = {
        name,
        description,
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        entity_type: entityType,
        channel_id: channelId,
        entity_metadata: entityType === 3 && location ? { location } : undefined,
        privacy_level: 2,
      };
      const event = accountId
        ? await createScheduledEventDiscord(guildId, payload, { accountId })
        : await createScheduledEventDiscord(guildId, payload);
      return jsonResult({ ok: true, event });
    }
    case "channelCreate": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const type = readNumberParam(params, "type", { integer: true });
      const parentId = readDiscordParentIdParam(params);
      const topic = readStringParam(params, "topic");
      const position = readNumberParam(params, "position", { integer: true });
      const nsfw = params.nsfw as boolean | undefined;
      const channel = accountId
        ? await createChannelDiscord(
            {
              guildId,
              name,
              type: type ?? undefined,
              parentId: parentId ?? undefined,
              topic: topic ?? undefined,
              position: position ?? undefined,
              nsfw,
            },
            { accountId },
          )
        : await createChannelDiscord({
            guildId,
            name,
            type: type ?? undefined,
            parentId: parentId ?? undefined,
            topic: topic ?? undefined,
            position: position ?? undefined,
            nsfw,
          });
      return jsonResult({ ok: true, channel });
    }
    case "channelEdit": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const name = readStringParam(params, "name");
      const topic = readStringParam(params, "topic");
      const position = readNumberParam(params, "position", { integer: true });
      const parentId = readDiscordParentIdParam(params);
      const nsfw = params.nsfw as boolean | undefined;
      const rateLimitPerUser = readNumberParam(params, "rateLimitPerUser", {
        integer: true,
      });
      const archived = typeof params.archived === "boolean" ? params.archived : undefined;
      const locked = typeof params.locked === "boolean" ? params.locked : undefined;
      const autoArchiveDuration = readNumberParam(params, "autoArchiveDuration", {
        integer: true,
      });
      const availableTags = parseAvailableTags(params.availableTags);
      const editPayload = {
        channelId,
        name: name ?? undefined,
        topic: topic ?? undefined,
        position: position ?? undefined,
        parentId,
        nsfw,
        rateLimitPerUser: rateLimitPerUser ?? undefined,
        archived,
        locked,
        autoArchiveDuration: autoArchiveDuration ?? undefined,
        availableTags,
      };
      const channel = accountId
        ? await editChannelDiscord(editPayload, { accountId })
        : await editChannelDiscord(editPayload);
      return jsonResult({ ok: true, channel });
    }
    case "channelDelete": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const result = accountId
        ? await deleteChannelDiscord(channelId, { accountId })
        : await deleteChannelDiscord(channelId);
      return jsonResult(result);
    }
    case "channelMove": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const parentId = readDiscordParentIdParam(params);
      const position = readNumberParam(params, "position", { integer: true });
      if (accountId) {
        await moveChannelDiscord(
          {
            guildId,
            channelId,
            parentId,
            position: position ?? undefined,
          },
          { accountId },
        );
      } else {
        await moveChannelDiscord({
          guildId,
          channelId,
          parentId,
          position: position ?? undefined,
        });
      }
      return jsonResult({ ok: true });
    }
    case "categoryCreate": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const position = readNumberParam(params, "position", { integer: true });
      const channel = accountId
        ? await createChannelDiscord(
            {
              guildId,
              name,
              type: 4,
              position: position ?? undefined,
            },
            { accountId },
          )
        : await createChannelDiscord({
            guildId,
            name,
            type: 4,
            position: position ?? undefined,
          });
      return jsonResult({ ok: true, category: channel });
    }
    case "categoryEdit": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const categoryId = readStringParam(params, "categoryId", {
        required: true,
      });
      const name = readStringParam(params, "name");
      const position = readNumberParam(params, "position", { integer: true });
      const channel = accountId
        ? await editChannelDiscord(
            {
              channelId: categoryId,
              name: name ?? undefined,
              position: position ?? undefined,
            },
            { accountId },
          )
        : await editChannelDiscord({
            channelId: categoryId,
            name: name ?? undefined,
            position: position ?? undefined,
          });
      return jsonResult({ ok: true, category: channel });
    }
    case "categoryDelete": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const categoryId = readStringParam(params, "categoryId", {
        required: true,
      });
      const result = accountId
        ? await deleteChannelDiscord(categoryId, { accountId })
        : await deleteChannelDiscord(categoryId);
      return jsonResult(result);
    }
    case "channelPermissionSet": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const targetId = readStringParam(params, "targetId", { required: true });
      const targetTypeRaw = readStringParam(params, "targetType", {
        required: true,
      });
      const targetType = targetTypeRaw === "member" ? 1 : 0;
      const allow = readStringParam(params, "allow");
      const deny = readStringParam(params, "deny");
      if (accountId) {
        await setChannelPermissionDiscord(
          {
            channelId,
            targetId,
            targetType,
            allow: allow ?? undefined,
            deny: deny ?? undefined,
          },
          { accountId },
        );
      } else {
        await setChannelPermissionDiscord({
          channelId,
          targetId,
          targetType,
          allow: allow ?? undefined,
          deny: deny ?? undefined,
        });
      }
      return jsonResult({ ok: true });
    }
    case "channelPermissionRemove": {
      if (!isActionEnabled("channels")) {
        throw new Error("Discord channel management is disabled.");
      }
      const channelId = readStringParam(params, "channelId", {
        required: true,
      });
      const targetId = readStringParam(params, "targetId", { required: true });
      if (accountId) {
        await removeChannelPermissionDiscord(channelId, targetId, { accountId });
      } else {
        await removeChannelPermissionDiscord(channelId, targetId);
      }
      return jsonResult({ ok: true });
    }
    case "serverSettings": {
      if (!isActionEnabled("serverManagement")) {
        throw new Error("Discord server management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const settings = accountId
        ? await fetchGuildSettingsDiscord(guildId, { accountId })
        : await fetchGuildSettingsDiscord(guildId);
      return jsonResult({ ok: true, settings });
    }
    case "serverEdit": {
      if (!isActionEnabled("serverManagement")) {
        throw new Error("Discord server management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const name = readStringParam(params, "name");
      const iconUrl = readStringParam(params, "iconUrl");
      const verificationLevel = readNumberParam(params, "verificationLevel", { integer: true });
      const defaultMessageNotifications = readNumberParam(params, "defaultMessageNotifications", {
        integer: true,
      });
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ManageGuild],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error("Missing permission: MANAGE_GUILD required for this action");
        }
      }

      const guild = accountId
        ? await editGuildDiscord(
            { guildId, name, iconUrl, verificationLevel, defaultMessageNotifications },
            { accountId },
          )
        : await editGuildDiscord({ guildId, name, iconUrl, verificationLevel, defaultMessageNotifications });
      return jsonResult({ ok: true, guild });
    }
    case "auditLog": {
      if (!isActionEnabled("auditLog")) {
        throw new Error("Discord audit log access is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const actionType = readNumberParam(params, "actionType", { integer: true });
      const userId = readStringParam(params, "userId");
      const limit = readNumberParam(params, "limit", { integer: true }) ?? 50;
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ViewAuditLog],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error("Missing permission: VIEW_AUDIT_LOG required for this action");
        }
      }

      const entries = accountId
        ? await fetchAuditLogDiscord({ guildId, actionType, userId, limit }, { accountId })
        : await fetchAuditLogDiscord({ guildId, actionType, userId, limit });
      return jsonResult({ ok: true, entries });
    }
    case "memberEdit": {
      if (!isActionEnabled("memberManagement")) {
        throw new Error("Discord member management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const userId = readStringParam(params, "userId", { required: true });
      const nickname = readStringParam(params, "nickname");
      const roleIds = readStringArrayParam(params, "roleIds");
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ManageNicknames, PermissionFlagsBits.ManageRoles],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error(
            "Missing permission: MANAGE_NICKNAMES or MANAGE_ROLES required for this action",
          );
        }
      }

      const member = accountId
        ? await editMemberDiscord({ guildId, userId, nickname, roleIds }, { accountId })
        : await editMemberDiscord({ guildId, userId, nickname, roleIds });
      return jsonResult({ ok: true, member });
    }
    case "memberSearch": {
      if (!isActionEnabled("memberInfo")) {
        throw new Error("Discord member info is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const query = readStringParam(params, "query", { required: true });
      const limit = readNumberParam(params, "limit", { integer: true }) ?? 10;

      const members = accountId
        ? await searchMembersDiscord({ guildId, query, limit }, { accountId })
        : await searchMembersDiscord({ guildId, query, limit });
      return jsonResult({ ok: true, members });
    }
    case "roleCreate": {
      if (!isActionEnabled("roleManagement")) {
        throw new Error("Discord role management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const permissions = readStringParam(params, "permissions");
      const color = readNumberParam(params, "color", { integer: true });
      const hoist = params.hoist as boolean | undefined;
      const mentionable = params.mentionable as boolean | undefined;
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ManageRoles],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error("Missing permission: MANAGE_ROLES required for this action");
        }
      }

      const role = accountId
        ? await createRoleDiscord(
            { guildId, name, permissions, color, hoist, mentionable },
            { accountId },
          )
        : await createRoleDiscord({ guildId, name, permissions, color, hoist, mentionable });
      return jsonResult({ ok: true, role });
    }
    case "roleEdit": {
      if (!isActionEnabled("roleManagement")) {
        throw new Error("Discord role management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const roleId = readStringParam(params, "roleId", { required: true });
      const name = readStringParam(params, "name");
      const permissions = readStringParam(params, "permissions");
      const color = readNumberParam(params, "color", { integer: true });
      const position = readNumberParam(params, "position", { integer: true });
      const hoist = params.hoist as boolean | undefined;
      const mentionable = params.mentionable as boolean | undefined;
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ManageRoles],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error("Missing permission: MANAGE_ROLES required for this action");
        }
      }

      const role = accountId
        ? await editRoleDiscord(
            { guildId, roleId, name, permissions, color, position, hoist, mentionable },
            { accountId },
          )
        : await editRoleDiscord({ guildId, roleId, name, permissions, color, position, hoist, mentionable });
      return jsonResult({ ok: true, role });
    }
    case "roleDelete": {
      if (!isActionEnabled("roleManagement")) {
        throw new Error("Discord role management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const roleId = readStringParam(params, "roleId", { required: true });
      const senderUserId = readStringParam(params, "senderUserId");

      if (senderUserId) {
        const hasPermission = await hasAnyGuildPermissionDiscord(
          guildId,
          senderUserId,
          [PermissionFlagsBits.ManageRoles],
          accountId ? { accountId } : undefined,
        );
        if (!hasPermission) {
          throw new Error("Missing permission: MANAGE_ROLES required for this action");
        }
      }

      if (accountId) {
        await deleteRoleDiscord({ guildId, roleId }, { accountId });
      } else {
        await deleteRoleDiscord({ guildId, roleId });
      }
      return jsonResult({ ok: true });
    }
    case "eventEdit": {
      if (!isActionEnabled("events")) {
        throw new Error("Discord events are disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const eventId = readStringParam(params, "eventId", { required: true });
      const name = readStringParam(params, "name");
      const description = readStringParam(params, "description");
      const startTime = readStringParam(params, "startTime");
      const endTime = readStringParam(params, "endTime");
      const status = readNumberParam(params, "status", { integer: true });

      const event = accountId
        ? await editScheduledEventDiscord(
            { guildId, eventId, name, description, startTime, endTime, status },
            { accountId },
          )
        : await editScheduledEventDiscord({ guildId, eventId, name, description, startTime, endTime, status });
      return jsonResult({ ok: true, event });
    }
    case "eventDelete": {
      if (!isActionEnabled("events")) {
        throw new Error("Discord events are disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const eventId = readStringParam(params, "eventId", { required: true });

      if (accountId) {
        await deleteScheduledEventDiscord({ guildId, eventId }, { accountId });
      } else {
        await deleteScheduledEventDiscord({ guildId, eventId });
      }
      return jsonResult({ ok: true });
    }
    case "voiceCreate": {
      if (!isActionEnabled("voiceManagement")) {
        throw new Error("Discord voice management is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });
      const name = readStringParam(params, "name", { required: true });
      const parentId = readStringParam(params, "parentId");
      const bitrate = readNumberParam(params, "bitrate", { integer: true });
      const userLimit = readNumberParam(params, "userLimit", { integer: true });

      const channel = accountId
        ? await createVoiceChannelDiscord(
            { guildId, name, parentId, bitrate, userLimit },
            { accountId },
          )
        : await createVoiceChannelDiscord({ guildId, name, parentId, bitrate, userLimit });
      return jsonResult({ ok: true, channel });
    }
    case "voiceEdit": {
      if (!isActionEnabled("voiceManagement")) {
        throw new Error("Discord voice management is disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const name = readStringParam(params, "name");
      const bitrate = readNumberParam(params, "bitrate", { integer: true });
      const userLimit = readNumberParam(params, "userLimit", { integer: true });

      const channel = accountId
        ? await editVoiceChannelDiscord({ channelId, name, bitrate, userLimit }, { accountId })
        : await editVoiceChannelDiscord({ channelId, name, bitrate, userLimit });
      return jsonResult({ ok: true, channel });
    }
    case "voiceActivity": {
      if (!isActionEnabled("voiceStatus")) {
        throw new Error("Discord voice status is disabled.");
      }
      const guildId = readStringParam(params, "guildId", { required: true });

      const activity = accountId
        ? await fetchVoiceActivityDiscord(guildId, { accountId })
        : await fetchVoiceActivityDiscord(guildId);
      return jsonResult({ ok: true, activity });
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
