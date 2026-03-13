import type { Client, Message, ThreadChannel } from "discord.js";
import { ChannelType } from "discord.js";
// Tests for automatic thread management
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DiscordBotStore } from "../database/store.js";
import { AutoThreadManager } from "./auto-threads.js";

describe("AutoThreadManager", () => {
  let manager: AutoThreadManager;
  let mockStore: DiscordBotStore;
  let mockClient: Client;

  beforeEach(() => {
    // Mock store
    mockStore = {
      getThreadForUser: vi.fn(),
      createThreadMapping: vi.fn(),
      updateThreadActivity: vi.fn(),
      deactivateThread: vi.fn(),
      cleanupInactiveThreads: vi.fn(),
    } as any;

    // Mock client
    mockClient = {
      user: { id: "bot-id" },
    } as any;

    manager = new AutoThreadManager(mockStore, mockClient);
  });

  it("should ignore bot messages", async () => {
    const message = {
      author: { bot: true },
      guild: {},
    } as Message;

    await manager.handleMessage(message);

    expect(mockStore.getThreadForUser).not.toHaveBeenCalled();
  });

  it("should ignore DMs", async () => {
    const message = {
      author: { bot: false, id: "user-1" },
      guild: null,
      channel: { type: ChannelType.DM },
      mentions: { has: () => false },
    } as any;

    await manager.handleMessage(message);

    expect(mockStore.getThreadForUser).not.toHaveBeenCalled();
  });

  it("should ignore messages in threads", async () => {
    const message = {
      author: { bot: false, id: "user-1" },
      guild: {},
      channel: {
        type: ChannelType.PublicThread,
        isThread: () => true,
      },
      mentions: { has: () => false },
    } as any;

    await manager.handleMessage(message);

    expect(mockStore.getThreadForUser).not.toHaveBeenCalled();
  });

  it("should track user activity when bot is mentioned", async () => {
    const message = {
      author: { bot: false, id: "user-1" },
      guild: { id: "guild-1" },
      channel: {
        id: "channel-1",
        type: ChannelType.GuildText,
        isThread: () => false,
      },
      mentions: { has: (id: string) => id === "bot-id" },
    } as any;

    vi.mocked(mockStore.getThreadForUser).mockResolvedValue(null);

    await manager.handleMessage(message);

    expect(mockStore.getThreadForUser).toHaveBeenCalledWith("channel-1", "user-1");
  });

  it("should update activity for existing thread", async () => {
    const existingThread = {
      thread_id: "thread-1",
      channel_id: "channel-1",
      user_id: "user-1",
      created_at: Date.now(),
      last_activity: Date.now(),
      active: true,
    };

    const message = {
      author: { bot: false, id: "user-1" },
      guild: { id: "guild-1" },
      channel: {
        id: "channel-1",
        type: ChannelType.GuildText,
        isThread: () => false,
      },
      mentions: { has: (id: string) => id === "bot-id" },
    } as any;

    vi.mocked(mockStore.getThreadForUser).mockResolvedValue(existingThread);

    await manager.handleMessage(message);

    expect(mockStore.updateThreadActivity).toHaveBeenCalledWith("thread-1", "channel-1");
  });

  it("should route message to existing thread", async () => {
    const existingThread = {
      thread_id: "thread-1",
      channel_id: "channel-1",
      user_id: "user-1",
      created_at: Date.now(),
      last_activity: Date.now(),
      active: true,
    };

    const mockThread = {
      id: "thread-1",
      isThread: () => true,
    } as ThreadChannel;

    const message = {
      author: { id: "user-1" },
      channel: { id: "channel-1" },
      guild: {
        channels: {
          fetch: vi.fn().mockResolvedValue(mockThread),
        },
      },
    } as any;

    vi.mocked(mockStore.getThreadForUser).mockResolvedValue(existingThread);

    const result = await manager.routeMessageToThread(message);

    expect(result).toBe(mockThread);
    expect(mockStore.updateThreadActivity).toHaveBeenCalledWith("thread-1", "channel-1");
  });

  it("should return null if thread no longer exists", async () => {
    const existingThread = {
      thread_id: "thread-1",
      channel_id: "channel-1",
      user_id: "user-1",
      created_at: Date.now(),
      last_activity: Date.now(),
      active: true,
    };

    const message = {
      author: { id: "user-1" },
      channel: { id: "channel-1" },
      guild: {
        channels: {
          fetch: vi.fn().mockRejectedValue(new Error("Not found")),
        },
      },
    } as any;

    vi.mocked(mockStore.getThreadForUser).mockResolvedValue(existingThread);

    const result = await manager.routeMessageToThread(message);

    expect(result).toBeNull();
    expect(mockStore.deactivateThread).toHaveBeenCalledWith("thread-1", "channel-1");
  });

  it("should cleanup on destroy", () => {
    manager.cleanup();
    // Should not throw
  });
});
