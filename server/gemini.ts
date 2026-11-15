import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';
import {
  computeCooldownDurationMs,
  extractRetryDelayMs,
  GEMINI_FALLBACK_MODELS,
  isModelUnavailableError,
  isQuotaOrRateLimitError,
  isTransientGeminiError,
  ModelCooldownTracker,
  RequestPacer,
  sanitizeErrorMessage,
} from './geminiResilience.ts';

export const GEMINI_MODEL = GEMINI_FALLBACK_MODELS[0];

const cooldownTracker = new ModelCooldownTracker();
const requestPacer = new RequestPacer(350);
const inFlightRequests = new Map<string, Promise<unknown>>();

export class AiServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 500, code = 'AI_SERVICE_ERROR') {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new AiServiceError(
      'GEMINI_API_KEY is not configured on the server. Add a valid key in Settings > Secrets or load Sample data to preview the workflow.',
      503,
      'API_KEY_MISSING'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isThinkingConfigError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('thinking') && (msg.includes('400') || msg.includes('invalid_argument') || msg.includes('not supported'));
}

function mapGeminiError(err: unknown): AiServiceError {
  if (err instanceof AiServiceError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return new AiServiceError(
      'Gemini API rejected the configured key. Please verify GEMINI_API_KEY in Settings > Secrets.',
      403,
      'API_KEY_INVALID'
    );
  }
  if (isQuotaOrRateLimitError(err)) {
    return new AiServiceError(
      'Gemini API rate limit or quota reached. Please wait a moment and try again.',
      429,
      'RATE_LIMITED'
    );
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return new AiServiceError(
      `Requested Gemini model (${GEMINI_MODEL}) is unavailable.`,
      502,
      'MODEL_NOT_FOUND'
    );
  }

  return new AiServiceError(
    `AI generation failed: ${sanitizeErrorMessage(msg)}`,
    502,
    'UPSTREAM_AI_ERROR'
  );
}

async function runWithModelFallback<T>(
  executor: (model: string, omitThinking?: boolean) => Promise<T>,
  maxRetriesPerModel = 2
): Promise<T> {
  const orderedModels = cooldownTracker.getOrderedModels(GEMINI_FALLBACK_MODELS);
  let lastError: unknown;

  for (let mIdx = 0; mIdx < orderedModels.length; mIdx++) {
    const model = orderedModels[mIdx];
    const hasNextModel = mIdx < orderedModels.length - 1;
    let omitThinking = false;

    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        return await requestPacer.schedule(() => executor(model, omitThinking));
      } catch (err) {
        lastError = err;
        const rawMsg = err instanceof Error ? err.message : String(err);

        if (!omitThinking && isThinkingConfigError(err)) {
          omitThinking = true;
          continue;
        }

        if (isQuotaOrRateLimitError(err)) {
          const cooldownMs = computeCooldownDurationMs(err);
          cooldownTracker.markCooldown(model, cooldownMs);
          console.warn(`[IDEONIX Gemini] ${model} quota/rate-limited: ${sanitizeErrorMessage(rawMsg)}`);

          if (hasNextModel) {
            break;
          }
        } else if (isModelUnavailableError(err)) {
          cooldownTracker.markCooldown(model, 5 * 60_000);
          console.warn(`[IDEONIX Gemini] ${model} unavailable: ${sanitizeErrorMessage(rawMsg)}`);
          if (hasNextModel) {
            break;
          }
        }

        if (attempt < maxRetriesPerModel && isTransientGeminiError(err)) {
          const hintedDelay = extractRetryDelayMs(err);
          const jitter = Math.floor(Math.random() * 250);
          const backoffMs = (hintedDelay ?? 900 * Math.pow(2, attempt)) + jitter;
          await sleep(backoffMs);
          continue;
        }

        break;
      }
    }
  }

  throw mapGeminiError(lastError);
}

function coalesceInFlight<T>(key: string, work: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = work().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, promise);
  return promise;
}

export async function generateStructuredJson<T>(options: {
  systemInstruction: string;
  prompt: string;
  responseSchema: Schema;
  thinkingLevel?: ThinkingLevel;
  maxRetries?: number;
}): Promise<T> {
  const ai = getClient();
  const maxRetries = options.maxRetries ?? 2;
  const dedupeKey = `json:${options.thinkingLevel ?? ''}:${options.systemInstruction}\n---\n${options.prompt}`;

  return coalesceInFlight(dedupeKey, () =>
    runWithModelFallback(async (model, omitThinking) => {
      const response = await ai.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: options.responseSchema,
          ...(options.thinkingLevel && !omitThinking
            ? { thinkingConfig: { thinkingLevel: options.thinkingLevel } }
            : {}),
        },
      });

      const raw = (response.text ?? '').trim();
      if (!raw) {
        throw new AiServiceError('AI returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
      }

      return JSON.parse(raw) as T;
    }, maxRetries)
  );
}

export async function generateChatReply(options: {
  systemInstruction: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  message: string;
}): Promise<string> {
  const ai = getClient();
  const formattedHistory = options.history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Creator' : 'IDEONIX Assistant'}: ${m.text}`)
    .join('\n\n');

  const prompt = formattedHistory
    ? `Recent conversation:\n${formattedHistory}\n\nCreator: ${options.message}`
    : options.message;

  return runWithModelFallback(async (model, omitThinking) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: options.systemInstruction,
        ...(!omitThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new AiServiceError('Assistant returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
    }
    return text;
  }, 2);
}
