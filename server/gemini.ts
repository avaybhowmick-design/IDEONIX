import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

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

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted')
  );
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
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
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
    `AI generation failed: ${msg}`,
    502,
    'UPSTREAM_AI_ERROR'
  );
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
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: options.responseSchema,
          ...(options.thinkingLevel ? { thinkingConfig: { thinkingLevel: options.thinkingLevel } } : {}),
        },
      });

      const raw = (response.text ?? '').trim();
      if (!raw) {
        throw new AiServiceError('AI returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
      }

      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isTransientError(err)) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      throw mapGeminiError(err);
    }
  }

  throw mapGeminiError(lastError);
}

export async function generateChatReply(options: {
  systemInstruction: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  message: string;
}): Promise<string> {
  const ai = getClient();
  try {
    const formattedHistory = options.history
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Creator' : 'IDEONIX Assistant'}: ${m.text}`)
      .join('\n\n');

    const prompt = formattedHistory
      ? `Recent conversation:\n${formattedHistory}\n\nCreator: ${options.message}`
      : options.message;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: options.systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new AiServiceError('Assistant returned an empty response.', 502, 'EMPTY_AI_RESPONSE');
    }
    return text;
  } catch (err) {
    throw mapGeminiError(err);
  }
}
