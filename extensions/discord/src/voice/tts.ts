import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  entersState,
  type VoiceConnection,
  type AudioPlayer,
  StreamType,
} from "@discordjs/voice";
import { getVoiceStream } from "discord-tts";
import type { VoiceBasedChannel, Guild } from "discord.js";

/**
 * Voice TTS manager for speaking in voice channels
 */
export class VoiceTTSManager {
  private connections = new Map<string, VoiceConnection>();
  private players = new Map<string, AudioPlayer>();

  /**
   * Join a voice channel
   */
  async joinChannel(channel: VoiceBasedChannel): Promise<VoiceConnection> {
    const existingConnection = this.connections.get(channel.guild.id);
    if (existingConnection) {
      return existingConnection;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      this.connections.set(channel.guild.id, connection);

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this.leaveChannel(channel.guild.id);
        }
      });

      return connection;
    } catch (error) {
      connection.destroy();
      throw error;
    }
  }

  /**
   * Leave a voice channel
   */
  leaveChannel(guildId: string): void {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
    }

    const player = this.players.get(guildId);
    if (player) {
      player.stop();
      this.players.delete(guildId);
    }
  }

  /**
   * Speak text in a voice channel using TTS
   */
  async speak(channel: VoiceBasedChannel, text: string, lang: string = "en"): Promise<void> {
    const connection = await this.joinChannel(channel);

    let player = this.players.get(channel.guild.id);
    if (!player) {
      player = createAudioPlayer();
      this.players.set(channel.guild.id, player);
      connection.subscribe(player);
    }

    return new Promise((resolve, reject) => {
      try {
        const stream = getVoiceStream(text, { lang });
        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

        player!.play(resource);

        player!.once(AudioPlayerStatus.Idle, () => {
          resolve();
        });

        player!.once("error", (error) => {
          console.error("TTS player error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if bot is in a voice channel for a guild
   */
  isInVoiceChannel(guildId: string): boolean {
    return this.connections.has(guildId);
  }

  /**
   * Get voice connection for a guild
   */
  getConnection(guildId: string): VoiceConnection | null {
    return this.connections.get(guildId) ?? null;
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    for (const [guildId, connection] of this.connections) {
      connection.destroy();
      this.connections.delete(guildId);
    }

    for (const [guildId, player] of this.players) {
      player.stop();
      this.players.delete(guildId);
    }
  }
}
