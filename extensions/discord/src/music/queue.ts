import type { Track } from "shoukaku";

export interface QueuedTrack {
  track: Track;
  requestedBy: string;
  addedAt: number;
}

/**
 * Music queue for a guild
 */
export class MusicQueue {
  private tracks: QueuedTrack[] = [];
  public currentTrack: QueuedTrack | null = null;

  /**
   * Add track to queue
   */
  enqueue(track: QueuedTrack): void {
    this.tracks.push(track);
  }

  /**
   * Get next track from queue
   */
  dequeue(): QueuedTrack | null {
    return this.tracks.shift() ?? null;
  }

  /**
   * Get track at index without removing it
   */
  peek(index: number = 0): QueuedTrack | null {
    return this.tracks[index] ?? null;
  }

  /**
   * Remove track at index
   */
  remove(index: number): QueuedTrack | null {
    if (index < 0 || index >= this.tracks.length) {
      return null;
    }
    return this.tracks.splice(index, 1)[0] ?? null;
  }

  /**
   * Clear all tracks from queue
   */
  clear(): void {
    this.tracks = [];
  }

  /**
   * Shuffle queue
   */
  shuffle(): void {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.tracks[i];
      if (temp) {
        this.tracks[i] = this.tracks[j]!;
        this.tracks[j] = temp;
      }
    }
  }

  /**
   * Get all tracks in queue
   */
  getTracks(): QueuedTrack[] {
    return [...this.tracks];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.tracks.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  /**
   * Get total duration of all tracks in queue (milliseconds)
   */
  getTotalDuration(): number {
    return this.tracks.reduce((total, qt) => total + (qt.track.info.length ?? 0), 0);
  }
}
