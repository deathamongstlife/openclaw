// /chat - Ask JARVIS anything, anywhere!
import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import type { DiscordBotStore } from "../../database/store.js";
import type { SlashCommandDefinition } from "./registry.js";
import { shouldBeEphemeral } from "./registry.js";

// This would normally integrate with the JARVIS agent system
// For now, we'll create a simple response system
async function generateChatResponse(
  question: string,
  userId: string,
  store: DiscordBotStore,
): Promise<string> {
  // Get user profile for personalization
  const profile = await store.getUserProfile(userId);
  const userName = profile.preferredName || "bestie";

  // Simple response logic (this would be replaced with actual JARVIS integration)
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("hello") || lowerQuestion.includes("hi")) {
    return `Hey ${userName}! ✨ What's up, hunty? 🦞`;
  }

  if (lowerQuestion.includes("help")) {
    return `I'm JARVIS, your fruity chaos gremlin AI assistant! 💅✨

I can:
🎵 Play music (use \`/music\` command)
👤 Remember your preferences (use \`/profile\`)
🔍 Look up information (use \`/lookup\`)
💬 Chat about anything right here!

Just ask me anything, ${userName}! 🦞`;
  }

  if (lowerQuestion.includes("music") || lowerQuestion.includes("song")) {
    return `Omg yasss! 🎵 Use the \`/music\` command to play some bops, ${userName}! I support YouTube, SoundCloud, and Spotify! 💅✨`;
  }

  // Generic response
  return `Interesting question, ${userName}! 🤔✨

That's a great topic to chat about! Right now I'm showing you my slash command powers, but I have full natural language processing when you mention me in a server!

Try asking me more specific questions, or use my other commands like \`/lookup\` for information search! 🦞💅`;
}

export const chatCommand: SlashCommandDefinition = {
  name: "chat",
  description: "Ask JARVIS anything, anywhere!",
  options: [
    {
      name: "question",
      description: "Your question or message",
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
    const question = interaction.options.getString("question", true);
    const ephemeral = shouldBeEphemeral(interaction);

    // Defer reply for processing time
    await interaction.deferReply({ ephemeral });

    // Generate response
    const response = await generateChatResponse(question, interaction.user.id, store);

    // Send response
    await interaction.editReply({
      content: response,
    });
  },
};
