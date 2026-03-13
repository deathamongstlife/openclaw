// /lookup - Look up information
import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
} from "discord.js";
import type { DiscordBotStore } from "../../database/store.js";
import type { SlashCommandDefinition } from "./registry.js";
import { shouldBeEphemeral } from "./registry.js";

// Simple lookup simulation (would integrate with real search APIs)
async function performLookup(
  query: string,
): Promise<{ title: string; description: string; url?: string }> {
  const lowerQuery = query.toLowerCase();

  // Simulated responses for common queries
  if (lowerQuery.includes("discord")) {
    return {
      title: "Discord",
      description:
        "Discord is a free voice, video, and text chat app used by tens of millions of people to talk and hang out with their communities and friends.",
      url: "https://discord.com",
    };
  }

  if (lowerQuery.includes("jarvis") || lowerQuery.includes("ai")) {
    return {
      title: "JARVIS AI Assistant",
      description:
        "JARVIS is an advanced natural language AI assistant with fruity chaos gremlin personality. Available as a Discord bot with music, moderation, and automation features! 🦞✨",
    };
  }

  if (lowerQuery.includes("music")) {
    return {
      title: "Music Streaming",
      description:
        "JARVIS supports playing music from YouTube, SoundCloud, and Spotify! Use the `/music` command to get started! 🎵",
    };
  }

  // Generic response
  return {
    title: `Search Results for "${query}"`,
    description: `Here's what I found about "${query}":\n\nThis is a demonstration of the lookup command! In a production environment, this would integrate with real search APIs like Google, Wikipedia, DuckDuckGo, or specialized documentation sources.\n\nFor now, try asking me about Discord, JARVIS, or music! 🔍✨`,
  };
}

export const lookupCommand: SlashCommandDefinition = {
  name: "lookup",
  description: "Look up information about anything",
  options: [
    {
      name: "query",
      description: "What do you want to look up?",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
  async execute(interaction: ChatInputCommandInteraction, store: DiscordBotStore) {
    const query = interaction.options.getString("query", true);
    const ephemeral = shouldBeEphemeral(interaction);

    // Defer reply for processing time
    await interaction.deferReply({ ephemeral });

    // Perform lookup
    const result = await performLookup(query);

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(result.title)
      .setDescription(result.description)
      .setColor(0x7289da)
      .setFooter({ text: "🔍 JARVIS Lookup" })
      .setTimestamp();

    if (result.url) {
      embed.setURL(result.url);
    }

    // Send response
    await interaction.editReply({
      embeds: [embed],
    });

    // Log successful lookup
    console.log(`Lookup by ${interaction.user.tag}: ${query}`);
  },
};
