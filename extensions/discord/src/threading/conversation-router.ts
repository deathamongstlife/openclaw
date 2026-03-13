// Route messages to correct threads and maintain conversation context
import type { Message, ThreadChannel } from "discord.js";
import type { AutoThreadManager } from "./auto-threads.js";

export interface ConversationContext {
  userId: string;
  threadId: string | null;
  channelId: string;
  isThreaded: boolean;
}

export class ConversationRouter {
  constructor(private threadManager: AutoThreadManager) {}

  async routeMessage(message: Message): Promise<ConversationContext> {
    const context: ConversationContext = {
      userId: message.author.id,
      threadId: null,
      channelId: message.channel.id,
      isThreaded: false,
    };

    // Check if message is already in a thread
    if (message.channel.isThread()) {
      context.threadId = message.channel.id;
      context.isThreaded = true;
      return context;
    }

    // Check if user has an active thread
    const thread = await this.threadManager.routeMessageToThread(message);

    if (thread) {
      context.threadId = thread.id;
      context.isThreaded = true;

      // Notify user to continue in thread (if this is a new message in main channel)
      await message.reply(
        `Hey bestie! Let's continue our chat in the thread → ${thread.toString()} ✨`,
      );
    }

    return context;
  }

  async shouldCreateThread(message: Message): Promise<boolean> {
    // Don't create threads in DMs or if already in a thread
    if (!message.guild || message.channel.isThread()) {
      return false;
    }

    // Let the thread manager decide based on active users
    await this.threadManager.handleMessage(message);

    // Check if a thread was created
    const thread = await this.threadManager.routeMessageToThread(message);
    return thread !== null;
  }

  getReplyTarget(context: ConversationContext, originalMessage: Message): Message {
    // If in a thread, reply to the original message
    // Otherwise, reply in the main channel
    return originalMessage;
  }
}
