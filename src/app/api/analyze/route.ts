import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/retriever";
import { analyzeMatch } from "@/lib/analyzer";
import { storeSize } from "@/lib/vectorStore";
import { ingestResume } from "@/lib/ingest";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { jobDescription?: string };
  const { jobDescription } = body;

  if (!jobDescription || jobDescription.trim().length < 50) {
    return NextResponse.json(
      { error: "Please provide a job description (minimum 50 characters)" },
      { status: 400 }
    );
  }

  // Auto-ingest if store is empty.
  // Each Next.js API route runs in its own module scope — the store filled by
  // /api/ingest is NOT visible here. So we ingest lazily on first analyze call.
  if (storeSize() === 0) {
    await ingestResume();
  }

  try {
    // Phase 2: Semantic search
    const relevantChunks = await retrieveRelevantChunks(jobDescription, 4);

    // Phase 3: LLM generation
    const analysis = await analyzeMatch(relevantChunks, jobDescription);

    return NextResponse.json({
      success: true,
      analysis,
      debug: {
        chunksRetrieved: relevantChunks.map((c) => ({
          section: c.section,
          similarity: c.similarityScore.toFixed(3),
          preview: c.text.slice(0, 80) + "...",
        })),
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Analysis failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
