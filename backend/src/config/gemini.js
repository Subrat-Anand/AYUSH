// ============================================================================
//  GEMINI CONFIG — the ONE file the whole backend depends on for AI calls.
//
//  You never need to touch any route file to plug in your real API key.
//  Just set GEMINI_API_KEY (and optionally GEMINI_MODEL) in backend/.env —
//  everything below picks it up automatically.
//
//  Uses the current @google/genai SDK (the old @google/generative-ai
//  package is deprecated and does not accept the newer "AQ."-prefixed API
//  keys that Google AI Studio now issues by default).
// ============================================================================
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// "gemini-flash-latest" is a Google-maintained alias that always points at
// their current fast model, so this keeps working as Google rotates models
// (gemini-1.5-flash, for example, was shut down and would 404 forever).
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// True once a real key has been pasted into .env. Until then, every route
// below automatically serves a local "demo" response so the UI keeps working.
export const isGeminiConfigured =
  Boolean(GEMINI_API_KEY) && GEMINI_API_KEY !== "paste-your-gemini-api-key-here";

let client = null;

/** Lazily creates (once) and returns the Gemini client instance. */
function getClient() {
  if (!isGeminiConfigured) return null;
  if (!client) client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return client;
}

/**
 * Sends a prompt to Gemini and returns the raw text reply.
 * Throws if Gemini isn't configured — callers should check
 * isGeminiConfigured first and fall back to a demo reply instead.
 */
export async function askGemini(prompt) {
  const ai = getClient();
  if (!ai) throw new Error("GEMINI_API_KEY is not set yet.");
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (err) {
    // Surface the real Gemini error (model name, quota, auth, etc.) instead
    // of a generic failure — this is what gets logged and shown as
    // `demoReason` in the UI when a route falls back to demo data.
    const detail = err?.message || String(err);
    throw new Error(`Gemini call failed (model: ${GEMINI_MODEL}): ${detail}`);
  }
}
