import type { Guild, GuildMember, VoiceBasedChannel, TextBasedChannel } from "discord.js";
import { ChannelType } from "discord.js";
import { MusicManager } from "./manager.js";
import { MusicPlayer } from "./player.js";

/**
 * Music service that manages players across guilds
 */
export class MusicService {
  private players = new Map<string, MusicPlayer>();

  constructor(private musicManager: MusicManager) {}

  /**
   * Get or create player for a guild
   */
  async getPlayer(
    guild: Guild,
    voiceChannel: VoiceBasedChannel,
    textChannel: TextBasedChannel,
  ): Promise<MusicPlayer> {
    const existingPlayer = this.players.get(guild.id);
    if (existingPlayer) {
      return existingPlayer;
    }

    const shoukaku = this.musicManager.getShoukaku();
    if (!shoukaku) {
      throw new Error("Music system not initialized");
    }

    const node = this.musicManager.getNode(guild.id);
    if (!node) {
      throw new Error("No Lavalink nodes available");
    }

    const shoukakuPlayer = await node.joinChannel({
      guildId: guild.id,
      channelId: voiceChannel.id,
      shardId: guild.shardId,
    });

    const player = new MusicPlayer({
      guildId: guild.id,
      voiceChannel,
      textChannel,
      shoukakuPlayer,
    });

    this.players.set(guild.id, player);
    return player;
  }

  /**
   * Get existing player for a guild
   */
  getExistingPlayer(guildId: string): MusicPlayer | null {
    return this.players.get(guildId) ?? null;
  }

  /**
   * Destroy player for a guild
   */
  async destroyPlayer(guildId: string): Promise<void> {
    const player = this.players.get(guildId);
    if (player) {
      await player.destroy();
      this.players.delete(guildId);
    }
  }

  /**
   * Play music from query
   */
  async play(params: {
    guild: Guild;
    member: GuildMember;
    textChannel: TextBasedChannel;
    query: string;
    source?: "youtube" | "soundcloud" | "spotify";
  }): Promise<{ success: boolean; message: string }> {
    const { guild, member, textChannel, query, source = "youtube" } = params;

    if (!member.voice.channel) {
      return { success: false, message: "Bestie, you need to be in a voice channel! 🎤" };
    }

    if (
      member.voice.channel.type !== ChannelType.GuildVoice &&
      member.voice.channel.type !== ChannelType.GuildStageVoice
    ) {
      return { success: false, message: "Oop- that's not a valid voice channel, hunty! 💅" };
    }

    try {
      const result = await this.musicManager.search(query, source);
      if (!result || !result.data) {
        return { success: false, message: "Couldn't find that track, sorry bestie! 😢" };
      }

      const tracks = result.loadType === "playlist" ? result.data.tracks : [result.data[0]];
      if (!tracks || tracks.length === 0) {
        return { success: false, message: "No tracks found for that query! 🤷" };
      }

      const player = await this.getPlayer(guild, member.voice.channel, textChannel);

      let message = "";
      if (result.loadType === "playlist" && result.data.info) {
        for (const track of tracks) {
          if (track) {
            await player.addTrack(track, member.id);
          }
        }
        message = `Omg yasss! Added **${tracks.length}** bops from **${result.data.info.name}** to the queue! 💅✨`;
      } else {
        const track = tracks[0];
        if (!track) {
          return { success: false, message: "Track not found! 😢" };
        }
        await player.addTrack(track, member.id);
        message = `Now serving: **${track.info.title}** by **${track.info.author}**! 🎵✨`;
      }

      return { success: true, message };
    } catch (error) {
      console.error("Music play error:", error);
      return { success: false, message: `Oop- something went wrong, bestie! ${String(error)}` };
    }
  }

  /**
   * Pause playback
   */
  async pause(guildId: string): Promise<{ success: boolean; message: string }> {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    const paused = await player.pause();
    if (!paused) {
      return { success: false, message: "Already paused, hunty! ⏸️" };
    }

    return { success: true, message: "Paused the vibes! ⏸️✨" };
  }

  /**
   * Resume playback
   */
  async resume(guildId: string): Promise<{ success: boolean; message: string }> {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    const resumed = await player.resume();
    if (!resumed) {
      return { success: false, message: "Not paused, hunty! ▶️" };
    }

    return { success: true, message: "Back to the vibes! ▶️✨" };
  }

  /**
   * Skip current track
   */
  async skip(guildId: string): Promise<{ success: boolean; message: string }> {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    const skipped = await player.skip();
    if (!skipped) {
      return { success: false, message: "Nothing to skip! 🤷" };
    }

    return { success: true, message: "Skipped to the next bop! ⏭️✨" };
  }

  /**
   * Stop playback
   */
  async stop(guildId: string): Promise<{ success: boolean; message: string }> {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    await player.stop();
    await this.destroyPlayer(guildId);

    return { success: true, message: "Stopped the music and cleared the queue! ⏹️✨" };
  }

  /**
   * Set volume
   */
  async setVolume(guildId: string, volume: number): Promise<{ success: boolean; message: string }> {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    await player.setVolume(volume);
    return { success: true, message: `Volume set to ${volume}%! 🔊✨` };
  }

  /**
   * Get current queue
   */
  getQueue(guildId: string): { success: boolean; message: string; player?: MusicPlayer } {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    return { success: true, message: "Queue retrieved!", player };
  }

  /**
   * Get now playing info
   */
  getNowPlaying(guildId: string): { success: boolean; message: string; player?: MusicPlayer } {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    const current = player.getCurrentTrack();
    if (!current) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    return { success: true, message: "Now playing info retrieved!", player };
  }

  /**
   * Shuffle queue
   */
  shuffle(guildId: string): { success: boolean; message: string } {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    player.shuffle();
    return { success: true, message: "Queue shuffled! 🔀✨" };
  }

  /**
   * Set loop mode
   */
  setLoop(guildId: string, mode: "off" | "track" | "queue"): { success: boolean; message: string } {
    const player = this.getExistingPlayer(guildId);
    if (!player) {
      return { success: false, message: "Nothing is playing right now, bestie! 🎵" };
    }

    player.setLoop(mode);

    const modeText = mode === "off" ? "off" : mode === "track" ? "track" : "queue";
    return { success: true, message: `Loop mode set to ${modeText}! 🔁✨` };
  }

  /**
   * Cleanup all players
   */
  async cleanup(): Promise<void> {
    for (const [guildId, player] of this.players) {
      await player.destroy();
      this.players.delete(guildId);
    }
  }
}
