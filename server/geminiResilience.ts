export const GEMINI_FALLBACK_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

export function sanitizeErrorMessage(raw: string): string {
  return raw.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED]').slice(0, 320);
}

export function extractRetryDelayMs(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/retry(?:Delay| in)"?\s*[:=]?\s*"?(\d+(?:\.\d+)?)s"?/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.min(Math.ceil(seconds * 1000) + 250, 15_000);
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota')
  );
}

export function isModelUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('404') || msg.includes('not_found') || msg.includes('not supported');
}

export function isTransientGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    isQuotaOrRateLimitError(err)
  );
}

export function computeCooldownDurationMs(err: unknown): number {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (msg.includes('limit: 0') || msg.includes('perday') || msg.includes('daily')) {
    return 10 * 60_000;
  }
  const hinted = extractRetryDelayMs(err);
  return Math.max(hinted ?? 0, 60_000);
}

export class ModelCooldownTracker {
  private readonly cooldowns = new Map<string, number>();

  markCooldown(model: string, durationMs: number, nowMs: number = Date.now()): void {
    const until = nowMs + Math.max(0, durationMs);
    const prev = this.cooldowns.get(model) ?? 0;
    if (until > prev) {
      this.cooldowns.set(model, until);
    }
  }

  isInCooldown(model: string, nowMs: number = Date.now()): boolean {
    const until = this.cooldowns.get(model);
    if (!until) return false;
    if (nowMs >= until) {
      this.cooldowns.delete(model);
      return false;
    }
    return true;
  }

  getOrderedModels(models: readonly string[], nowMs: number = Date.now()): string[] {
    const ready: string[] = [];
    const cooling: Array<{ model: string; until: number }> = [];

    for (const model of models) {
      if (!this.isInCooldown(model, nowMs)) {
        ready.push(model);
      } else {
        cooling.push({ model, until: this.cooldowns.get(model) ?? nowMs });
      }
    }

    cooling.sort((a, b) => a.until - b.until);
    return [...ready, ...cooling.map((c) => c.model)];
  }
}

export class RequestPacer {
  private readonly minIntervalMs: number;
  private nextAvailableAtMs = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(minIntervalMs = 300) {
    this.minIntervalMs = Math.max(0, minIntervalMs);
  }

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, this.nextAvailableAtMs - now);
      this.nextAvailableAtMs = Math.max(now, this.nextAvailableAtMs) + this.minIntervalMs;
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      return fn();
    });

    this.queue = run.then(
      () => undefined,
      () => undefined
    );

    return run;
  }
}
