/**
 * POST /api/upload-resume
 *
 * Accepts multipart/form-data with one of:
 *   - file: a PDF or .txt file (field name "file")
 *   - text: raw resume text (field name "text")
 *
 * Extracts text, chunks it, embeds it, and stores in the vector store.
 * Subsequent /api/analyze calls will use this uploaded resume instead of
 * the default profile.json.
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestFromText } from "@/lib/ingest";

type PdfParseFn = (buf: Buffer, opts?: Record<string, unknown>) => Promise<{ text: string }>;

/**
 * Extract text from a PDF buffer.
 *
 * "bad XRef entry" is thrown by pdfjs-dist when the PDF has a malformed
 * cross-reference table — very common with Word exports, Canva, and online
 * resume builders. Two defences:
 *
 *  1. Pass `{ max: 0 }` — tells pdfjs to attempt recovery instead of aborting.
 *  2. If parsing still throws, retry with `{ version: "v1.10.100" }` which
 *     uses an older pdfjs parser that is more lenient.
 *  3. If both fail, propagate a human-friendly error.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require("pdf-parse") as PdfParseFn;
  const fn: PdfParseFn = typeof pdfParse === "function"
    ? pdfParse
    : (pdfParse as unknown as { default: PdfParseFn }).default;

  // Attempt 1 — lenient mode (max:0 disables page limit and enables recovery)
  try {
    const result = await fn(buffer, { max: 0 });
    if (result.text && result.text.trim().length > 0) return result.text;
  } catch {
    // fall through to attempt 2
  }

  // Attempt 2 — older pdfjs version, even more tolerant
  try {
    const result = await fn(buffer, { version: "v1.10.100" });
    if (result.text && result.text.trim().length > 0) return result.text;
  } catch {
    // fall through to final error
  }

  throw new Error(
    "Could not extract text from this PDF. It may be scanned (image-based) or heavily corrupted. " +
    "Try saving the PDF as plain text or copy-paste the resume text using the 'Paste Text' tab."
  );
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    let resumeText = "";

    // ── Option 1: plain text pasted directly ──────────────────────────────────
    const rawText = formData.get("text");
    if (rawText && typeof rawText === "string" && rawText.trim().length > 100) {
      resumeText = rawText.trim();
    }

    // ── Option 2: file upload (.pdf or .txt) ──────────────────────────────────
    const file = formData.get("file") as File | null;
    if (file && !resumeText) {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".txt") || file.type === "text/plain") {
        // Plain text — read directly
        resumeText = await file.text();

      } else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
        // PDF — extract text using pdf-parse
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        resumeText = await extractPdfText(buffer);

      } else {
        return NextResponse.json(
          { success: false, error: "Unsupported file type. Please upload a PDF or .txt file." },
          { status: 400 }
        );
      }
    }

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: "Resume content is too short. Please upload a valid resume." },
        { status: 400 }
      );
    }

    // Ingest the extracted text into the vector store
    const count = await ingestFromText(resumeText);

    return NextResponse.json({
      success: true,
      message: `Resume uploaded and indexed — ${count} chunks stored`,
      chunkCount: count,
    });

  } catch (err) {
    const error = err as Error;
    console.error("Upload failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
