export type ErrorCategory =
  | 'API_KEY_MISSING'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'CONTENT_BLOCKED'
  | 'BAD_REQUEST'
  | 'UNKNOWN';

/**
 * Custom error for categorizing Gemini API service failures.
 */
export class GeminiServiceError extends Error {
  public readonly category: ErrorCategory;

  constructor(message: string, category: ErrorCategory = 'UNKNOWN') {
    super(message);
    this.name = 'GeminiServiceError';
    this.category = category;
  }
}