/**
 * Intent types that the bot can recognize
 */
export type Intent =
  // Moderation
  | "moderation.warn"
  | "moderation.kick"
  | "moderation.ban"
  | "moderation.unban"
  | "moderation.timeout"
  | "moderation.mute"
  | "moderation.unmute"
  | "moderation.purge"
  | "moderation.slowmode"
  | "moderation.lock"
  | "moderation.unlock"
  | "moderation.warnings.list"
  | "moderation.warnings.clear"
  // Server Management
  | "server.info"
  | "server.members"
  | "server.roles.list"
  | "server.roles.create"
  | "server.roles.delete"
  | "server.roles.assign"
  | "server.roles.remove"
  | "server.channels.list"
  | "server.channels.create"
  | "server.channels.delete"
  // User Management
  | "user.info"
  | "user.avatar"
  | "user.roles"
  // Music
  | "music.play"
  | "music.pause"
  | "music.resume"
  | "music.stop"
  | "music.skip"
  | "music.queue"
  | "music.nowplaying"
  | "music.volume"
  | "music.seek"
  | "music.shuffle"
  | "music.loop"
  | "music.playlist.save"
  | "music.playlist.load"
  | "music.playlist.list"
  // Utility
  | "utility.poll"
  | "utility.remind"
  | "utility.search"
  | "utility.tag.create"
  | "utility.tag.get"
  | "utility.tag.list"
  | "utility.tag.delete"
  // Configuration
  | "config.module.enable"
  | "config.module.disable"
  | "config.module.status"
  | "config.set.welcome"
  | "config.set.log"
  | "config.set.modrole"
  | "config.automod.configure"
  // Fun
  | "fun.8ball"
  | "fun.dice"
  | "fun.coin"
  | "fun.trivia"
  // General
  | "general.help"
  | "general.ping"
  | "general.unknown";

/**
 * Intent patterns for matching natural language
 */
export interface IntentPattern {
  intent: Intent;
  patterns: RegExp[];
  examples: string[];
  requiredPermissions?: string[];
}

/**
 * All intent patterns for matching
 */
export const intentPatterns: IntentPattern[] = [
  // Moderation - Warn
  {
    intent: "moderation.warn",
    patterns: [/warn\s+<@!?(\d+)>|@(\w+)/i, /give\s+.*warning/i, /issue\s+.*warning/i],
    examples: [
      "warn @user for spamming",
      "give user a warning for breaking rules",
      "issue a warning to @baduser",
    ],
    requiredPermissions: ["ModerateMembers"],
  },

  // Moderation - Kick
  {
    intent: "moderation.kick",
    patterns: [/kick\s+<@!?(\d+)>|@(\w+)/i, /remove\s+<@!?(\d+)>|@(\w+)\s+from\s+(the\s+)?server/i],
    examples: ["kick @user for spam", "remove @baduser from the server"],
    requiredPermissions: ["KickMembers"],
  },

  // Moderation - Ban
  {
    intent: "moderation.ban",
    patterns: [/ban\s+<@!?(\d+)>|@(\w+)/i, /permanently\s+remove\s+<@!?(\d+)>|@(\w+)/i],
    examples: ["ban @user", "permanently remove @spammer"],
    requiredPermissions: ["BanMembers"],
  },

  // Moderation - Timeout
  {
    intent: "moderation.timeout",
    patterns: [
      /timeout\s+<@!?(\d+)>|@(\w+)/i,
      /mute\s+<@!?(\d+)>|@(\w+)\s+for\s+(\d+)\s*(minutes?|hours?|days?)/i,
      /time\s*out\s+<@!?(\d+)>|@(\w+)/i,
    ],
    examples: [
      "timeout @user for 10 minutes",
      "mute @spammer for 1 hour",
      "time out @baduser for 2 hours",
    ],
    requiredPermissions: ["ModerateMembers"],
  },

  // Moderation - Purge
  {
    intent: "moderation.purge",
    patterns: [
      /(?:delete|purge|clear|remove)\s+(?:last\s+)?(\d+)\s+messages?/i,
      /clean\s+(?:up\s+)?(\d+)\s+messages?/i,
    ],
    examples: ["delete 10 messages", "purge last 50 messages", "clean up 20 messages"],
    requiredPermissions: ["ManageMessages"],
  },

  // Moderation - Slowmode
  {
    intent: "moderation.slowmode",
    patterns: [
      /(?:set|enable)\s+slow\s?mode\s+(?:to\s+)?(\d+)\s*(?:seconds?|secs?|s)?/i,
      /slow\s?mode\s+(\d+)/i,
    ],
    examples: ["set slowmode to 10 seconds", "enable slow mode 5s", "slowmode 30"],
    requiredPermissions: ["ManageChannels"],
  },

  // Moderation - Lock
  {
    intent: "moderation.lock",
    patterns: [
      /lock\s+(?:this\s+)?(?:channel|chat)/i,
      /(?:disable|prevent)\s+(?:messages?|chat(?:ting)?)\s+(?:in\s+)?(?:this\s+)?(?:channel)?/i,
    ],
    examples: ["lock this channel", "lock chat", "disable messages in this channel"],
    requiredPermissions: ["ManageChannels"],
  },

  // Moderation - Unlock
  {
    intent: "moderation.unlock",
    patterns: [
      /unlock\s+(?:this\s+)?(?:channel|chat)/i,
      /(?:enable|allow)\s+(?:messages?|chat(?:ting)?)\s+(?:in\s+)?(?:this\s+)?(?:channel)?/i,
    ],
    examples: ["unlock this channel", "unlock chat", "enable messages"],
    requiredPermissions: ["ManageChannels"],
  },

  // Music - Play
  {
    intent: "music.play",
    patterns: [
      /play\s+(.+)/i,
      /(?:start|begin)\s+playing\s+(.+)/i,
      /put\s+on\s+(.+)/i,
      /queue\s+(?:up\s+)?(.+)/i,
    ],
    examples: [
      "play some lofi music",
      "play never gonna give you up",
      "start playing jazz",
      "put on some chill beats",
    ],
  },

  // Music - Pause
  {
    intent: "music.pause",
    patterns: [
      /pause\s+(?:the\s+)?(?:music|song|track|playback)?/i,
      /hold\s+(?:the\s+)?(?:music|song)?/i,
    ],
    examples: ["pause", "pause the music", "pause playback"],
  },

  // Music - Skip
  {
    intent: "music.skip",
    patterns: [/skip\s+(?:this\s+)?(?:song|track)?/i, /next\s+(?:song|track)?/i, /play\s+next/i],
    examples: ["skip", "skip this song", "next track", "play next"],
  },

  // Music - Stop
  {
    intent: "music.stop",
    patterns: [/stop\s+(?:the\s+)?(?:music|playback|playing)?/i, /end\s+(?:the\s+)?(?:music)?/i],
    examples: ["stop", "stop the music", "stop playing"],
  },

  // Music - Queue
  {
    intent: "music.queue",
    patterns: [
      /(?:show|display|list|view)\s+(?:the\s+)?(?:music\s+)?queue/i,
      /what'?s\s+(?:in\s+)?(?:the\s+)?queue/i,
      /queue\s+list/i,
    ],
    examples: ["show queue", "what's in the queue", "display music queue"],
  },

  // Music - Now Playing
  {
    intent: "music.nowplaying",
    patterns: [
      /(?:what'?s|what\s+is)\s+(?:currently\s+)?playing/i,
      /(?:now\s+playing|current\s+(?:song|track))/i,
      /what\s+(?:song|track|music)\s+is\s+(?:this|playing)/i,
    ],
    examples: ["what's playing", "now playing", "what song is this"],
  },

  // Music - Volume
  {
    intent: "music.volume",
    patterns: [
      /(?:set|change)\s+(?:the\s+)?volume\s+(?:to\s+)?(\d+)/i,
      /volume\s+(\d+)/i,
      /make\s+it\s+(louder|quieter|softer)/i,
    ],
    examples: ["set volume to 50", "volume 75", "make it louder"],
  },

  // Server Info
  {
    intent: "server.info",
    patterns: [
      /(?:show|display|get)\s+server\s+(?:info|information|stats|statistics)/i,
      /(?:how\s+many|what'?s\s+the)\s+(?:member|user)\s+count/i,
      /server\s+details/i,
    ],
    examples: ["show server info", "server statistics", "what's the member count"],
  },

  // User Info
  {
    intent: "user.info",
    patterns: [
      /(?:show|display|get)\s+(?:info|information)\s+(?:about|for)\s+<@!?(\d+)>|@(\w+)/i,
      /(?:who\s+is|tell\s+me\s+about)\s+<@!?(\d+)>|@(\w+)/i,
      /user\s+(?:info|profile)\s+<@!?(\d+)>|@(\w+)/i,
    ],
    examples: ["show info about @user", "who is @someone", "user profile @member"],
  },

  // Utility - Poll
  {
    intent: "utility.poll",
    patterns: [/(?:create|make|start)\s+(?:a\s+)?poll/i, /poll\s+(?:about\s+)?(.+)/i],
    examples: ["create a poll", "make a poll about pizza toppings", "start poll"],
  },

  // Utility - Remind
  {
    intent: "utility.remind",
    patterns: [
      /remind\s+me\s+(?:to\s+)?(.+?)\s+(?:in|at)\s+(.+)/i,
      /(?:set|create)\s+(?:a\s+)?reminder/i,
    ],
    examples: [
      "remind me to take a break in 1 hour",
      "remind me to check messages at 5pm",
      "set a reminder",
    ],
  },

  // Config - Module Enable
  {
    intent: "config.module.enable",
    patterns: [
      /enable\s+(?:the\s+)?(\w+)\s+module/i,
      /turn\s+on\s+(?:the\s+)?(\w+)\s+(?:module|feature)/i,
    ],
    examples: ["enable the music module", "turn on moderation", "enable logging"],
    requiredPermissions: ["Administrator"],
  },

  // Config - Module Disable
  {
    intent: "config.module.disable",
    patterns: [
      /disable\s+(?:the\s+)?(\w+)\s+module/i,
      /turn\s+off\s+(?:the\s+)?(\w+)\s+(?:module|feature)/i,
    ],
    examples: ["disable the economy module", "turn off fun commands", "disable analytics"],
    requiredPermissions: ["Administrator"],
  },

  // Help
  {
    intent: "general.help",
    patterns: [
      /^help$/i,
      /what\s+can\s+you\s+do/i,
      /(?:show|list)\s+(?:all\s+)?(?:commands|features)/i,
    ],
    examples: ["help", "what can you do", "list commands"],
  },

  // Ping
  {
    intent: "general.ping",
    patterns: [/^ping$/i, /are\s+you\s+(?:alive|working|online)/i],
    examples: ["ping", "are you alive"],
  },
];

/**
 * Match a message to an intent
 */
export function matchIntent(message: string): {
  intent: Intent;
  confidence: number;
  matches: RegExpMatchArray | null;
} {
  const trimmed = message.trim();

  for (const pattern of intentPatterns) {
    for (const regex of pattern.patterns) {
      const matches = trimmed.match(regex);
      if (matches) {
        return {
          intent: pattern.intent,
          confidence: 0.9, // High confidence for regex matches
          matches,
        };
      }
    }
  }

  // No match found
  return {
    intent: "general.unknown",
    confidence: 0,
    matches: null,
  };
}
