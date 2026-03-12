import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { DiscordActionConfig } from "../../config/config.js";
import {
  fetchRoleInfoDiscord,
  listGuildChannelsDiscord,
  readMessagesDiscord,
} from "../../discord/send.js";
import { type ActionGate, jsonResult, readNumberParam, readStringParam } from "./common.js";

/**
 * Analyzes message frequency, active users, and peak times for a channel.
 */
async function handleChannelActivity(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const channelId = readStringParam(params, "channelId", { required: true });
  const limit = readNumberParam(params, "limit", { integer: true }) ?? 100;
  const daysBack = readNumberParam(params, "daysBack", { integer: true }) ?? 7;

  const messages = accountId
    ? await readMessagesDiscord({ channelId, limit }, { accountId })
    : await readMessagesDiscord({ channelId, limit });

  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const recentMessages = messages.filter((msg) => {
    const timestamp = new Date(msg.timestamp).getTime();
    return timestamp >= cutoff;
  });

  const userCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();

  for (const msg of recentMessages) {
    const authorId = msg.author?.id;
    if (authorId) {
      userCounts.set(authorId, (userCounts.get(authorId) ?? 0) + 1);
    }

    const hour = new Date(msg.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  const topUsers = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, messageCount: count }));

  const peakHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hour, count]) => ({ hour, messageCount: count }));

  return jsonResult({
    ok: true,
    channelId,
    daysAnalyzed: daysBack,
    totalMessages: recentMessages.length,
    uniqueUsers: userCounts.size,
    topUsers,
    peakHours,
    averageMessagesPerDay: recentMessages.length / daysBack,
  });
}

/**
 * Finds channels with no activity in N days.
 */
async function handleFindInactiveChannels(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });
  const inactiveDays = readNumberParam(params, "inactiveDays", { integer: true }) ?? 30;

  const channels = accountId
    ? await listGuildChannelsDiscord(guildId, { accountId })
    : await listGuildChannelsDiscord(guildId);

  const cutoff = Date.now() - inactiveDays * 24 * 60 * 60 * 1000;
  const inactiveChannels: Array<{ id: string; name: string; type: number; lastActivity?: string }> =
    [];

  for (const channel of channels) {
    if ("type" in channel && (channel.type === 0 || channel.type === 5)) {
      try {
        const messages = accountId
          ? await readMessagesDiscord({ channelId: channel.id, limit: 1 }, { accountId })
          : await readMessagesDiscord({ channelId: channel.id, limit: 1 });

        if (messages.length === 0) {
          inactiveChannels.push({
            id: channel.id,
            name: "name" in channel ? (channel.name ?? "unknown") : "unknown",
            type: channel.type,
          });
        } else {
          const lastMessageTime = new Date(messages[0].timestamp).getTime();
          if (lastMessageTime < cutoff) {
            inactiveChannels.push({
              id: channel.id,
              name: "name" in channel ? (channel.name ?? "unknown") : "unknown",
              type: channel.type,
              lastActivity: messages[0].timestamp,
            });
          }
        }
      } catch {
        // Channel not accessible or no read permissions
        continue;
      }
    }
  }

  return jsonResult({
    ok: true,
    guildId,
    inactiveDays,
    inactiveChannels,
    totalInactive: inactiveChannels.length,
  });
}

/**
 * Provides AI suggestions for channel structure improvements.
 */
async function handleSuggestChannelOrg(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });

  const channels = accountId
    ? await listGuildChannelsDiscord(guildId, { accountId })
    : await listGuildChannelsDiscord(guildId);

  const categories = channels.filter((ch) => "type" in ch && ch.type === 4);
  const textChannels = channels.filter((ch) => "type" in ch && ch.type === 0);
  const voiceChannels = channels.filter((ch) => "type" in ch && ch.type === 2);

  const uncategorized = channels.filter(
    (ch) => "parent_id" in ch && !ch.parent_id && "type" in ch && ch.type !== 4,
  );

  const suggestions: string[] = [];

  if (uncategorized.length > 5) {
    suggestions.push(
      `${uncategorized.length} uncategorized channels detected. Consider organizing into categories.`,
    );
  }

  if (textChannels.length > 20) {
    suggestions.push(
      `${textChannels.length} text channels is quite large. Consider archiving inactive channels or creating subcategories.`,
    );
  }

  if (categories.length === 0 && channels.length > 10) {
    suggestions.push("No categories found. Creating categories can improve server organization.");
  }

  const channelsByCategory = new Map<string, number>();
  for (const ch of channels) {
    if ("parent_id" in ch && ch.parent_id) {
      channelsByCategory.set(ch.parent_id, (channelsByCategory.get(ch.parent_id) ?? 0) + 1);
    }
  }

  for (const [categoryId, count] of channelsByCategory.entries()) {
    if (count > 15) {
      const category = channels.find((ch) => ch.id === categoryId);
      const categoryName = category && "name" in category ? category.name : "Unknown";
      suggestions.push(`Category "${categoryName}" has ${count} channels. Consider splitting it.`);
    }
  }

  return jsonResult({
    ok: true,
    guildId,
    statistics: {
      totalChannels: channels.length,
      categories: categories.length,
      textChannels: textChannels.length,
      voiceChannels: voiceChannels.length,
      uncategorized: uncategorized.length,
    },
    suggestions,
  });
}

/**
 * Visualizes role hierarchy and permission structure.
 */
async function handleRoleHierarchy(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });

  const roles = accountId
    ? await fetchRoleInfoDiscord(guildId, { accountId })
    : await fetchRoleInfoDiscord(guildId);

  const sortedRoles = roles.sort((a, b) => b.position - a.position);

  const hierarchy = sortedRoles.map((role) => ({
    id: role.id,
    name: role.name,
    position: role.position,
    color: role.color,
    permissions: role.permissions,
    managed: role.managed,
    mentionable: role.mentionable,
    hoist: role.hoist,
  }));

  return jsonResult({
    ok: true,
    guildId,
    totalRoles: roles.length,
    hierarchy,
  });
}

/**
 * Detects permission conflicts between roles.
 */
async function handleRoleConflicts(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });

  const roles = accountId
    ? await fetchRoleInfoDiscord(guildId, { accountId })
    : await fetchRoleInfoDiscord(guildId);

  const conflicts: Array<{
    type: string;
    description: string;
    roles: Array<{ id: string; name: string }>;
  }> = [];

  const ADMINISTRATOR = 0x8n;
  const adminRoles = roles.filter((role) => (BigInt(role.permissions) & ADMINISTRATOR) === ADMINISTRATOR);

  if (adminRoles.length > 3) {
    conflicts.push({
      type: "excessive_admins",
      description: `${adminRoles.length} roles have Administrator permission. This is a security risk.`,
      roles: adminRoles.map((r) => ({ id: r.id, name: r.name })),
    });
  }

  const duplicateNames = new Map<string, typeof roles>();
  for (const role of roles) {
    const existing = duplicateNames.get(role.name.toLowerCase());
    if (existing) {
      existing.push(role);
    } else {
      duplicateNames.set(role.name.toLowerCase(), [role]);
    }
  }

  for (const [name, dupes] of duplicateNames.entries()) {
    if (dupes.length > 1) {
      conflicts.push({
        type: "duplicate_names",
        description: `Multiple roles with similar name: "${name}"`,
        roles: dupes.map((r) => ({ id: r.id, name: r.name })),
      });
    }
  }

  return jsonResult({
    ok: true,
    guildId,
    conflicts,
    totalConflicts: conflicts.length,
  });
}

/**
 * Provides AI suggestions for role optimization and cleanup.
 */
async function handleSuggestRoleOpt(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });

  const roles = accountId
    ? await fetchRoleInfoDiscord(guildId, { accountId })
    : await fetchRoleInfoDiscord(guildId);

  const suggestions: string[] = [];

  const managedRoles = roles.filter((r) => r.managed);
  const userRoles = roles.filter((r) => !r.managed);

  if (userRoles.length > 50) {
    suggestions.push(`${userRoles.length} user-created roles. Consider consolidating similar roles.`);
  }

  const hoistedRoles = roles.filter((r) => r.hoist);
  if (hoistedRoles.length > 10) {
    suggestions.push(
      `${hoistedRoles.length} hoisted roles may clutter the member list. Review which roles need to be displayed separately.`,
    );
  }

  const colorRoles = roles.filter((r) => r.color !== 0 && BigInt(r.permissions) === 0n);
  if (colorRoles.length > 20) {
    suggestions.push(
      `${colorRoles.length} color-only roles detected. Consider using fewer color roles or a role bot.`,
    );
  }

  return jsonResult({
    ok: true,
    guildId,
    statistics: {
      totalRoles: roles.length,
      managedRoles: managedRoles.length,
      userRoles: userRoles.length,
      hoistedRoles: hoistedRoles.length,
      colorRoles: colorRoles.length,
    },
    suggestions,
  });
}

/**
 * Analyzes activity patterns for specific users.
 */
async function handleMemberActivity(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const channelId = readStringParam(params, "channelId", { required: true });
  const userId = readStringParam(params, "userId", { required: true });
  const limit = readNumberParam(params, "limit", { integer: true }) ?? 100;

  const messages = accountId
    ? await readMessagesDiscord({ channelId, limit }, { accountId })
    : await readMessagesDiscord({ channelId, limit });

  const userMessages = messages.filter((msg) => msg.author?.id === userId);

  const hourDistribution = new Map<number, number>();
  const dayDistribution = new Map<number, number>();

  for (const msg of userMessages) {
    const date = new Date(msg.timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    hourDistribution.set(hour, (hourDistribution.get(hour) ?? 0) + 1);
    dayDistribution.set(day, (dayDistribution.get(day) ?? 0) + 1);
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mostActiveDay = Array.from(dayDistribution.entries()).sort((a, b) => b[1] - a[1])[0];
  const mostActiveHour = Array.from(hourDistribution.entries()).sort((a, b) => b[1] - a[1])[0];

  return jsonResult({
    ok: true,
    userId,
    channelId,
    totalMessages: userMessages.length,
    averageMessageLength:
      userMessages.reduce((sum, msg) => sum + (msg.content?.length ?? 0), 0) / userMessages.length ||
      0,
    mostActiveDay: mostActiveDay ? dayNames[mostActiveDay[0]] : "Unknown",
    mostActiveHour: mostActiveHour ? `${mostActiveHour[0]}:00` : "Unknown",
  });
}

/**
 * Analyzes member growth and churn statistics.
 */
async function handleJoinLeaveStats(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const guildId = readStringParam(params, "guildId", { required: true });

  return jsonResult({
    ok: true,
    guildId,
    note: "Join/leave statistics require audit log access. Use auditLog action with USER_JOIN and USER_LEAVE filters for detailed analysis.",
  });
}

/**
 * Identifies the most active members in a channel or guild.
 */
async function handleTopContributors(
  params: Record<string, unknown>,
  accountId?: string,
): Promise<AgentToolResult<unknown>> {
  const channelId = readStringParam(params, "channelId", { required: true });
  const limit = readNumberParam(params, "limit", { integer: true }) ?? 100;
  const topCount = readNumberParam(params, "topCount", { integer: true }) ?? 10;

  const messages = accountId
    ? await readMessagesDiscord({ channelId, limit }, { accountId })
    : await readMessagesDiscord({ channelId, limit });

  const userStats = new Map<
    string,
    { messageCount: number; totalLength: number; username?: string }
  >();

  for (const msg of messages) {
    const authorId = msg.author?.id;
    if (authorId) {
      const existing = userStats.get(authorId) ?? {
        messageCount: 0,
        totalLength: 0,
        username: msg.author?.username,
      };
      existing.messageCount++;
      existing.totalLength += msg.content?.length ?? 0;
      userStats.set(authorId, existing);
    }
  }

  const topContributors = Array.from(userStats.entries())
    .sort((a, b) => b[1].messageCount - a[1].messageCount)
    .slice(0, topCount)
    .map(([userId, stats]) => ({
      userId,
      username: stats.username,
      messageCount: stats.messageCount,
      averageMessageLength: stats.totalLength / stats.messageCount,
    }));

  return jsonResult({
    ok: true,
    channelId,
    topContributors,
    totalUniqueUsers: userStats.size,
  });
}

export async function handleDiscordAnalyticsAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<DiscordActionConfig>,
): Promise<AgentToolResult<unknown>> {
  if (!isActionEnabled("analytics")) {
    throw new Error("Discord analytics features are disabled.");
  }

  const accountId = readStringParam(params, "accountId");

  switch (action) {
    case "channelActivity":
      return await handleChannelActivity(params, accountId);
    case "findInactiveChannels":
      return await handleFindInactiveChannels(params, accountId);
    case "suggestChannelOrg":
      return await handleSuggestChannelOrg(params, accountId);
    case "roleHierarchy":
      return await handleRoleHierarchy(params, accountId);
    case "roleConflicts":
      return await handleRoleConflicts(params, accountId);
    case "suggestRoleOpt":
      return await handleSuggestRoleOpt(params, accountId);
    case "memberActivity":
      return await handleMemberActivity(params, accountId);
    case "joinLeaveStats":
      return await handleJoinLeaveStats(params, accountId);
    case "topContributors":
      return await handleTopContributors(params, accountId);
    default:
      throw new Error(`Unknown analytics action: ${action}`);
  }
}
