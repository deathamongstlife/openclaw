import type { Client } from "discord.js";
import { Shoukaku, Connectors, type NodeOption } from "shoukaku";

/**
 * Lavalink music manager using Shoukaku
 */
export class MusicManager {
  private shoukaku: Shoukaku | null = null;
  private nodes: NodeOption[] = [];

  constructor(private client: Client) {}

  /**
   * Initialize Shoukaku with Lavalink nodes
   */
  async initialize(nodes?: NodeOption[]): Promise<void> {
    this.nodes = nodes ?? this.getDefaultNodes();

    if (this.nodes.length === 0) {
      console.warn("No Lavalink nodes configured, music features will be disabled");
      return;
    }

    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), this.nodes, {
      moveOnDisconnect: false,
      resume: true,
      resumeTimeout: 30,
      reconnectTries: 3,
      reconnectInterval: 5,
      restTimeout: 10000,
    });

    this.setupEventHandlers();
  }

  /**
   * Get default Lavalink nodes from environment
   */
  private getDefaultNodes(): NodeOption[] {
    const lavalinkUrl = process.env.LAVALINK_URL || "localhost:2333";
    const lavalinkAuth = process.env.LAVALINK_AUTH || "youshallnotpass";

    return [
      {
        name: "main-node",
        url: lavalinkUrl,
        auth: lavalinkAuth,
      },
    ];
  }

  /**
   * Setup Shoukaku event handlers
   */
  private setupEventHandlers(): void {
    if (!this.shoukaku) return;

    this.shoukaku.on("ready", (name) => {
      console.log(`✨ Lavalink node "${name}" is ready!`);
    });

    this.shoukaku.on("error", (name, error) => {
      console.error(`Lavalink node "${name}" error:`, error);
    });

    this.shoukaku.on("close", (name, code, reason) => {
      console.warn(`Lavalink node "${name}" closed: ${code} - ${reason}`);
    });

    this.shoukaku.on("disconnect", (name, count) => {
      console.warn(`Lavalink node "${name}" disconnected. Reconnect attempts: ${count}`);
    });

    this.shoukaku.on("reconnecting", (name, reconnectsLeft, reconnectInterval) => {
      console.log(
        `Lavalink node "${name}" reconnecting... (${reconnectsLeft} attempts left, interval: ${reconnectInterval}ms)`,
      );
    });
  }

  /**
   * Get a Lavalink node for playback
   */
  getNode(guildId?: string) {
    if (!this.shoukaku) {
      throw new Error("Music manager not initialized");
    }

    return guildId
      ? this.shoukaku.getNode(guildId)
      : this.shoukaku.options.nodeResolver(this.shoukaku.nodes);
  }

  /**
   * Search for tracks
   */
  async search(query: string, source: "youtube" | "soundcloud" | "spotify" = "youtube") {
    const node = this.getNode();
    if (!node) {
      throw new Error("No Lavalink nodes available");
    }

    let searchQuery = query;

    if (!query.startsWith("http")) {
      switch (source) {
        case "youtube":
          searchQuery = `ytsearch:${query}`;
          break;
        case "soundcloud":
          searchQuery = `scsearch:${query}`;
          break;
        case "spotify":
          searchQuery = `spsearch:${query}`;
          break;
      }
    }

    const result = await node.rest.resolve(searchQuery);

    if (!result || result.loadType === "error") {
      throw new Error("Failed to load tracks");
    }

    if (result.loadType === "empty") {
      return null;
    }

    return result;
  }

  /**
   * Check if music system is available
   */
  isAvailable(): boolean {
    return this.shoukaku !== null && this.shoukaku.nodes.size > 0;
  }

  /**
   * Get Shoukaku instance
   */
  getShoukaku(): Shoukaku | null {
    return this.shoukaku;
  }

  /**
   * Cleanup on shutdown
   */
  async destroy(): Promise<void> {
    if (this.shoukaku) {
      for (const [, node] of this.shoukaku.nodes) {
        await node.disconnect();
      }
    }
  }
}
