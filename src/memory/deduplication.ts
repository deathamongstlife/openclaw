/**
 * Memory deduplication for preventing duplicate entries
 * Fixes #43234: Memory insertion duplicates entries
 */

import crypto from "node:crypto";

export type ContentHash = string;

export type DedupEntry = {
  /** Content hash */
  hash: ContentHash;
  /** Original content */
  content: string;
  /** Timestamp when first inserted */
  insertedAtMs: number;
  /** Path where content was inserted */
  path?: string;
};

export type DedupOptions = {
  /** Maximum age in ms before hash expires */
  maxAgeMs?: number;
  /** Maximum number of hashes to track */
  maxEntries?: number;
};

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_MAX_ENTRIES = 10000;

/**
 * Memory deduplication manager
 */
export class MemoryDeduplicator {
  private readonly hashes = new Map<ContentHash, DedupEntry>();
  private readonly options: Required<DedupOptions>;

  constructor(options: DedupOptions = {}) {
    this.options = {
      maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_AGE_MS,
      maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES,
    };
  }

  /**
   * Hash content using SHA-256
   */
  hashContent(content: string): ContentHash {
    return crypto.createHash("sha256").update(content.trim()).digest("hex");
  }

  /**
   * Check if content is duplicate
   */
  isDuplicate(content: string): boolean {
    const hash = this.hashContent(content);
    const entry = this.hashes.get(hash);

    if (!entry) {
      return false;
    }

    // Check if hash is expired
    const age = Date.now() - entry.insertedAtMs;
    if (age > this.options.maxAgeMs) {
      this.hashes.delete(hash);
      return false;
    }

    return true;
  }

  /**
   * Check if content is duplicate and return existing entry
   */
  findDuplicate(content: string): DedupEntry | null {
    const hash = this.hashContent(content);
    const entry = this.hashes.get(hash);

    if (!entry) {
      return null;
    }

    // Check if hash is expired
    const age = Date.now() - entry.insertedAtMs;
    if (age > this.options.maxAgeMs) {
      this.hashes.delete(hash);
      return null;
    }

    return entry;
  }

  /**
   * Record content insertion
   */
  recordInsertion(content: string, path?: string): ContentHash {
    const hash = this.hashContent(content);

    // Update existing entry
    const existing = this.hashes.get(hash);
    if (existing) {
      if (path) {
        existing.path = path;
      }
      return hash;
    }

    // Add new entry
    this.hashes.set(hash, {
      hash,
      content: content.slice(0, 1000), // Store truncated content for debugging
      insertedAtMs: Date.now(),
      path,
    });

    // Enforce size limit
    this.enforceSizeLimit();

    return hash;
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [hash, entry] of this.hashes.entries()) {
      const age = now - entry.insertedAtMs;
      if (age > this.options.maxAgeMs) {
        this.hashes.delete(hash);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get deduplication stats
   */
  stats(): {
    totalHashes: number;
    oldestEntryAgeMs: number;
    newestEntryAgeMs: number;
    averageAgeMs: number;
  } {
    if (this.hashes.size === 0) {
      return {
        totalHashes: 0,
        oldestEntryAgeMs: 0,
        newestEntryAgeMs: 0,
        averageAgeMs: 0,
      };
    }

    const now = Date.now();
    const ages = Array.from(this.hashes.values()).map((entry) => now - entry.insertedAtMs);

    return {
      totalHashes: this.hashes.size,
      oldestEntryAgeMs: Math.max(...ages),
      newestEntryAgeMs: Math.min(...ages),
      averageAgeMs: ages.reduce((sum, age) => sum + age, 0) / ages.length,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.hashes.clear();
  }

  /**
   * Enforce maximum entries limit (FIFO)
   */
  private enforceSizeLimit(): void {
    if (this.hashes.size <= this.options.maxEntries) {
      return;
    }

    // Remove oldest entries
    const entries = Array.from(this.hashes.entries()).sort(
      (a, b) => a[1].insertedAtMs - b[1].insertedAtMs,
    );

    const toRemove = this.hashes.size - this.options.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      this.hashes.delete(entries[i][0]);
    }
  }
}

/**
 * Batch deduplication for multiple contents
 */
export function deduplicateContents(
  contents: string[],
  deduplicator?: MemoryDeduplicator,
): string[] {
  const dedup = deduplicator ?? new MemoryDeduplicator();
  const unique: string[] = [];

  for (const content of contents) {
    if (!dedup.isDuplicate(content)) {
      unique.push(content);
      dedup.recordInsertion(content);
    }
  }

  return unique;
}

/**
 * Similarity-based deduplication (for near-duplicates)
 */
export class SimilarityDeduplicator extends MemoryDeduplicator {
  private readonly similarityThreshold: number;

  constructor(options: DedupOptions & { similarityThreshold?: number } = {}) {
    super(options);
    this.similarityThreshold = options.similarityThreshold ?? 0.9;
  }

  /**
   * Check if content is similar to existing content
   */
  isSimilar(content: string): boolean {
    // First check exact match
    if (this.isDuplicate(content)) {
      return true;
    }

    // Check similarity with existing entries
    const normalized = this.normalizeContent(content);

    for (const entry of this.hashes.values()) {
      const entryNormalized = this.normalizeContent(entry.content);
      const similarity = this.computeSimilarity(normalized, entryNormalized);

      if (similarity >= this.similarityThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalize content for similarity comparison
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Compute Jaccard similarity between two strings
   */
  private computeSimilarity(a: string, b: string): number {
    const tokensA = new Set(a.split(/\s+/));
    const tokensB = new Set(b.split(/\s+/));

    const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }
}

/**
 * Global deduplicator instance
 */
let globalDeduplicator: MemoryDeduplicator | null = null;

/**
 * Get or create global deduplicator
 */
export function getGlobalDeduplicator(options?: DedupOptions): MemoryDeduplicator {
  if (!globalDeduplicator) {
    globalDeduplicator = new MemoryDeduplicator(options);
  }
  return globalDeduplicator;
}

/**
 * Check if content is duplicate using global deduplicator
 */
export function isGlobalDuplicate(content: string): boolean {
  const dedup = getGlobalDeduplicator();
  return dedup.isDuplicate(content);
}

/**
 * Record insertion using global deduplicator
 */
export function recordGlobalInsertion(content: string, path?: string): ContentHash {
  const dedup = getGlobalDeduplicator();
  return dedup.recordInsertion(content, path);
}
