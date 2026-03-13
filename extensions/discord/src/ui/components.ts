import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import type { MusicPlayer } from "../music/player.js";

/**
 * Build music control buttons (Components V2)
 */
export function buildMusicControls(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_play_pause")
      .setLabel("⏯️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("music_skip").setLabel("⏭️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_stop").setLabel("⏹️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music_shuffle").setLabel("🔀").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_loop").setLabel("🔁").setStyle(ButtonStyle.Secondary),
  );
}

/**
 * Build volume control buttons
 */
export function buildVolumeControls(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_volume_down")
      .setLabel("🔉")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_volume_up")
      .setLabel("🔊")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_volume_mute")
      .setLabel("🔇")
      .setStyle(ButtonStyle.Secondary),
  );
}

/**
 * Build queue navigation buttons
 */
export function buildQueueControls(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder().setCustomId("queue_prev_page").setLabel("◀️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("queue_next_page").setLabel("▶️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("queue_clear")
      .setLabel("🗑️ Clear")
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Build music source selector
 */
export function buildSourceSelector(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("music_source_select")
      .setPlaceholder("Choose music source")
      .addOptions(
        {
          label: "YouTube",
          description: "Search YouTube for music",
          value: "youtube",
          emoji: "🎥",
        },
        {
          label: "SoundCloud",
          description: "Search SoundCloud for music",
          value: "soundcloud",
          emoji: "☁️",
        },
        {
          label: "Spotify",
          description: "Search Spotify for music",
          value: "spotify",
          emoji: "🎵",
        },
      ),
  );
}

/**
 * Build moderation quick actions
 */
export function buildModerationControls(
  userId: string,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`mod_warn_${userId}`)
      .setLabel("⚠️ Warn")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`mod_timeout_${userId}`)
      .setLabel("⏱️ Timeout")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`mod_kick_${userId}`)
      .setLabel("👢 Kick")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`mod_ban_${userId}`)
      .setLabel("🔨 Ban")
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Build server info navigation buttons
 */
export function buildServerInfoControls(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("server_info_overview")
      .setLabel("📊 Overview")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("server_info_members")
      .setLabel("👥 Members")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("server_info_roles")
      .setLabel("🎭 Roles")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("server_info_channels")
      .setLabel("📢 Channels")
      .setStyle(ButtonStyle.Primary),
  );
}

/**
 * Build user profile controls
 */
export function buildUserProfileControls(
  userId: string,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`user_profile_${userId}`)
      .setLabel("👤 Profile")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`user_warnings_${userId}`)
      .setLabel("⚠️ Warnings")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`user_roles_${userId}`)
      .setLabel("🎭 Roles")
      .setStyle(ButtonStyle.Secondary),
  );
}

/**
 * Build poll controls
 */
export function buildPollControls(
  pollId: string,
  options: string[],
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  const maxButtonsPerRow = 5;

  for (let i = 0; i < options.length; i += maxButtonsPerRow) {
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
    const chunk = options.slice(i, i + maxButtonsPerRow);

    for (let j = 0; j < chunk.length; j++) {
      const option = chunk[j];
      if (option) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_vote_${pollId}_${i + j}`)
            .setLabel(option)
            .setStyle(ButtonStyle.Secondary),
        );
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Build confirmation dialog
 */
export function buildConfirmationControls(
  actionId: string,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_yes_${actionId}`)
      .setLabel("✅ Confirm")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`confirm_no_${actionId}`)
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Format now playing embed data
 */
export function formatNowPlaying(player: MusicPlayer): {
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
} {
  const current = player.getCurrentTrack();
  if (!current) {
    return {
      title: "Nothing Playing",
      description: "The queue is empty! Add some tracks to get started! ✨",
      fields: [],
    };
  }

  const track = current.track;
  const duration = track.info.length ? formatDuration(track.info.length) : "Unknown";
  const isPaused = player.getIsPaused();
  const volume = player.getVolume();
  const loopMode = player.getLoop();

  return {
    title: `🎵 Now Playing`,
    description: `**${track.info.title}**\nby ${track.info.author}`,
    fields: [
      {
        name: "Duration",
        value: duration,
        inline: true,
      },
      {
        name: "Status",
        value: isPaused ? "⏸️ Paused" : "▶️ Playing",
        inline: true,
      },
      {
        name: "Volume",
        value: `${volume}%`,
        inline: true,
      },
      {
        name: "Loop",
        value: loopMode === "off" ? "Off" : loopMode === "track" ? "🔂 Track" : "🔁 Queue",
        inline: true,
      },
      {
        name: "Requested By",
        value: `<@${current.requestedBy}>`,
        inline: true,
      },
    ],
  };
}

/**
 * Format queue embed data
 */
export function formatQueue(
  player: MusicPlayer,
  page: number = 0,
  tracksPerPage: number = 10,
): {
  title: string;
  description: string;
  footer: string;
} {
  const queue = player.getQueue();
  const tracks = queue.getTracks();
  const totalPages = Math.ceil(tracks.length / tracksPerPage);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const start = currentPage * tracksPerPage;
  const end = start + tracksPerPage;
  const pageTracks = tracks.slice(start, end);

  const current = player.getCurrentTrack();
  let description = "";

  if (current) {
    description += `**Now Playing:**\n${current.track.info.title} - ${current.track.info.author}\n\n`;
  }

  if (pageTracks.length === 0) {
    description += "Queue is empty! Add some tracks! ✨";
  } else {
    description += "**Up Next:**\n";
    for (let i = 0; i < pageTracks.length; i++) {
      const track = pageTracks[i];
      if (track) {
        const position = start + i + 1;
        description += `${position}. ${track.track.info.title} - ${track.track.info.author}\n`;
      }
    }
  }

  return {
    title: "🎵 Music Queue",
    description,
    footer: `Page ${currentPage + 1}/${totalPages || 1} • ${tracks.length} tracks in queue`,
  };
}

/**
 * Format duration from milliseconds
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
