import type { User, TextBasedChannel } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import type { UserIdentityManager } from "./profiles.js";

/**
 * Onboarding flow for new users
 */
export class OnboardingManager {
  private activeOnboarding = new Map<string, OnboardingState>();

  constructor(private identityManager: UserIdentityManager) {}

  /**
   * Start onboarding flow for a user
   */
  async startOnboarding(user: User, channel: TextBasedChannel): Promise<void> {
    const isOnboarded = await this.identityManager.isOnboarded(user.id);
    if (isOnboarded) {
      return;
    }

    this.activeOnboarding.set(user.id, {
      userId: user.id,
      step: "greeting",
      startedAt: Date.now(),
    });

    const greeting =
      `Omg hi bestie! 💅✨ I'm your chaos gremlin assistant!\n\n` +
      `Before we get started, I'd love to know a bit about you! What should I call you? ` +
      `(Reply with your preferred name, or just say "skip" to use ${user.username})`;

    await channel.send(greeting);
  }

  /**
   * Handle onboarding message response
   */
  async handleOnboardingMessage(
    userId: string,
    message: string,
    channel: TextBasedChannel,
  ): Promise<boolean> {
    const state = this.activeOnboarding.get(userId);
    if (!state) {
      return false;
    }

    switch (state.step) {
      case "greeting":
        return this.handleNameStep(userId, message, channel);
      case "pronouns":
        return this.handlePronounsStep(userId, message, channel);
      case "complete":
        return this.completeOnboarding(userId, channel);
      default:
        return false;
    }
  }

  /**
   * Handle name step
   */
  private async handleNameStep(
    userId: string,
    message: string,
    channel: TextBasedChannel,
  ): Promise<boolean> {
    const state = this.activeOnboarding.get(userId);
    if (!state) return false;

    if (message.toLowerCase() !== "skip") {
      await this.identityManager.updateProfile(userId, {
        preferredName: message.trim(),
      });
    }

    state.step = "pronouns";
    this.activeOnboarding.set(userId, state);

    const response =
      `Awesome! And what are your pronouns, bestie? ` +
      `(For example: she/her, he/him, they/them, or skip)`;

    await channel.send(response);
    return true;
  }

  /**
   * Handle pronouns step
   */
  private async handlePronounsStep(
    userId: string,
    message: string,
    channel: TextBasedChannel,
  ): Promise<boolean> {
    const state = this.activeOnboarding.get(userId);
    if (!state) return false;

    if (message.toLowerCase() !== "skip") {
      await this.identityManager.updateProfile(userId, {
        pronouns: message.trim(),
      });
    }

    state.step = "complete";
    this.activeOnboarding.set(userId, state);

    return this.completeOnboarding(userId, channel);
  }

  /**
   * Complete onboarding
   */
  private async completeOnboarding(userId: string, channel: TextBasedChannel): Promise<boolean> {
    await this.identityManager.completeOnboarding(userId);
    this.activeOnboarding.delete(userId);

    const profile = await this.identityManager.getProfile(userId);
    const name = profile.preferredName ?? "bestie";

    const completion =
      `Perfect, ${name}! We're all set! 💅✨\n\n` +
      `I can help you with:\n` +
      `🎵 **Music** - Play songs from YouTube, SoundCloud, or Spotify\n` +
      `🔨 **Moderation** - Warn, kick, ban, timeout users\n` +
      `📊 **Server Info** - Stats, member info, role management\n` +
      `🎮 **Fun Stuff** - Polls, games, and more!\n\n` +
      `Just mention me or chat naturally, and I'll help you out! ✨`;

    const controls = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("onboarding_music_demo")
        .setLabel("🎵 Try Music")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("onboarding_help")
        .setLabel("📚 Show Help")
        .setStyle(ButtonStyle.Secondary),
    );

    await channel.send({
      content: completion,
      components: [controls],
    });

    return true;
  }

  /**
   * Check if user is in onboarding
   */
  isOnboarding(userId: string): boolean {
    return this.activeOnboarding.has(userId);
  }

  /**
   * Cancel onboarding for a user
   */
  cancelOnboarding(userId: string): void {
    this.activeOnboarding.delete(userId);
  }
}

interface OnboardingState {
  userId: string;
  step: "greeting" | "pronouns" | "complete";
  startedAt: number;
}
