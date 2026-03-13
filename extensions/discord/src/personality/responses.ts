import type { Intent } from "../nlp/intents.js";

/**
 * Chaos gremlin personality response templates
 * Fruity, gay, playful, chaotic energy with JARVIS-level technical competence
 */

export interface PersonalityResponse {
  success: string[];
  error: string[];
  info: string[];
}

/**
 * Personality responses organized by intent category
 */
export const personalityResponses: Record<string, PersonalityResponse> = {
  // Music responses
  "music.play": {
    success: [
      "Omg yasss! Playing that bop for you, bestie! 💅✨",
      "Serving you the vibes! Let's gooo! 🎵✨",
      "This song is everything! Playing it now, hunty! 🦞💅",
      "Oop- your taste is immaculate! Here we go! ✨🎶",
      "Slay! Let me put that on for you! 💃✨",
    ],
    error: [
      "Bestie, I couldn't find that track! Try again? 😢",
      "Oop- that search came up empty, hunty! 🤷",
      "Sorry babe, no results for that one! 💔",
    ],
    info: [],
  },

  "music.pause": {
    success: [
      "Paused the vibes for ya! ⏸️✨",
      "Taking a lil break from the music! 💅",
      "Oop- paused! Need a moment? ⏸️",
    ],
    error: ["Nothing's playing right now, bestie! 🎵", "Can't pause what's not playing, hunty! 💅"],
    info: [],
  },

  "music.skip": {
    success: [
      "Skipped to the next bop! ⏭️✨",
      "Oop- next track coming up! 🎶",
      "Yeet! Moving to the next one! ⏭️💅",
    ],
    error: ["Nothing to skip, bestie! 🤷", "Queue's empty, hunty! Add more tracks! ✨"],
    info: [],
  },

  // Moderation responses
  "moderation.warn": {
    success: [
      "Warning issued, bestie! They better behave now! ⚠️✨",
      "Oop- gave them a warning! Watch yourself, hunty! 💅",
      "Warning delivered with chaos gremlin energy! ⚠️🦞",
    ],
    error: [
      "Bestie, I don't have permission to warn them! 😢",
      "Can't warn that user, hunty! Check permissions! 💅",
    ],
    info: [],
  },

  "moderation.kick": {
    success: [
      "Oop- YEET! User has been kicked! 👢✨",
      "Bye Felicia! Kicked them out! 💅",
      "And they're gone! Kicked successfully! 🦞✨",
    ],
    error: [
      "Can't kick them, bestie! Permission denied! 😢",
      "Oop- role hierarchy says no, hunty! 💅",
    ],
    info: [],
  },

  "moderation.ban": {
    success: [
      "BANNED! They're outta here permanently, bestie! 🔨✨",
      "Oop- the ban hammer has spoken! Gone forever! 💅",
      "And they're GONE! Permanently banned! 🦞✨",
    ],
    error: ["Can't ban them, bestie! Check permissions! 😢", "Oop- insufficient power, hunty! 💅"],
    info: [],
  },

  "moderation.timeout": {
    success: [
      "Timeout corner activated! They'll think about what they did! ⏱️✨",
      "Oop- sent them to timeout! Touch grass, bestie! 💅",
      "Muted for a bit! Time to reflect! 🦞✨",
    ],
    error: [
      "Can't timeout them, bestie! Permission issues! 😢",
      "Oop- can't mute that user, hunty! 💅",
    ],
    info: [],
  },

  "moderation.lock": {
    success: [
      "Channel locked down! Nobody's talking now! 🔒✨",
      "Oop- locked! This channel is on pause! 💅",
      "And... LOCKED! Silence activated! 🦞✨",
    ],
    error: [
      "Can't lock that channel, bestie! Permission denied! 😢",
      "Oop- insufficient perms, hunty! 💅",
    ],
    info: [],
  },

  // Server info responses
  "server.info": {
    success: [
      "Serving you the server stats, hunty! 📊✨",
      "Here's the tea on this server, bestie! ☕💅",
      "All the deets about this server coming right up! 🦞✨",
    ],
    error: [],
    info: [],
  },

  "user.info": {
    success: [
      "Here's the scoop on that user, bestie! 👤✨",
      "Got all their info right here, hunty! 💅",
      "User profile served! ✨🦞",
    ],
    error: ["Couldn't find that user, bestie! 😢", "Oop- user not found, hunty! 💅"],
    info: [],
  },

  // Utility responses
  "utility.poll": {
    success: [
      "Poll created! Let's see what the people want! 📊✨",
      "Oop- poll is live! Democracy time, bestie! 💅",
      "Poll activated! Vote away, hunties! 🦞✨",
    ],
    error: [
      "Couldn't create that poll, bestie! Try again? 😢",
      "Oop- poll creation failed, hunty! 💅",
    ],
    info: [],
  },

  // Help/general responses
  "general.help": {
    success: [
      "Omg hi bestie! I can do SO much! Let me tell you everything! ✨💅",
      "Hey hunty! I'm your chaos gremlin assistant! Here's what I can do! 🦞✨",
      "Yasss! Ready to help! I've got music, moderation, and SO much more! 💅✨",
    ],
    error: [],
    info: [],
  },

  "general.ping": {
    success: [
      "Pong! I'm here and ready to cause chaos, bestie! 🏓✨",
      "Alive and thriving, hunty! 💅✨",
      "Pong! Your favorite chaos gremlin reporting for duty! 🦞✨",
    ],
    error: [],
    info: [],
  },

  // Default/unknown
  default: {
    success: ["Done, bestie! ✨", "All set, hunty! 💅", "Completed! 🦞✨"],
    error: [
      "Oop- something went wrong, bestie! 😢",
      "That didn't work, hunty! Try again? 💅",
      "Error detected! Let's try that again! 🦞",
    ],
    info: ["Just so you know, bestie! ℹ️✨", "FYI, hunty! 💅", "Quick note! 🦞✨"],
  },
};

/**
 * Get a random response for an intent and type
 */
export function getPersonalityResponse(
  intent: Intent | string,
  type: "success" | "error" | "info" = "success",
): string {
  const intentResponses = personalityResponses[intent] ?? personalityResponses.default;
  const responses = intentResponses?.[type] ?? personalityResponses.default[type];

  if (!responses || responses.length === 0) {
    return personalityResponses.default[type][0] ?? "";
  }

  return responses[Math.floor(Math.random() * responses.length)] ?? responses[0] ?? "";
}

/**
 * Add personality flair to a plain message
 */
export function addPersonalityFlair(message: string): string {
  const emojis = ["✨", "💅", "🦞", "💃", "🎵", "⚡", "🌟", "💖"];
  const endings = [" bestie!", " hunty!", "!", "✨", " 💅"];

  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  const randomEnding = endings[Math.floor(Math.random() * endings.length)];

  return `${message}${randomEnding} ${randomEmoji}`;
}

/**
 * Transform technical error messages into personality-flavored ones
 */
export function transformErrorMessage(error: string): string {
  const errorMappings: Record<string, string> = {
    "permission denied": "Oop- I don't have permission for that, bestie! 😢",
    "not found": "Couldn't find that, hunty! 💅",
    invalid: "That doesn't look right, bestie! Try again? ✨",
    timeout: "Took too long, hunty! Let's try that again! ⏱️",
    failed: "Oop- that didn't work, bestie! 😢",
  };

  const lowerError = error.toLowerCase();
  for (const [key, value] of Object.entries(errorMappings)) {
    if (lowerError.includes(key)) {
      return value;
    }
  }

  return `Oop- something went wrong: ${error} 😢`;
}

/**
 * Greeting messages for voice channel joins
 */
export const greetingMessages = [
  "Hey bestie! 💅✨",
  "Omg hi hunty! 🦞✨",
  "Yasss, you're here! 💃✨",
  "Hey there! ✨💅",
  "What's good, bestie? 🦞💅",
];

/**
 * Get a random greeting message
 */
export function getGreeting(): string {
  return (
    greetingMessages[Math.floor(Math.random() * greetingMessages.length)] ??
    greetingMessages[0] ??
    "Hi!"
  );
}
