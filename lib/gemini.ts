import { GoogleGenAI } from '@google/genai';

/**
 * Resolves a valid Gemini model name.
 * Uses gemini-3.8-flash as the primary recommended model for text tasks.
 */
export function resolveGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (
    envModel &&
    envModel.startsWith('gemini-') &&
    envModel.length < 35
  ) {
    return envModel;
  }
  return 'gemini-3.8-flash';
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
