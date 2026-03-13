// Automatic Thread Management for Multi-User Conversations
import type { Client, Message, ThreadChannel, ChannelType } from "discord.js";
import { ChannelType as DiscordChannelType } from "discord.js";
import type { DiscordBotStore } from "../database/store.js";

export class AutoThreadManager {
  // Track active users per channel (user ID -> last message timestamp)
  private channelUsers: Map<string, Map<string, number>> = new Map();

  // Cleanup interval for tracking
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private store: DiscordBotStore,
    private client: Client,
  ) {
    // Clean up old user tracking every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupUserTracking();
      },
      5 * 60 * 1000,
    );

    // Clean up inactive threads every hour
    setInterval(
      () => {
        void this.cleanupInactiveThreads();
      },
      60 * 60 * 1000,
    );
  }

  async handleMessage(message: Message): Promise<void> {
    // Ignore bot messages, DMs, and messages already in threads
    if (
      message.author.bot ||
      !message.guild ||
      message.channel.type === DiscordChannelType.DM ||
      message.channel.isThread()
    ) {
      return;
    }

    // Only process messages mentioning the bot
    if (!message.mentions.has(this.client.user!.id)) {
      return;
    }

    const channelId = message.channel.id;
    const userId = message.author.id;

    // Track this user's activity in the channel
    this.trackUserActivity(channelId, userId);

    // Check if this user already has a thread
    const existingThread = await this.store.getThreadForUser(channelId, userId);

    if (existingThread) {
      // Update activity timestamp
      await this.store.updateThreadActivity(existingThread.thread_id, channelId);
      return;
    }

    // Check how many active users are in this channel
    const activeUsers = this.getActiveUsers(channelId);

    // If 2+ users are active, create a thread for this user
    if (activeUsers.size >= 2) {
      await this.createThreadForUser(message);
    }
  }

  private trackUserActivity(channelId: string, userId: string): void {
    if (!this.channelUsers.has(channelId)) {
      this.channelUsers.set(channelId, new Map());
    }

    const channelMap = this.channelUsers.get(channelId)!;
    channelMap.set(userId, Date.now());
  }

  private getActiveUsers(channelId: string): Map<string, number> {
    const channelMap = this.channelUsers.get(channelId);
    if (!channelMap) {
      return new Map();
    }

    // Only count users active in the last 10 minutes
    const cutoff = Date.now() - 10 * 60 * 1000;
    const active = new Map<string, number>();

    for (const [userId, timestamp] of channelMap.entries()) {
      if (timestamp > cutoff) {
        active.set(userId, timestamp);
      }
    }

    return active;
  }

  private cleanupUserTracking(): void {
    const cutoff = Date.now() - 15 * 60 * 1000; // 15 minutes

    for (const [channelId, channelMap] of this.channelUsers.entries()) {
      for (const [userId, timestamp] of channelMap.entries()) {
        if (timestamp < cutoff) {
          channelMap.delete(userId);
        }
      }

      // Remove empty channel maps
      if (channelMap.size === 0) {
        this.channelUsers.delete(channelId);
      }
    }
  }

  private async createThreadForUser(message: Message): Promise<ThreadChannel | null> {
    try {
      // Create thread with user-specific name
      const threadName = `Chat with ${message.author.username}`;

      const thread = await message.startThread({
        name: threadName,
        autoArchiveDuration: 1440, // 24 hours
        reason: "Auto-created for multi-user conversation isolation",
      });

      // Store thread mapping
      await this.store.createThreadMapping({
        thread_id: thread.id,
        channel_id: message.channel.id,
        user_id: message.author.id,
        active: true,
      });

      // Send welcome message to the thread
      await thread.send(
        `Hey ${message.author.username}! ✨ Since multiple people are chatting with me in this channel, I created this thread just for us! This way our conversation stays organized, bestie! 🦞💅`,
      );

      return thread;
    } catch (error) {
      console.error("Failed to create thread:", error);
      return null;
    }
  }

  async routeMessageToThread(message: Message): Promise<ThreadChannel | null> {
    // Check if this user has an active thread in this channel
    const threadMapping = await this.store.getThreadForUser(message.channel.id, message.author.id);

    if (!threadMapping) {
      return null;
    }

    try {
      // Fetch the thread
      const thread = await message.guild?.channels.fetch(threadMapping.thread_id);

      if (thread?.isThread()) {
        // Update activity
        await this.store.updateThreadActivity(threadMapping.thread_id, message.channel.id);
        return thread;
      }

      // Thread no longer exists, deactivate mapping
      await this.store.deactivateThread(threadMapping.thread_id, message.channel.id);
      return null;
    } catch {
      // Thread fetch failed, deactivate mapping
      await this.store.deactivateThread(threadMapping.thread_id, message.channel.id);
      return null;
    }
  }

  private async cleanupInactiveThreads(): Promise<void> {
    await this.store.cleanupInactiveThreads(24 * 60 * 60 * 1000); // 24 hours
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
