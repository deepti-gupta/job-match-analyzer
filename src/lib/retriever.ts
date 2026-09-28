/**
 * RETRIEVER — Phase 2 of RAG
 * Embeds the JD and finds the most similar resume chunks.
 */

import { embed } from "./groqClient";
import { query } from "./vectorStore";

export interface RetrievedChunk {
  text: string;
  section: string;
  similarityScore: number;
}

export async function retrieveRelevantChunks(
  jobDescription: string,
  topK = 4
): Promise<RetrievedChunk[]> {
  const jdEmbedding = await embed(jobDescription);
  const results = query(jdEmbedding, topK);

  return results.map((r) => ({
    text: r.entry.text,
    section: r.entry.metadata["section"] ?? "unknown",
    similarityScore: r.score,
  }));
}
