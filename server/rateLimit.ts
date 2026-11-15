export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  tokens: number;
  lastRefillMs: number;
}

export class TokenBucketRateLimiter {
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;

  constructor(maxRequestsPerWindow: number, windowMs: number) {
    this.maxTokens = maxRequestsPerWindow;
    this.refillRatePerMs = maxRequestsPerWindow / windowMs;
  }

  consume(key: string, nowMs: number = Date.now()): RateLimitResult {
    const existing = this.buckets.get(key);
    let tokens = this.maxTokens;
    let lastRefillMs = nowMs;

    if (existing) {
      const elapsed = Math.max(0, nowMs - existing.lastRefillMs);
      tokens = Math.min(this.maxTokens, existing.tokens + elapsed * this.refillRatePerMs);
    }

    if (tokens < 1) {
      const deficit = 1 - tokens;
      const retryAfterSeconds = Math.max(1, Math.ceil(deficit / this.refillRatePerMs / 1000));
      this.buckets.set(key, { tokens, lastRefillMs });
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    const remainingTokens = tokens - 1;
    this.buckets.set(key, { tokens: remainingTokens, lastRefillMs });
    return {
      allowed: true,
      remaining: Math.floor(remainingTokens),
      retryAfterSeconds: 0,
    };
  }
}
