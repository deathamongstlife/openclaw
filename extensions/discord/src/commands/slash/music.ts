// /music - Control music playback (guild-only)
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
} from "discord.js";
import type { DiscordBotStore } from "../../database/store.js";
import type { SlashCommandDefinition } from "./registry.js";

export const musicCommand: SlashCommandDefinition = {
  name: "music",
  description: "Control music playback",
  options: [
    {
      name: "action",
      description: "What do you want to do?",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Play", value: "play" },
        { name: "Pause", value: "pause" },
        { name: "Resume", value: "resume" },
        { name: "Skip", value: "skip" },
        { name: "Stop", value: "stop" },
        { name: "Queue", value: "queue" },
        { name: "Now Playing", value: "nowplaying" },
      ],
    },
    {
      name: "query",
      description: "Song to play (for 'play' action)",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.Guild, // Music only works in guilds
  ],
  async execute(interaction: ChatInputCommandInteraction, store: DiscordBotStore) {
    // Music requires guild context
    if (!interaction.guild) {
      await interaction.reply({
        content: "Oop- music commands only work in servers, bestie! 😢",
        ephemeral: true,
      });
      return;
    }

    const action = interaction.options.getString("action", true);
    const query = interaction.options.getString("query");

    // Check if user is in voice channel
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel && action === "play") {
      await interaction.reply({
        content: "Oop- you need to be in a voice channel to play music, hunty! 🎵",
        ephemeral: true,
      });
      return;
    }

    // Handle different actions
    switch (action) {
      case "play":
        if (!query) {
          await interaction.reply({
            content: "Bestie, you need to tell me what song to play! 🎵",
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: `Omg yasss! 🎵 Playing "${query}" for you, ${member.user.username}! 💅✨\n\n*Note: This is a demo response. In production, this would integrate with the actual music system (Lavalink) to play the requested song!*`,
          ephemeral: false,
        });
        break;

      case "pause":
        await interaction.reply({
          content: "Pausing the music, bestie! ⏸️",
          ephemeral: false,
        });
        break;

      case "resume":
        await interaction.reply({
          content: "Resuming the bops! ▶️✨",
          ephemeral: false,
        });
        break;

      case "skip":
        await interaction.reply({
          content: "Skipping to the next banger! ⏭️💅",
          ephemeral: false,
        });
        break;

      case "stop":
        await interaction.reply({
          content: "Stopping the music and leaving voice, hunty! 🛑",
          ephemeral: false,
        });
        break;

      case "queue":
        const queueEmbed = new EmbedBuilder()
          .setTitle("🎵 Music Queue")
          .setDescription(
            "*Demo queue - in production, this would show the actual song queue!*\n\n1. Current Song - Artist\n2. Next Song - Artist\n3. Another Bop - Artist",
          )
          .setColor(0x7289da)
          .setFooter({ text: "JARVIS Music System 🦞" });

        await interaction.reply({
          embeds: [queueEmbed],
          ephemeral: false,
        });
        break;

      case "nowplaying":
        const npEmbed = new EmbedBuilder()
          .setTitle("🎵 Now Playing")
          .setDescription(
            "**Current Song - Artist**\n\n`[===>-----] 2:30 / 5:00`\n\nVolume: 🔊 75%",
          )
          .setColor(0x7289da)
          .setFooter({ text: "JARVIS Music System 🦞" })
          .setTimestamp();

        await interaction.reply({
          embeds: [npEmbed],
          ephemeral: false,
        });
        break;

      default:
        await interaction.reply({
          content: "Oop- unknown action, bestie! 😢",
          ephemeral: true,
        });
    }
  },
};
