import type { VoiceBasedChannel, TextBasedChannel } from "discord.js";
import type { Player as ShoukakuPlayer, Track } from "shoukaku";
import { MusicQueue, type QueuedTrack } from "./queue.js";

export interface PlayerOptions {
  guildId: string;
  voiceChannel: VoiceBasedChannel;
  textChannel: TextBasedChannel;
  shoukakuPlayer: ShoukakuPlayer;
}

/**
 * Music player for a guild with queue management
 */
export class MusicPlayer {
  public readonly guildId: string;
  public readonly voiceChannel: VoiceBasedChannel;
  public readonly textChannel: TextBasedChannel;
  private readonly player: ShoukakuPlayer;
  private readonly queue: MusicQueue;

  private volume = 100;
  private isPaused = false;
  private loopMode: "off" | "track" | "queue" = "off";
  private isDestroyed = false;

  constructor(options: PlayerOptions) {
    this.guildId = options.guildId;
    this.voiceChannel = options.voiceChannel;
    this.textChannel = options.textChannel;
    this.player = options.shoukakuPlayer;
    this.queue = new MusicQueue();

    this.setupEventHandlers();
  }

  /**
   * Setup player event handlers
   */
  private setupEventHandlers(): void {
    this.player.on("end", (reason) => {
      if (this.isDestroyed) return;

      if (reason.reason === "finished" || reason.reason === "loadFailed") {
        this.handleTrackEnd();
      }
    });

    this.player.on("exception", (error) => {
      console.error(`Player exception in guild ${this.guildId}:`, error);
      this.handleTrackEnd();
    });

    this.player.on("stuck", () => {
      console.warn(`Player stuck in guild ${this.guildId}, skipping track`);
      this.handleTrackEnd();
    });
  }

  /**
   * Handle track ending
   */
  private async handleTrackEnd(): Promise<void> {
    if (this.loopMode === "track" && this.queue.currentTrack) {
      await this.playTrack(this.queue.currentTrack);
      return;
    }

    if (this.loopMode === "queue" && this.queue.currentTrack) {
      this.queue.enqueue(this.queue.currentTrack);
    }

    const next = this.queue.dequeue();
    if (next) {
      await this.playTrack(next);
    } else {
      this.queue.currentTrack = null;
    }
  }

  /**
   * Add track to queue and play if nothing is playing
   */
  async addTrack(track: Track, requestedBy: string): Promise<QueuedTrack> {
    const queuedTrack: QueuedTrack = {
      track,
      requestedBy,
      addedAt: Date.now(),
    };

    this.queue.enqueue(queuedTrack);

    if (!this.queue.currentTrack && !this.player.track) {
      const next = this.queue.dequeue();
      if (next) {
        await this.playTrack(next);
      }
    }

    return queuedTrack;
  }

  /**
   * Play a track
   */
  private async playTrack(queuedTrack: QueuedTrack): Promise<void> {
    this.queue.currentTrack = queuedTrack;

    try {
      await this.player.playTrack({ track: { encoded: queuedTrack.track.encoded } });
      await this.player.setGlobalVolume(this.volume);
    } catch (error) {
      console.error(`Failed to play track in guild ${this.guildId}:`, error);
      this.handleTrackEnd();
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<boolean> {
    if (this.isPaused) return false;

    await this.player.setPaused(true);
    this.isPaused = true;
    return true;
  }

  /**
   * Resume playback
   */
  async resume(): Promise<boolean> {
    if (!this.isPaused) return false;

    await this.player.setPaused(false);
    this.isPaused = false;
    return true;
  }

  /**
   * Skip current track
   */
  async skip(): Promise<boolean> {
    if (!this.queue.currentTrack) return false;

    await this.player.stopTrack();
    return true;
  }

  /**
   * Stop playback and clear queue
   */
  async stop(): Promise<void> {
    this.queue.clear();
    this.queue.currentTrack = null;
    await this.player.stopTrack();
  }

  /**
   * Set volume (0-100)
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, volume));
    await this.player.setGlobalVolume(this.volume);
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set loop mode
   */
  setLoop(mode: "off" | "track" | "queue"): void {
    this.loopMode = mode;
  }

  /**
   * Get loop mode
   */
  getLoop(): "off" | "track" | "queue" {
    return this.loopMode;
  }

  /**
   * Shuffle queue
   */
  shuffle(): void {
    this.queue.shuffle();
  }

  /**
   * Get queue
   */
  getQueue(): MusicQueue {
    return this.queue;
  }

  /**
   * Get current track
   */
  getCurrentTrack(): QueuedTrack | null {
    return this.queue.currentTrack;
  }

  /**
   * Check if paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Seek to position in current track
   */
  async seek(position: number): Promise<void> {
    if (!this.queue.currentTrack) {
      throw new Error("No track is currently playing");
    }

    await this.player.seekTo(position);
  }

  /**
   * Destroy player and cleanup
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.queue.clear();
    this.queue.currentTrack = null;

    try {
      await this.player.connection.disconnect();
    } catch (error) {
      console.error(`Failed to disconnect player in guild ${this.guildId}:`, error);
    }
  }
}
