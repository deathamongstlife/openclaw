import { createScopedChannelConfigBase } from "jarvis/plugin-sdk/compat";
import {
  buildAccountScopedDmSecurityPolicy,
  collectOpenProviderGroupPolicyWarnings,
  collectOpenGroupPolicyConfiguredRouteWarnings,
  createScopedAccountConfigAccessors,
  formatAllowFromLowercase,
} from "jarvis/plugin-sdk/compat";
import {
  applyAccountNameToChannelSection,
  buildComputedAccountStatusSnapshot,
  buildChannelConfigSchema,
  buildTokenChannelStatusSummary,
  collectDiscordAuditChannelIds,
  collectDiscordStatusIssues,
  DEFAULT_ACCOUNT_ID,
  discordOnboardingAdapter,
  DiscordConfigSchema,
  getChatChannelMeta,
  inspectDiscordAccount,
  listDiscordAccountIds,
  listDiscordDirectoryGroupsFromConfig,
  listDiscordDirectoryPeersFromConfig,
  looksLikeDiscordTargetId,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  normalizeDiscordMessagingTarget,
  normalizeDiscordOutboundTarget,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
  resolveDiscordAccount,
  resolveDefaultDiscordAccountId,
  resolveDiscordGroupRequireMention,
  resolveDiscordGroupToolPolicy,
  type ChannelMessageActionAdapter,
  type ChannelPlugin,
  type ResolvedDiscordAccount,
} from "jarvis/plugin-sdk/discord";
import { getDiscordRuntime } from "./runtime.js";

const meta = getChatChannelMeta("discord");

// Store presence managers by account ID for cleanup
const presenceManagers = new Map<string, any>();

const discordMessageActions: ChannelMessageActionAdapter = {
  listActions: (ctx) =>
    getDiscordRuntime().channel.discord.messageActions?.listActions?.(ctx) ?? [],
  extractToolSend: (ctx) =>
    getDiscordRuntime().channel.discord.messageActions?.extractToolSend?.(ctx) ?? null,
  handleAction: async (ctx) => {
    const ma = getDiscordRuntime().channel.discord.messageActions;
    if (!ma?.handleAction) {
      throw new Error("Discord message actions not available");
    }
    return ma.handleAction(ctx);
  },
};

const discordConfigAccessors = createScopedAccountConfigAccessors({
  resolveAccount: ({ cfg, accountId }) => resolveDiscordAccount({ cfg, accountId }),
  resolveAllowFrom: (account: ResolvedDiscordAccount) => account.config.dm?.allowFrom,
  formatAllowFrom: (allowFrom) => formatAllowFromLowercase({ allowFrom }),
  resolveDefaultTo: (account: ResolvedDiscordAccount) => account.config.defaultTo,
});

const discordConfigBase = createScopedChannelConfigBase({
  sectionKey: "discord",
  listAccountIds: listDiscordAccountIds,
  resolveAccount: (cfg, accountId) => resolveDiscordAccount({ cfg, accountId }),
  inspectAccount: (cfg, accountId) => inspectDiscordAccount({ cfg, accountId }),
  defaultAccountId: resolveDefaultDiscordAccountId,
  clearBaseFields: ["token", "name"],
});

export const discordPlugin: ChannelPlugin<ResolvedDiscordAccount> = {
  id: "discord",
  meta: {
    ...meta,
  },
  onboarding: discordOnboardingAdapter,
  pairing: {
    idLabel: "discordUserId",
    normalizeAllowEntry: (entry) => entry.replace(/^(discord|user):/i, ""),
    notifyApproval: async ({ id }) => {
      await getDiscordRuntime().channel.discord.sendMessageDiscord(
        `user:${id}`,
        PAIRING_APPROVED_MESSAGE,
      );
    },
  },
  capabilities: {
    chatTypes: ["direct", "channel", "thread"],
    polls: true,
    reactions: true,
    threads: true,
    media: true,
    nativeCommands: true,
  },
  streaming: {
    blockStreamingCoalesceDefaults: { minChars: 1500, idleMs: 1000 },
  },
  reload: { configPrefixes: ["channels.discord"] },
  configSchema: buildChannelConfigSchema(DiscordConfigSchema),
  config: {
    ...discordConfigBase,
    isConfigured: (account) => Boolean(account.token?.trim()),
    describeAccount: (account) => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.token?.trim()),
      tokenSource: account.tokenSource,
    }),
    ...discordConfigAccessors,
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      return buildAccountScopedDmSecurityPolicy({
        cfg,
        channelKey: "discord",
        accountId,
        fallbackAccountId: account.accountId ?? DEFAULT_ACCOUNT_ID,
        policy: account.config.dm?.policy,
        allowFrom: account.config.dm?.allowFrom ?? [],
        allowFromPathSuffix: "dm.",
        normalizeEntry: (raw) => raw.replace(/^(discord|user):/i, "").replace(/^<@!?(\d+)>$/, "$1"),
      });
    },
    collectWarnings: ({ account, cfg }) => {
      const guildEntries = account.config.guilds ?? {};
      const guildsConfigured = Object.keys(guildEntries).length > 0;
      const channelAllowlistConfigured = guildsConfigured;

      return collectOpenProviderGroupPolicyWarnings({
        cfg,
        providerConfigPresent: cfg.channels?.discord !== undefined,
        configuredGroupPolicy: account.config.groupPolicy,
        collect: (groupPolicy) =>
          collectOpenGroupPolicyConfiguredRouteWarnings({
            groupPolicy,
            routeAllowlistConfigured: channelAllowlistConfigured,
            configureRouteAllowlist: {
              surface: "Discord guilds",
              openScope: "any channel not explicitly denied",
              groupPolicyPath: "channels.discord.groupPolicy",
              routeAllowlistPath: "channels.discord.guilds.<id>.channels",
            },
            missingRouteAllowlist: {
              surface: "Discord guilds",
              openBehavior:
                "with no guild/channel allowlist; any channel can trigger (mention-gated)",
              remediation:
                'Set channels.discord.groupPolicy="allowlist" and configure channels.discord.guilds.<id>.channels',
            },
          }),
      });
    },
  },
  groups: {
    resolveRequireMention: resolveDiscordGroupRequireMention,
    resolveToolPolicy: resolveDiscordGroupToolPolicy,
  },
  mentions: {
    stripPatterns: () => ["<@!?\\d+>"],
  },
  threading: {
    resolveReplyToMode: ({ cfg }) => cfg.channels?.discord?.replyToMode ?? "off",
  },
  agentPrompt: {
    messageToolHints: () => [
      "- Discord components: set `components` when sending messages to include buttons, selects, or v2 containers.",
      "- Forms: add `components.modal` (title, fields). Jarvis adds a trigger button and routes submissions as new messages.",
    ],
  },
  messaging: {
    normalizeTarget: normalizeDiscordMessagingTarget,
    targetResolver: {
      looksLikeId: looksLikeDiscordTargetId,
      hint: "<channelId|user:ID|channel:ID>",
    },
  },
  directory: {
    self: async () => null,
    listPeers: async (params) => listDiscordDirectoryPeersFromConfig(params),
    listGroups: async (params) => listDiscordDirectoryGroupsFromConfig(params),
    listPeersLive: async (params) =>
      getDiscordRuntime().channel.discord.listDirectoryPeersLive(params),
    listGroupsLive: async (params) =>
      getDiscordRuntime().channel.discord.listDirectoryGroupsLive(params),
  },
  resolver: {
    resolveTargets: async ({ cfg, accountId, inputs, kind }) => {
      const account = resolveDiscordAccount({ cfg, accountId });
      const token = account.token?.trim();
      if (!token) {
        return inputs.map((input) => ({
          input,
          resolved: false,
          note: "missing Discord token",
        }));
      }
      if (kind === "group") {
        const resolved = await getDiscordRuntime().channel.discord.resolveChannelAllowlist({
          token,
          entries: inputs,
        });
        return resolved.map((entry) => ({
          input: entry.input,
          resolved: entry.resolved,
          id: entry.channelId ?? entry.guildId,
          name:
            entry.channelName ??
            entry.guildName ??
            (entry.guildId && !entry.channelId ? entry.guildId : undefined),
          note: entry.note,
        }));
      }
      const resolved = await getDiscordRuntime().channel.discord.resolveUserAllowlist({
        token,
        entries: inputs,
      });
      return resolved.map((entry) => ({
        input: entry.input,
        resolved: entry.resolved,
        id: entry.id,
        name: entry.name,
        note: entry.note,
      }));
    },
  },
  actions: discordMessageActions,
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg,
        channelKey: "discord",
        accountId,
        name,
      }),
    validateInput: ({ accountId, input }) => {
      if (input.useEnv && accountId !== DEFAULT_ACCOUNT_ID) {
        return "DISCORD_BOT_TOKEN can only be used for the default account.";
      }
      if (!input.useEnv && !input.token) {
        return "Discord requires token (or --use-env).";
      }
      return null;
    },
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg,
        channelKey: "discord",
        accountId,
        name: input.name,
      });
      const next =
        accountId !== DEFAULT_ACCOUNT_ID
          ? migrateBaseNameToDefaultAccount({
              cfg: namedConfig,
              channelKey: "discord",
            })
          : namedConfig;
      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...next,
          channels: {
            ...next.channels,
            discord: {
              ...next.channels?.discord,
              enabled: true,
              ...(input.useEnv ? {} : input.token ? { token: input.token } : {}),
            },
          },
        };
      }
      return {
        ...next,
        channels: {
          ...next.channels,
          discord: {
            ...next.channels?.discord,
            enabled: true,
            accounts: {
              ...next.channels?.discord?.accounts,
              [accountId]: {
                ...next.channels?.discord?.accounts?.[accountId],
                enabled: true,
                ...(input.token ? { token: input.token } : {}),
              },
            },
          },
        },
      };
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: null,
    textChunkLimit: 2000,
    pollMaxOptions: 10,
    resolveTarget: ({ to }) => normalizeDiscordOutboundTarget(to),
    sendText: async ({ cfg, to, text, accountId, deps, replyToId, silent }) => {
      const send = deps?.sendDiscord ?? getDiscordRuntime().channel.discord.sendMessageDiscord;
      const result = await send(to, text, {
        verbose: false,
        cfg,
        replyTo: replyToId ?? undefined,
        accountId: accountId ?? undefined,
        silent: silent ?? undefined,
      });
      return { channel: "discord", ...result };
    },
    sendMedia: async ({
      cfg,
      to,
      text,
      mediaUrl,
      mediaLocalRoots,
      accountId,
      deps,
      replyToId,
      silent,
    }) => {
      const send = deps?.sendDiscord ?? getDiscordRuntime().channel.discord.sendMessageDiscord;
      const result = await send(to, text, {
        verbose: false,
        cfg,
        mediaUrl,
        mediaLocalRoots,
        replyTo: replyToId ?? undefined,
        accountId: accountId ?? undefined,
        silent: silent ?? undefined,
      });
      return { channel: "discord", ...result };
    },
    sendPoll: async ({ cfg, to, poll, accountId, silent }) =>
      await getDiscordRuntime().channel.discord.sendPollDiscord(to, poll, {
        cfg,
        accountId: accountId ?? undefined,
        silent: silent ?? undefined,
      }),
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      connected: false,
      reconnectAttempts: 0,
      lastConnectedAt: null,
      lastDisconnect: null,
      lastEventAt: null,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    collectStatusIssues: collectDiscordStatusIssues,
    buildChannelSummary: ({ snapshot }) =>
      buildTokenChannelStatusSummary(snapshot, { includeMode: false }),
    probeAccount: async ({ account, timeoutMs }) =>
      getDiscordRuntime().channel.discord.probeDiscord(account.token, timeoutMs, {
        includeApplication: true,
      }),
    auditAccount: async ({ account, timeoutMs, cfg }) => {
      const { channelIds, unresolvedChannels } = collectDiscordAuditChannelIds({
        cfg,
        accountId: account.accountId,
      });
      if (!channelIds.length && unresolvedChannels === 0) {
        return undefined;
      }
      const botToken = account.token?.trim();
      if (!botToken) {
        return {
          ok: unresolvedChannels === 0,
          checkedChannels: 0,
          unresolvedChannels,
          channels: [],
          elapsedMs: 0,
        };
      }
      const audit = await getDiscordRuntime().channel.discord.auditChannelPermissions({
        token: botToken,
        accountId: account.accountId,
        channelIds,
        timeoutMs,
      });
      return { ...audit, unresolvedChannels };
    },
    buildAccountSnapshot: ({ account, runtime, probe, audit }) => {
      const configured =
        resolveConfiguredFromCredentialStatuses(account) ?? Boolean(account.token?.trim());
      const app = runtime?.application ?? (probe as { application?: unknown })?.application;
      const bot = runtime?.bot ?? (probe as { bot?: unknown })?.bot;
      const base = buildComputedAccountStatusSnapshot({
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured,
        runtime,
        probe,
      });
      return {
        ...base,
        ...projectCredentialSnapshotFields(account),
        connected: runtime?.connected ?? false,
        reconnectAttempts: runtime?.reconnectAttempts,
        lastConnectedAt: runtime?.lastConnectedAt ?? null,
        lastDisconnect: runtime?.lastDisconnect ?? null,
        lastEventAt: runtime?.lastEventAt ?? null,
        application: app ?? undefined,
        bot: bot ?? undefined,
        audit,
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      const token = account.token.trim();
      let discordBotLabel = "";
      try {
        const probe = await getDiscordRuntime().channel.discord.probeDiscord(token, 2500, {
          includeApplication: true,
        });
        const username = probe.ok ? probe.bot?.username?.trim() : null;
        if (username) {
          discordBotLabel = ` (@${username})`;
        }
        ctx.setStatus({
          accountId: account.accountId,
          bot: probe.bot,
          application: probe.application,
        });
        const messageContent = probe.application?.intents?.messageContent;
        if (messageContent === "disabled") {
          ctx.log?.warn(
            `[${account.accountId}] Discord Message Content Intent is disabled; bot may not respond to channel messages. Enable it in Discord Dev Portal (Bot → Privileged Gateway Intents) or require mentions.`,
          );
        } else if (messageContent === "limited") {
          ctx.log?.info(
            `[${account.accountId}] Discord Message Content Intent is limited; bots under 100 servers can use it without verification.`,
          );
        }
      } catch (err) {
        if (getDiscordRuntime().logging.shouldLogVerbose()) {
          ctx.log?.debug?.(`[${account.accountId}] bot probe failed: ${String(err)}`);
        }
      }
      ctx.log?.info(`[${account.accountId}] starting provider${discordBotLabel}`);

      // Initialize custom bot features (music, voice, threading, tools)
      await initializeCustomFeatures(token, ctx.cfg, account.accountId, ctx.log);

      return getDiscordRuntime().channel.discord.monitorDiscordProvider({
        token,
        accountId: account.accountId,
        config: ctx.cfg,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        mediaMaxMb: account.config.mediaMaxMb,
        historyLimit: account.config.historyLimit,
        setStatus: (patch) => ctx.setStatus({ accountId: account.accountId, ...patch }),
      });
    },
  },
};

/**
 * Initialize custom Discord bot features (music, voice, threading, slash commands, tools)
 */
async function initializeCustomFeatures(
  token: string,
  config: any,
  accountId: string,
  logger?: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  },
): Promise<void> {
  try {
    // Dynamically import custom features to avoid loading them if not needed
    const { DiscordBotClient } = await import("../bot-client.js");
    const { DiscordBotStoreAdapter } = await import("../database/store-adapter.js");
    const { getStoreInstance } = await import("../database/store-bridge.js");
    const { MusicManager } = await import("../music/manager.js");
    const { MusicService } = await import("../music/service.js");
    const { VoiceTTSManager } = await import("../voice/tts.js");
    const { UserIdentityManager } = await import("../identity/profiles.js");
    const { OnboardingManager } = await import("../identity/onboarding.js");
    const { AutoThreadManager } = await import("../threading/auto-threads.js");
    const { ConversationRouter } = await import("../threading/conversation-router.js");
    const { SlashCommandRegistry, chatCommand, lookupCommand, musicCommand, profileCommand } =
      await import("../commands/slash/index.js");
    const { createDiscordBotTools } = await import("../tools/index.js");
    const { PresenceManager } = await import("../presence/manager.js");

    // Initialize bot features using SQLite database (if available)
    let store: InstanceType<typeof DiscordBotStoreAdapter> | null = null;
    try {
      store = new DiscordBotStoreAdapter();
    } catch (error) {
      logger?.warn?.(`SQLite not available, some features will be disabled: ${String(error)}`);
    }

    // Create bot client (will be used by tools) - only if store available
    const botClient = store ? new DiscordBotClient(store) : null;

    // Login the bot client
    if (token && botClient) {
      await botClient.login(token).catch((error) => {
        logger?.error?.(`Failed to login Discord bot client: ${String(error)}`);
      });
    } else if (!botClient) {
      logger?.warn?.("Discord bot client not available: SQLite database initialization failed");
    }

    if (!botClient) {
      logger?.warn?.("Skipping custom features initialization: bot client not available");
      return;
    }

    // Initialize presence manager for dynamic status
    const presenceManager = new PresenceManager(botClient.client);

    // Initialize music system
    const musicManager = new MusicManager(botClient.client);
    const musicService = new MusicService(musicManager, presenceManager);

    // Initialize voice TTS
    const voiceTTS = new VoiceTTSManager();

    // Link presence manager to voice TTS
    voiceTTS.setPresenceManager(presenceManager);

    // Store presence manager for cleanup
    presenceManagers.set(accountId, presenceManager);

    // Initialize user identity system
    const identityManager = new UserIdentityManager();
    const onboardingManager = new OnboardingManager(identityManager);

    // Get the store instance for thread and slash command features
    const storeInstance = store ? getStoreInstance() : null;

    // Initialize thread management for multi-user conversations
    const threadManager =
      storeInstance && botClient ? new AutoThreadManager(storeInstance, botClient.client) : null;
    const conversationRouter = threadManager ? new ConversationRouter(threadManager) : null;

    // Initialize slash command system (user-installable)
    if (token && botClient && storeInstance) {
      const slashRegistry = new SlashCommandRegistry(botClient.client, storeInstance, token);

      // Register all slash commands
      slashRegistry.registerCommand(chatCommand);
      slashRegistry.registerCommand(lookupCommand);
      slashRegistry.registerCommand(musicCommand);
      slashRegistry.registerCommand(profileCommand);

      // Setup interaction handler
      slashRegistry.setupInteractionHandler();

      // Deploy commands when bot is ready
      botClient.client.once("ready", () => {
        void slashRegistry.deployCommands();
        presenceManager.startIdleRotation();
        logger?.info?.("⚡ Dynamic presence system started!");
      });
    } else {
      logger?.warn?.("Slash commands not registered: missing requirements");
      // Start presence system even if slash commands aren't available
      botClient.client.once("ready", () => {
        presenceManager.startIdleRotation();
        logger?.info?.("⚡ Dynamic presence system started!");
      });
    }

    // Initialize message handler for natural language commands
    if (botClient && musicService) {
      const { MessageHandler } = await import("../handler.js");
      const messageHandler = new MessageHandler(botClient.client, musicService, presenceManager);
      messageHandler.register();
      logger?.info?.("✨ Natural language message handler registered!");
    }

    // Initialize music manager with Lavalink
    await musicManager.initialize();
    if (musicManager.isAvailable()) {
      logger?.info?.("🎵 Music system initialized with Lavalink!");
    } else {
      logger?.warn?.("Music system disabled (no Lavalink nodes configured)");
    }

    // Register all bot tools (including music tools)
    if (store && botClient && musicService) {
      const tools = createDiscordBotTools(store, botClient.client, musicService);
      // Tools will be registered via runtime (need to inject runtime reference)
      logger?.info?.(`⚡ ${tools.length} Discord bot tools ready!`);
    } else {
      logger?.warn?.("Bot tools not registered: SQLite database or bot client not available");
    }

    logger?.info?.("⚡ Discord Advanced AI Bot custom features loaded! Ready to cause chaos! ✨");
  } catch (error) {
    logger?.error?.(`Failed to initialize custom Discord features: ${String(error)}`);
  }
}

/**
 * Cleanup custom features for an account
 */
function cleanupCustomFeatures(accountId: string): void {
  const presenceManager = presenceManagers.get(accountId);
  if (presenceManager) {
    presenceManager.cleanup();
    presenceManagers.delete(accountId);
  }
}
