/**
 * INGEST — Phase 1 of RAG
 *
 * Two modes:
 *   ingestResume()          — default: chunks Deepti's profile.json
 *   ingestFromText(text)    — upload: chunks any plain-text resume
 *
 * Chunking strategy for free-text resumes:
 *   Split on double-newlines (paragraph breaks), filter out very short
 *   chunks, then embed each chunk and store in the vector store.
 */

import { embed } from "./groqClient";
import { upsert, clearStore } from "./vectorStore";
import resumeData from "./resume.json";

interface Experience { title: string; company: string; highlights: string[] }
interface SkillLevels { expert: string[]; proficient: string[] }

interface ResumeChunk {
  id: string;
  text: string;
  section: string;
}

// ─── Chunking: structured JSON resume (default) ───────────────────────────────

function buildChunksFromJson(): ResumeChunk[] {
  const profile = resumeData as {
    summary: string;
    _skill_levels: SkillLevels;
    experience: Experience[];
  };

  const chunks: ResumeChunk[] = [];

  chunks.push({ id: "summary", text: `Professional Summary: ${profile.summary}`, section: "summary" });
  chunks.push({ id: "skills_expert", text: `Expert Skills: ${profile._skill_levels.expert.join(", ")}`, section: "skills" });
  chunks.push({ id: "skills_proficient", text: `Proficient Skills: ${profile._skill_levels.proficient.join(", ")}`, section: "skills" });

  profile.experience.forEach((job, idx) => {
    chunks.push({
      id: `experience_${idx}`,
      text: `Role: ${job.title} at ${job.company}\n${job.highlights.join("\n")}`,
      section: "experience",
    });
  });

  return chunks;
}

// ─── Chunking: free-text resume (uploaded) ────────────────────────────────────
//
// Strategy: split on blank lines (paragraph breaks).
// Each paragraph becomes one chunk — works well for PDF-extracted text
// because PDFs typically have sections separated by blank lines.

function buildChunksFromText(text: string): ResumeChunk[] {
  const paragraphs = text
    .split(/\n{2,}/)                      // split on 2+ newlines
    .map((p) => p.replace(/\n/g, " ").trim()) // collapse single newlines into spaces
    .filter((p) => p.length > 40);        // drop very short fragments (page numbers etc.)

  return paragraphs.map((text, idx) => ({
    id: `uploaded_chunk_${idx}`,
    text,
    section: inferSection(text),
  }));
}

/** Heuristic: guess what section a paragraph belongs to based on keywords */
function inferSection(text: string): string {
  const t = text.toLowerCase();
  if (/experience|worked|company|role|position|employer|responsibility/.test(t)) return "experience";
  if (/skill|technology|proficient|expert|familiar|language|framework|tool/.test(t)) return "skills";
  if (/education|degree|university|college|bachelor|master|gpa/.test(t)) return "education";
  if (/summary|objective|profile|about/.test(t)) return "summary";
  return "general";
}

// ─── Embed + store ────────────────────────────────────────────────────────────

async function embedAndStore(chunks: ResumeChunk[]): Promise<number> {
  clearStore();
  for (const chunk of chunks) {
    const embedding = await embed(chunk.text);
    upsert({ id: chunk.id, text: chunk.text, embedding, metadata: { section: chunk.section } });
  }
  return chunks.length;
}

/** Ingest the default hardcoded JSON resume */
export async function ingestResume(): Promise<number> {
  return embedAndStore(buildChunksFromJson());
}

/** Ingest a free-text resume (from PDF extraction or textarea paste) */
export async function ingestFromText(text: string): Promise<number> {
  const chunks = buildChunksFromText(text);
  if (chunks.length === 0) {
    throw new Error("Could not extract any content from the uploaded resume. Please check the file.");
  }
  return embedAndStore(chunks);
}
