/**
 * backend/services/metadataCache.js
 * In-memory cache for inspected media metadata to eliminate redundant yt-dlp extractions.
 */

class MetadataCache {
  constructor(ttlMs = 15 * 60 * 1000) { // 15 minutes TTL
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  set(url, data) {
    if (!url || !data) return;
    this.cache.set(url.trim(), {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(url) {
    if (!url) return null;
    const key = url.trim();
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(url) {
    return this.get(url) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

export const metadataCache = new MetadataCache();

