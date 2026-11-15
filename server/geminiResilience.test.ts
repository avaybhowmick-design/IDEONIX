import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCooldownDurationMs,
  extractRetryDelayMs,
  GEMINI_FALLBACK_MODELS,
  isQuotaOrRateLimitError,
  isTransientGeminiError,
  ModelCooldownTracker,
  RequestPacer,
  sanitizeErrorMessage,
} from './geminiResilience';

test('extractRetryDelayMs parses retry delay hints cleanly', () => {
  assert.equal(extractRetryDelayMs(new Error('Please retry in 4s.')), 4250);
  assert.equal(extractRetryDelayMs(new Error('"retryDelay":"1.5s"')), 1750);
  assert.equal(extractRetryDelayMs(new Error('retryDelay: 45s')), 15000);
  assert.equal(extractRetryDelayMs(new Error('Unknown error')), null);
});

test('isQuotaOrRateLimitError and isTransientGeminiError classify 429 and transient errors', () => {
  assert.equal(isQuotaOrRateLimitError(new Error('429 RESOURCE_EXHAUSTED')), true);
  assert.equal(isQuotaOrRateLimitError(new Error('Quota exceeded for metric')), true);
  assert.equal(isQuotaOrRateLimitError(new Error('403 PERMISSION_DENIED')), false);
  assert.equal(isTransientGeminiError(new Error('503 Service Unavailable')), true);
});

test('computeCooldownDurationMs extends cooldown for daily/zero limits', () => {
  assert.equal(computeCooldownDurationMs(new Error('429 RESOURCE_EXHAUSTED')), 60_000);
  assert.equal(computeCooldownDurationMs(new Error('Quota exceeded, limit: 0')), 600_000);
});

test('ModelCooldownTracker prioritizes healthy models and restores cooled models after expiry', () => {
  const tracker = new ModelCooldownTracker();
  const t0 = 1_000_000;

  assert.deepEqual(tracker.getOrderedModels(GEMINI_FALLBACK_MODELS, t0), [
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
  ]);

  tracker.markCooldown('gemini-4-hydrogen', 60_000, t0);
  assert.equal(tracker.isInCooldown('gemini-4-hydrogen', t0 + 1000), true);
  assert.deepEqual(tracker.getOrderedModels(GEMINI_FALLBACK_MODELS, t0 + 1000), [
    'gemini-3.1-flash-lite',
    'gemini-4-hydrogen',
  ]);

  assert.equal(tracker.isInCooldown('gemini-4-hydrogen', t0 + 60_001), false);
  assert.deepEqual(tracker.getOrderedModels(GEMINI_FALLBACK_MODELS, t0 + 60_001), [
    'gemini-4-hydrogen',
    'gemini-3.1-flash-lite',
  ]);
});

test('sanitizeErrorMessage strips API keys', () => {
  const cleaned = sanitizeErrorMessage('Failed with key AIzaSy1234567890abcdefghijkLMNOPQRST');
  assert.ok(!cleaned.includes('AIzaSy'));
  assert.ok(cleaned.includes('[REDACTED]'));
});

test('RequestPacer runs queued operations cleanly without dropping errors', async () => {
  const pacer = new RequestPacer(10);
  const results = await Promise.all([
    pacer.schedule(async () => 1),
    pacer.schedule(async () => 2),
    pacer.schedule(async () => 3),
  ]);
  assert.deepEqual(results, [1, 2, 3]);
});
