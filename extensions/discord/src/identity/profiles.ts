/**
 * Per-user identity and profile management
 */

export interface UserProfile {
  userId: string;
  preferredName?: string;
  pronouns?: string;
  favoriteColor?: string;
  musicPreference?: "youtube" | "soundcloud" | "spotify";
  ttsLanguage?: string;
  onboarded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  autoJoinVoice: boolean;
  autoPlayMusic: boolean;
  defaultVolume: number;
  notifyOnMention: boolean;
  dmNotifications: boolean;
}

/**
 * User identity manager
 */
export class UserIdentityManager {
  private profiles = new Map<string, UserProfile>();
  private preferences = new Map<string, UserPreferences>();

  /**
   * Get or create user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        onboarded: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.profiles.set(userId, profile);
    }
    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = await this.getProfile(userId);
    const updated: UserProfile = {
      ...profile,
      ...updates,
      userId,
      updatedAt: Date.now(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Mark user as onboarded
   */
  async completeOnboarding(userId: string): Promise<UserProfile> {
    return this.updateProfile(userId, { onboarded: true });
  }

  /**
   * Check if user has been onboarded
   */
  async isOnboarded(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile.onboarded;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    let prefs = this.preferences.get(userId);
    if (!prefs) {
      prefs = {
        autoJoinVoice: false,
        autoPlayMusic: false,
        defaultVolume: 100,
        notifyOnMention: true,
        dmNotifications: true,
      };
      this.preferences.set(userId, prefs);
    }
    return prefs;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    const prefs = await this.getPreferences(userId);
    const updated: UserPreferences = {
      ...prefs,
      ...updates,
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  /**
   * Get preferred name or fallback to username
   */
  async getDisplayName(userId: string, username: string): Promise<string> {
    const profile = await this.getProfile(userId);
    return profile.preferredName ?? username;
  }

  /**
   * Generate personalized greeting
   */
  async getPersonalizedGreeting(userId: string, username: string): Promise<string> {
    const profile = await this.getProfile(userId);
    const name = profile.preferredName ?? username;

    const greetings = [
      `Hey ${name}! 💅✨`,
      `Omg hi ${name}, bestie! ⚡✨`,
      `Yasss, ${name} is here! 💃✨`,
      `What's good, ${name}? ✨💅`,
      `Hey there ${name}, hunty! ⚡💅`,
    ];

    return greetings[Math.floor(Math.random() * greetings.length)] ?? `Hey ${name}!`;
  }

  /**
   * Get all profiles (for persistence)
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get all preferences (for persistence)
   */
  getAllPreferences(): Map<string, UserPreferences> {
    return new Map(this.preferences);
  }

  /**
   * Load profiles from storage
   */
  loadProfiles(profiles: UserProfile[]): void {
    for (const profile of profiles) {
      this.profiles.set(profile.userId, profile);
    }
  }

  /**
   * Load preferences from storage
   */
  loadPreferences(preferences: Map<string, UserPreferences>): void {
    this.preferences = new Map(preferences);
  }
}
