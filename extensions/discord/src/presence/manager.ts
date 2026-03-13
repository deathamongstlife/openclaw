import type { Client, PresenceData, ActivityType } from "discord.js";
import { ActivityType as ActivityTypeEnum } from "discord.js";

type PresenceActivity = {
  name: string;
  type: ActivityType;
  url?: string;
  state?: string;
  details?: string;
  assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
  buttons?: Array<{ label: string; url: string }>;
  timestamps?: {
    start?: number;
    end?: number;
  };
};

export class PresenceManager {
  private client: Client;
  private currentActivity: PresenceActivity | null = null;
  private idleActivities: PresenceActivity[] = [
    {
      name: "with AI magic ✨",
      type: ActivityTypeEnum.Playing,
    },
    {
      name: "the chaos unfold ⚡",
      type: ActivityTypeEnum.Watching,
    },
    {
      name: "to your vibes 💅",
      type: ActivityTypeEnum.Listening,
    },
    {
      name: "pure chaos energy",
      type: ActivityTypeEnum.Streaming,
      url: "https://twitch.tv/jarvis",
    },
  ];
  private idleInterval: NodeJS.Timeout | null = null;
  private idleRotationMs = 300000; // 5 minutes

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Start rotating idle presence statuses
   */
  startIdleRotation(): void {
    // Set initial idle status
    this.setIdleStatus();

    // Rotate every 5 minutes
    this.idleInterval = setInterval(() => {
      this.setIdleStatus();
    }, this.idleRotationMs);
  }

  /**
   * Stop idle rotation
   */
  stopIdleRotation(): void {
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  /**
   * Set random idle status
   */
  private setIdleStatus(): void {
    const activity = this.idleActivities[Math.floor(Math.random() * this.idleActivities.length)];
    this.setActivity(activity);
  }

  /**
   * Set custom activity with Rich Presence (RPC)
   */
  setActivity(activity: PresenceActivity): void {
    this.currentActivity = activity;

    const presenceData: PresenceData = {
      activities: [
        {
          name: activity.name,
          type: activity.type,
          url: activity.url,
          state: activity.state,
          details: activity.details,
          assets: activity.assets
            ? {
                largeImage: activity.assets.largeImage,
                largeText: activity.assets.largeText,
                smallImage: activity.assets.smallImage,
                smallText: activity.assets.smallText,
              }
            : undefined,
          buttons: activity.buttons,
          timestamps: activity.timestamps,
        },
      ],
      status: "online",
    };

    this.client.user?.setPresence(presenceData);
  }

  /**
   * Set activity: Playing music
   */
  setPlayingMusic(trackName: string, artistName?: string): void {
    this.stopIdleRotation();

    this.setActivity({
      name: trackName,
      type: ActivityTypeEnum.Listening,
      state: artistName || undefined,
      details: "🎵 Vibing to music",
      assets: {
        largeImage: "music_icon",
        largeText: "Music Player",
        smallImage: "playing_icon",
        smallText: "Playing",
      },
      timestamps: {
        start: Date.now(),
      },
    });
  }

  /**
   * Set activity: In voice channel
   */
  setInVoice(channelName: string, memberCount: number): void {
    this.stopIdleRotation();

    this.setActivity({
      name: `in ${channelName}`,
      type: ActivityTypeEnum.Listening,
      state: `${memberCount} vibing`,
      details: "🎤 Voice channel",
      assets: {
        largeImage: "voice_icon",
        largeText: "Voice Chat",
      },
    });
  }

  /**
   * Set activity: Moderating
   */
  setModerating(action: string): void {
    this.stopIdleRotation();

    this.setActivity({
      name: action,
      type: ActivityTypeEnum.Playing,
      state: "Keeping the peace ⚡",
      details: "🛡️ Moderation Mode",
      assets: {
        largeImage: "mod_icon",
        largeText: "Moderating",
        smallImage: "shield_icon",
        smallText: "Active",
      },
    });

    // Return to idle after 30 seconds
    setTimeout(() => {
      this.startIdleRotation();
    }, 30000);
  }

  /**
   * Set activity: Processing command
   */
  setProcessingCommand(commandName: string): void {
    this.setActivity({
      name: `/${commandName}`,
      type: ActivityTypeEnum.Playing,
      state: "Processing command ✨",
      details: "🤖 AI Thinking",
      assets: {
        largeImage: "ai_icon",
        largeText: "JARVIS AI",
        smallImage: "thinking_icon",
        smallText: "Processing",
      },
    });

    // Return to idle after 10 seconds
    setTimeout(() => {
      this.startIdleRotation();
    }, 10000);
  }

  /**
   * Set activity: Chatting with users
   */
  setChatting(userCount: number): void {
    this.stopIdleRotation();

    this.setActivity({
      name: `with ${userCount} bestie${userCount > 1 ? "s" : ""}`,
      type: ActivityTypeEnum.Playing,
      state: "Chatting 💅",
      details: "💬 Active Conversations",
      assets: {
        largeImage: "chat_icon",
        largeText: "Chatting",
      },
    });
  }

  /**
   * Set activity: Custom with RPC
   */
  setCustomRPC(options: {
    name: string;
    type?: ActivityType;
    details?: string;
    state?: string;
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
    buttons?: Array<{ label: string; url: string }>;
    startTime?: number;
  }): void {
    this.stopIdleRotation();

    this.setActivity({
      name: options.name,
      type: options.type || ActivityTypeEnum.Playing,
      details: options.details,
      state: options.state,
      assets: {
        largeImage: options.largeImage,
        largeText: options.largeText,
        smallImage: options.smallImage,
        smallText: options.smallText,
      },
      buttons: options.buttons,
      timestamps: options.startTime
        ? {
            start: options.startTime,
          }
        : undefined,
    });
  }

  /**
   * Return to idle rotation
   */
  returnToIdle(): void {
    this.startIdleRotation();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopIdleRotation();
  }
}
