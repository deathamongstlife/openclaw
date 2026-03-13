import type { Message, GuildMember, VoiceBasedChannel } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Guild as GuildConfig } from "../../database/models/guild.js";
import type { MusicService } from "../../music/service.js";
import type { ParsedCommand } from "../../nlp/parser.js";

export class MusicModule {
  constructor(private musicService: MusicService) {}

  /**
   * Handle music intent
   */
  async handleIntent(
    parsed: ParsedCommand,
    message: Message,
    guild: GuildConfig,
  ): Promise<string | null> {
    if (!message.guild || !message.member) {
      return null;
    }

    // Check if user is in a voice channel for most music commands
    const voiceChannel = (message.member as GuildMember).voice.channel;
    const requiresVoice = [
      "music.play",
      "music.pause",
      "music.resume",
      "music.skip",
      "music.stop",
      "music.volume",
    ];

    if (requiresVoice.includes(parsed.intent) && !voiceChannel) {
      return "You need to be in a voice channel to use music commands, bestie! 🎵";
    }

    switch (parsed.intent) {
      case "music.play":
        return await this.play(message, parsed, voiceChannel!);

      case "music.pause":
        return await this.pause(message);

      case "music.resume":
        return await this.resume(message);

      case "music.stop":
        return await this.stop(message);

      case "music.skip":
        return await this.skip(message);

      case "music.queue":
        return await this.showQueue(message);

      case "music.nowplaying":
        return await this.nowPlaying(message);

      case "music.volume":
        return await this.setVolume(message, parsed);

      case "music.shuffle":
        return await this.shuffle(message);

      case "music.loop":
        return await this.toggleLoop(message);

      default:
        return null;
    }
  }

  /**
   * Play music
   */
  private async play(
    message: Message,
    parsed: ParsedCommand,
    voiceChannel: VoiceBasedChannel,
  ): Promise<string> {
    if (!message.guild || !message.member) return "Not available in DMs!";

    const query = parsed.parameters.query as string | undefined;
    if (!query) {
      return "Please tell me what to play! Example: `play never gonna give you up` 🎵";
    }

    try {
      const result = await this.musicService.play({
        guild: message.guild,
        member: message.member as GuildMember,
        textChannel: message.channel,
        query,
      });

      return result.message;
    } catch (error) {
      return `Oop- couldn't play that! 😢\n${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Pause playback
   */
  private async pause(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = await this.musicService.pause(message.guild.id);
    return result.message;
  }

  /**
   * Resume playback
   */
  private async resume(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = await this.musicService.resume(message.guild.id);
    return result.message;
  }

  /**
   * Stop playback
   */
  private async stop(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = await this.musicService.stop(message.guild.id);
    return result.message;
  }

  /**
   * Skip current song
   */
  private async skip(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = await this.musicService.skip(message.guild.id);
    return result.message;
  }

  /**
   * Show queue
   */
  private async showQueue(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = this.musicService.getQueue(message.guild.id);

    if (!result.success || !result.player) {
      return result.message;
    }

    const player = result.player;
    const current = player.getCurrentTrack();
    const queue = player.getQueue();

    let response = "**Music Queue** 🎵\n\n";

    if (current) {
      response += `**Now Playing:**\n${current.info.title} - ${current.info.author}\n\n`;
    }

    if (queue.length > 0) {
      response += "**Up Next:**\n";
      queue.slice(0, 10).forEach((track, i) => {
        response += `${i + 1}. ${track.info.title} - ${track.info.author}\n`;
      });

      if (queue.length > 10) {
        response += `\n...and ${queue.length - 10} more tracks!`;
      }
    } else {
      response += "No more tracks in queue!";
    }

    return response;
  }

  /**
   * Show now playing
   */
  private async nowPlaying(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = this.musicService.getNowPlaying(message.guild.id);

    if (!result.success || !result.player) {
      return result.message;
    }

    const track = result.player.getCurrentTrack();
    if (!track) {
      return "Nothing is playing right now!";
    }

    const embed = new EmbedBuilder()
      .setTitle("Now Playing 🎵")
      .setDescription(`**${track.info.title}**\nby ${track.info.author}`)
      .setColor(0x5865f2);

    if (track.info.artworkUrl) {
      embed.setThumbnail(track.info.artworkUrl);
    }

    return `Here's what's playing, bestie! ✨\n${JSON.stringify(embed.toJSON())}`;
  }

  /**
   * Set volume
   */
  private async setVolume(message: Message, parsed: ParsedCommand): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const level = parsed.parameters.level as number | undefined;
    if (level === undefined || level < 0 || level > 100) {
      return "Please specify a volume between 0 and 100! Example: `volume 50`";
    }

    const result = await this.musicService.setVolume(message.guild.id, level);
    return result.message;
  }

  /**
   * Shuffle queue
   */
  private async shuffle(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const result = this.musicService.shuffle(message.guild.id);
    return result.message;
  }

  /**
   * Toggle loop mode
   */
  private async toggleLoop(message: Message): Promise<string> {
    if (!message.guild) return "Not available in DMs!";

    const player = this.musicService.getExistingPlayer(message.guild.id);
    if (!player) {
      return "Nothing is playing right now, bestie! 🎵";
    }

    const currentMode = player.getLoopMode();
    const newMode = currentMode === "off" ? "queue" : "off";
    const result = this.musicService.setLoop(message.guild.id, newMode);
    return result.message;
  }
}
