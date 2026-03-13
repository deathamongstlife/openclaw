import { Type, type Static } from "@sinclair/typebox";
import type { Client } from "discord.js";
import type { AnyAgentTool } from "jarvis/plugin-sdk/discord";
import type { MusicService } from "../music/service.js";
import {
  buildMusicControls,
  buildVolumeControls,
  formatNowPlaying,
  formatQueue,
} from "../ui/components.js";

function stringEnum<T extends readonly string[]>(values: T, description: string) {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: [...values],
    description,
  });
}

/**
 * Create music tools for the plugin SDK
 */
export function createMusicTools(musicService: MusicService, client: Client): AnyAgentTool[] {
  return [
    createPlayMusicTool(musicService, client),
    createPauseMusicTool(musicService, client),
    createResumeMusicTool(musicService, client),
    createSkipMusicTool(musicService, client),
    createStopMusicTool(musicService, client),
    createSetVolumeTool(musicService, client),
    createGetQueueTool(musicService, client),
    createGetNowPlayingTool(musicService, client),
    createShuffleQueueTool(musicService, client),
    createSetLoopTool(musicService, client),
  ];
}

const MUSIC_SOURCES = ["youtube", "soundcloud", "spotify"] as const;

function createPlayMusicTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    userId: Type.String({ description: "The user requesting the music" }),
    channelId: Type.String({ description: "The text channel ID for responses" }),
    query: Type.String({ description: "Search query or URL for music" }),
    source: Type.Optional(stringEnum(MUSIC_SOURCES, "Music source (default: youtube)")),
  });

  return {
    name: "discord_play_music",
    label: "Play Music",
    description:
      "Play music in a voice channel from YouTube, SoundCloud, or Spotify. User must be in a voice channel.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      try {
        const guild = client.guilds.cache.get(params.guildId);
        if (!guild) {
          return { success: false, message: "Server not found, bestie! 😢" };
        }

        const member = await guild.members.fetch(params.userId);
        const textChannel = await guild.channels.fetch(params.channelId);
        if (!textChannel?.isTextBased()) {
          return { success: false, message: "Invalid text channel, hunty! 💅" };
        }

        const result = await musicService.play({
          guild,
          member,
          textChannel,
          query: params.query,
          source: params.source,
        });

        if (result.success) {
          const player = musicService.getExistingPlayer(params.guildId);
          if (player) {
            const nowPlaying = formatNowPlaying(player);
            const controls = buildMusicControls();
            const volumeControls = buildVolumeControls();

            return {
              success: true,
              message: result.message,
              embed: nowPlaying,
              components: [controls, volumeControls],
            };
          }
        }

        return result;
      } catch (error) {
        return {
          success: false,
          message: `Oop- music system error: ${String(error)} 😢`,
        };
      }
    },
  };
}

function createPauseMusicTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_pause_music",
    label: "Pause Music",
    description: "Pause the currently playing music in a server.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.pause(params.guildId);
    },
  };
}

function createResumeMusicTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_resume_music",
    label: "Resume Music",
    description: "Resume paused music in a server.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.resume(params.guildId);
    },
  };
}

function createSkipMusicTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_skip_music",
    label: "Skip Music",
    description: "Skip to the next track in the queue.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.skip(params.guildId);
    },
  };
}

function createStopMusicTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_stop_music",
    label: "Stop Music",
    description: "Stop music playback and clear the queue.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.stop(params.guildId);
    },
  };
}

function createSetVolumeTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    volume: Type.Number({
      description: "Volume level (0-100)",
      minimum: 0,
      maximum: 100,
    }),
  });

  return {
    name: "discord_set_volume",
    label: "Set Music Volume",
    description: "Set the music playback volume (0-100).",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.setVolume(params.guildId, params.volume);
    },
  };
}

function createGetQueueTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    page: Type.Optional(
      Type.Number({
        description: "Page number for queue pagination (default: 0)",
        minimum: 0,
      }),
    ),
  });

  return {
    name: "discord_get_queue",
    label: "Get Music Queue",
    description: "Get the current music queue for a server.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const result = musicService.getQueue(params.guildId);
      if (!result.success || !result.player) {
        return result;
      }

      const queueData = formatQueue(result.player, params.page ?? 0);
      const queueControls = buildMusicControls();

      return {
        success: true,
        message: result.message,
        embed: queueData,
        components: [queueControls],
      };
    },
  };
}

function createGetNowPlayingTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_now_playing",
    label: "Get Now Playing",
    description: "Get information about the currently playing track.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      const result = musicService.getNowPlaying(params.guildId);
      if (!result.success || !result.player) {
        return result;
      }

      const nowPlaying = formatNowPlaying(result.player);
      const controls = buildMusicControls();
      const volumeControls = buildVolumeControls();

      return {
        success: true,
        message: result.message,
        embed: nowPlaying,
        components: [controls, volumeControls],
      };
    },
  };
}

function createShuffleQueueTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
  });

  return {
    name: "discord_shuffle_queue",
    label: "Shuffle Queue",
    description: "Shuffle the music queue randomly.",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.shuffle(params.guildId);
    },
  };
}

const LOOP_MODES = ["off", "track", "queue"] as const;

function createSetLoopTool(musicService: MusicService, client: Client): AnyAgentTool {
  const schema = Type.Object({
    guildId: Type.String({ description: "The Discord server (guild) ID" }),
    mode: stringEnum(LOOP_MODES, "Loop mode: off, track (repeat current), or queue (repeat all)"),
  });

  return {
    name: "discord_set_loop",
    label: "Set Loop Mode",
    description:
      "Set the loop mode: off (no repeat), track (repeat current track), or queue (repeat all tracks).",
    parameters: schema,
    execute: async (_toolCallId, params: Static<typeof schema>) => {
      return musicService.setLoop(params.guildId, params.mode as "off" | "track" | "queue");
    },
  };
}
