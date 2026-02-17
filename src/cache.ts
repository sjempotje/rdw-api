/**
 * Small in-memory TTL cache used by the RDW client.
 */
export class InMemoryCache<T = unknown> {
  private store = new Map<string, { value: T; expires: number }>()

  constructor(private defaultTtlMs = 5 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expires) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number) {
    const expires = Date.now() + (ttlMs ?? this.defaultTtlMs)
    this.store.set(key, { value, expires })
  }

  delete(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}
