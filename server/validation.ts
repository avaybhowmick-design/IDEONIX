export function requireNonEmptyString(
  val: unknown,
  field: string,
  maxLength = 4000
): string {
  if (typeof val !== 'string' || !val.trim()) {
    throw new ValidationError(`${field} is required.`);
  }
  const trimmed = val.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

export function optionalString(val: unknown, fallback = '', maxLength = 4000): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLength);
}

export function boundedInt(val: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof val === 'number' ? Math.round(val) : Number.parseInt(String(val ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
