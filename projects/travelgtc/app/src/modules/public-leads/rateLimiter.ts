import { RateLimitedError } from './errors.js';

interface RateBucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly windowMs: number, private readonly max: number) {}

  check(key: string, now = Date.now()): void {
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    existing.count += 1;
    if (existing.count > this.max) {
      throw new RateLimitedError();
    }
  }
}
