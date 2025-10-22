export class CacheWithTTL<T> {
  private cache = new Map<string, { data: T; updatedAt: number }>();

  constructor(private readonly ttl: number) {} // ttl 单位为毫秒

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.updatedAt > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { data: value, updatedAt: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
