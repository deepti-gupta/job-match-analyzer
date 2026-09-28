/**
 * VECTOR STORE — Pure in-process, module-singleton
 *
 * On Vercel, each serverless function invocation may share a warm instance
 * within the same deployment. Vectors persist across requests in a warm
 * container but reset on cold starts (fine for demo — just re-ingest).
 *
 * Cosine similarity: similarity(A,B) = (A·B) / (|A|×|B|)
 */

export interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, string>;
}

export interface QueryResult {
  entry: VectorEntry;
  score: number; // 0–1
}

// Module-level singleton — shared across requests in a warm Vercel instance
const store: VectorEntry[] = [];

export function upsert(entry: VectorEntry): void {
  const idx = store.findIndex((e) => e.id === entry.id);
  idx >= 0 ? (store[idx] = entry) : store.push(entry);
}

export function clearStore(): void {
  store.length = 0;
}

export function storeSize(): number {
  return store.length;
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const mag = magnitude(a) * magnitude(b);
  return mag === 0 ? 0 : dotProduct(a, b) / mag;
}

export function query(queryEmbedding: number[], topK: number): QueryResult[] {
  return store
    .map((entry) => ({ entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
