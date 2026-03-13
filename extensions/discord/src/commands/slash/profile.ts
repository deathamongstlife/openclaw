// /profile - View user profile and preferences
import type { ChatInputCommandInteraction } from "discord.js";
import {
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  EmbedBuilder,
} from "discord.js";
import type { DiscordBotStore } from "../../database/store.js";
import type { SlashCommandDefinition } from "./registry.js";

export const profileCommand: SlashCommandDefinition = {
  name: "profile",
  description: "View your profile and preferences",
  options: [
    {
      name: "user",
      description: "User to view (defaults to you)",
      type: ApplicationCommandOptionType.User,
      required: false,
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
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const isOwnProfile = targetUser.id === interaction.user.id;

    // Fetch profile and preferences
    const profile = await store.getUserProfile(targetUser.id);
    const preferences = await store.getUserPreferences(targetUser.id);

    // Build profile embed
    const embed = new EmbedBuilder()
      .setTitle(`${isOwnProfile ? "Your" : `${targetUser.username}'s`} Profile 👤`)
      .setColor(
        profile.favoriteColor ? parseInt(profile.favoriteColor.replace("#", ""), 16) : 0x7289da,
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    // Add profile fields
    const fields = [];

    if (profile.preferredName) {
      fields.push({
        name: "Preferred Name",
        value: profile.preferredName,
        inline: true,
      });
    }

    if (profile.pronouns) {
      fields.push({
        name: "Pronouns",
        value: profile.pronouns,
        inline: true,
      });
    }

    if (profile.favoriteColor) {
      fields.push({
        name: "Favorite Color",
        value: profile.favoriteColor,
        inline: true,
      });
    }

    if (profile.musicPreference) {
      fields.push({
        name: "Music Preference",
        value: profile.musicPreference.charAt(0).toUpperCase() + profile.musicPreference.slice(1),
        inline: true,
      });
    }

    if (isOwnProfile) {
      // Show preferences only for own profile
      fields.push({
        name: "Auto Join Voice",
        value: preferences.autoJoinVoice ? "✅ Enabled" : "❌ Disabled",
        inline: true,
      });

      fields.push({
        name: "Default Volume",
        value: `${preferences.defaultVolume}%`,
        inline: true,
      });

      fields.push({
        name: "DM Notifications",
        value: preferences.dmNotifications ? "✅ Enabled" : "❌ Disabled",
        inline: true,
      });
    }

    if (fields.length === 0) {
      embed.setDescription(
        `${isOwnProfile ? "You haven't" : `${targetUser.username} hasn't`} set up ${isOwnProfile ? "your" : "their"} profile yet! ${isOwnProfile ? "Chat with me to get started! ✨" : ""}`,
      );
    } else {
      embed.addFields(fields);
    }

    // Add footer
    embed.setFooter({
      text: profile.onboarded
        ? `Member since ${new Date(profile.createdAt).toLocaleDateString()} ⚡`
        : "Not onboarded yet",
    });

    // Send response (always ephemeral for privacy)
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
