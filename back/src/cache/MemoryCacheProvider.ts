import { CacheProvider } from './CacheProvider';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

const defaultTTL = 1000 * 60 * 60 * 24;

export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheItem<any>>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set<T>(key: string, value: T, ttlMs = defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
