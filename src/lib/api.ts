export interface KeywordSuggestion {
  keyword: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface MatchAnalysis {
  matchScore: number;
  matchSummary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengthPoints: string[];
  coverLetter: string;
  keywordSuggestions: KeywordSuggestion[];
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: MatchAnalysis;
  debug: {
    chunksRetrieved: Array<{
      section: string;
      similarity: string;
      preview: string;
    }>;
  };
  error?: string;
  needsIngest?: boolean;
}

export async function ingestResume(): Promise<void> {
  const res = await fetch("/api/ingest", { method: "POST" });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Ingest failed");
  }
}

export interface UploadResumeResult {
  success: boolean;
  message: string;
  chunkCount: number;
}

/** Upload a PDF or .txt file — replaces the default resume in the vector store */
export async function uploadResume(file: File): Promise<UploadResumeResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload-resume", { method: "POST", body: form });
  const data = (await res.json()) as UploadResumeResult & { error?: string };
  if (!res.ok || !data.success) throw new Error(data.error ?? "Upload failed");
  return data;
}

/** Upload resume as raw pasted text */
export async function uploadResumeText(text: string): Promise<UploadResumeResult> {
  const form = new FormData();
  form.append("text", text);
  const res = await fetch("/api/upload-resume", { method: "POST", body: form });
  const data = (await res.json()) as UploadResumeResult & { error?: string };
  if (!res.ok || !data.success) throw new Error(data.error ?? "Upload failed");
  return data;
}

export async function analyzeJob(jobDescription: string): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription }),
  });

  const data = (await res.json()) as AnalyzeResponse;

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Analysis failed");
  }

  return data;
}
