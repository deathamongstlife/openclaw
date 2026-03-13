// Slash Command Registration for User-Installable App
import type { Client, CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import {
  REST,
  Routes,
  ApplicationCommandOptionType,
  ApplicationIntegrationType,
  InteractionContextType,
  ChannelType,
} from "discord.js";
import type { DiscordBotStore } from "../../database/store.js";

export interface SlashCommandDefinition {
  name: string;
  description: string;
  options?: Array<{
    name: string;
    description: string;
    type: ApplicationCommandOptionType;
    required?: boolean;
    choices?: Array<{ name: string; value: string }>;
  }>;
  integration_types: ApplicationIntegrationType[];
  contexts: InteractionContextType[];
  execute: (interaction: ChatInputCommandInteraction, store: DiscordBotStore) => Promise<void>;
}

export function shouldBeEphemeral(interaction: CommandInteraction): boolean {
  // Ephemeral in servers (guilds)
  if (interaction.guild) return true;

  // Ephemeral in DMs
  if (interaction.channel?.type === ChannelType.DM) return true;

  // Non-ephemeral in group DMs
  if (interaction.channel?.type === ChannelType.GroupDM) return false;

  return true; // Default to ephemeral
}

export function getInteractionContext(
  interaction: CommandInteraction,
): "guild" | "dm" | "group_dm" {
  if (interaction.guild) return "guild";
  if (interaction.channel?.type === ChannelType.DM) return "dm";
  if (interaction.channel?.type === ChannelType.GroupDM) return "group_dm";
  return "dm"; // Default
}

export class SlashCommandRegistry {
  private commands: Map<string, SlashCommandDefinition> = new Map();

  constructor(
    private client: Client,
    private store: DiscordBotStore,
    private token: string,
  ) {}

  registerCommand(command: SlashCommandDefinition): void {
    this.commands.set(command.name, command);
  }

  async deployCommands(): Promise<void> {
    const rest = new REST({ version: "10" }).setToken(this.token);

    const commandData = Array.from(this.commands.values()).map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options,
      integration_types: cmd.integration_types,
      contexts: cmd.contexts,
    }));

    try {
      console.log(`🔄 Deploying ${commandData.length} slash commands...`);

      await rest.put(Routes.applicationCommands(this.client.user!.id), {
        body: commandData,
      });

      console.log(`✅ Successfully deployed ${commandData.length} slash commands!`);
    } catch (error) {
      console.error("Failed to deploy slash commands:", error);
    }
  }

  async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "Oop- unknown command, bestie! 😢",
        ephemeral: true,
      });
      return;
    }

    try {
      // Log the command usage
      await this.store.logSlashCommand({
        user_id: interaction.user.id,
        command: interaction.commandName,
        context: getInteractionContext(interaction),
        was_ephemeral: shouldBeEphemeral(interaction),
      });

      // Execute the command
      await command.execute(interaction, this.store);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = "Oop- something went wrong executing that command, hunty! 😢";

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  }

  setupInteractionHandler(): void {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleInteraction(interaction);
    });
  }
}
