import { GoogleGenAI } from '@google/genai';

/**
 * Resolves a valid Gemini model name.
 * Prevents invalid tokens or misconfigured environment variables (like API keys mistakenly placed in GEMINI_MODEL)
 * from breaking Gemini calls with INVALID_ARGUMENT error: "unexpected model name format".
 */
export function resolveGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (
    envModel &&
    envModel.startsWith('gemini-') &&
    !envModel.includes('.') &&
    !envModel.includes('_') &&
    envModel.length < 35
  ) {
    return envModel;
  }
  return 'gemini-3.5-flash';
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}
