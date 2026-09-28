/**
 * AI clients:
 *  - Embeddings: @xenova/transformers (all-MiniLM-L6-v2, ONNX, runs in-process)
 *    → No API key needed, works offline and on Vercel
 *  - Chat / Generation: Groq SDK (llama-3.1-8b-instant, free tier)
 *    → Requires GROQ_API_KEY in .env.local
 *
 * WHY TWO DIFFERENT PROVIDERS?
 *   Groq dropped their embeddings endpoint in 2025.
 *   Xenova/transformers fills that gap — it's the same model (MiniLM) used
 *   by many production RAG systems, running via ONNX Runtime in Node.
 */

import Groq from "groq-sdk";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

// ─── Groq (chat) ─────────────────────────────────────────────────────────────

let _groq: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local or Vercel environment variables."
      );
    }
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

export const CHAT_MODEL = "qwen/qwen3.8-27b";

// ─── Xenova embeddings (local ONNX) ──────────────────────────────────────────

// Singleton pipeline — loads the ~23MB ONNX model once, reuses it
let _embedder: FeatureExtractionPipeline | null = null;

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!_embedder) {
    // Dynamic import avoids Next.js SSG issues with native modules
    const { pipeline } = await import("@xenova/transformers");
    _embedder = (await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    )) as FeatureExtractionPipeline;
  }
  return _embedder;
}

/**
 * Generate a 384-dim embedding vector for a text string.
 * Uses all-MiniLM-L6-v2 via ONNX Runtime — no API call, no key needed.
 */
export async function embed(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  // output.data is a Float32Array — convert to plain number[]
  return Array.from(output.data as Float32Array);
}
