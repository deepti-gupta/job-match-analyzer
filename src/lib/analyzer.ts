/**
 * ANALYZER — Phase 3 of RAG (Generation)
 * Builds a prompt from retrieved context + JD, calls LLaMA 3 via Groq,
 * and parses the structured JSON response.
 */

import { getGroqClient, CHAT_MODEL } from "./groqClient";
import type { RetrievedChunk } from "./retriever";

export interface KeywordSuggestion {
  keyword: string;
  priority: "high" | "medium" | "low";
  reason: string; // why this keyword matters for this JD
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

function buildPrompt(chunks: RetrievedChunk[], jobDescription: string): string {
  const context = chunks
    .map((c, i) => `[Section ${i + 1} — ${c.section}]\n${c.text}`)
    .join("\n\n");

  return `You are an expert career coach, recruiter, and ATS (Applicant Tracking System) specialist. Analyze how well a candidate matches a job description.

## CANDIDATE PROFILE (extracted from resume)
${context}

## JOB DESCRIPTION
${jobDescription}

## TASK
Analyze the match and identify high-impact resume keywords.
Respond ONLY with valid JSON — no markdown fences, no extra text:

{
  "matchScore": <integer 0-100>,
  "matchSummary": "<2-3 sentence assessment of overall fit>",
  "matchedSkills": ["<skill1>", "<skill2>"],
  "missingSkills": ["<skill1>", "<skill2>"],
  "strengthPoints": ["<strength1>", "<strength2>", "<strength3>"],
  "coverLetter": "<full tailored cover letter, professional tone, 3 paragraphs>",
  "keywordSuggestions": [
    { "keyword": "<keyword or phrase>", "priority": "high|medium|low", "reason": "<one sentence: why ATS systems flag this keyword for this role>" }
  ]
}

Rules:
- matchScore should reflect genuine fit, not be inflated
- missingSkills only lists skills explicitly required in the JD that are absent from the profile
- coverLetter must reference specific experience from the profile
- keywordSuggestions: extract 8-12 specific keywords/phrases from the JD that ATS systems scan for
  * "high" priority = appears multiple times in JD or is the core requirement (e.g. job title, primary tech)
  * "medium" priority = mentioned once as required or preferred
  * "low" priority = nice-to-have or inferred from context
  * Focus on: exact job title variants, technical terms, methodologies, tools, soft skills with measurable context
  * Only suggest keywords the candidate can authentically add based on their experience
- DO NOT wrap the JSON in markdown code blocks`;
}

export async function analyzeMatch(
  chunks: RetrievedChunk[],
  jobDescription: string
): Promise<MatchAnalysis> {
  const groq = getGroqClient();
  const prompt = buildPrompt(chunks, jobDescription);

  const response = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }, // Groq supports JSON mode
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  let parsed: MatchAnalysis;
  try {
    parsed = JSON.parse(raw) as MatchAnalysis;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`LLM returned non-JSON: ${raw.slice(0, 200)}`);
    parsed = JSON.parse(match[0]) as MatchAnalysis;
  }

  if (typeof parsed.matchScore !== "number") {
    throw new Error("LLM response missing matchScore");
  }

  return parsed;
}
