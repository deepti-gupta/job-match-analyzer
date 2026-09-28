"use client";

import { useState } from "react";
import { analyzeJob, type AnalyzeResponse, type UploadResumeResult } from "@/lib/api";
import { MatchScore } from "@/components/MatchScore";
import { SkillGaps } from "@/components/SkillGaps";
import { CoverLetter } from "@/components/CoverLetter";
import { RAGDebugPanel } from "@/components/RAGDebugPanel";
import { ResumeUpload } from "@/components/ResumeUpload";
import { KeywordSuggestions } from "@/components/KeywordSuggestions";

type AppState = "idle" | "loading" | "result" | "error";

const PLACEHOLDER =
  `We are looking for a Senior Frontend Engineer with 5+ years of React and TypeScript experience.
Strong knowledge of state management (Redux, Context API), REST API integration, and micro-frontend architecture required.
Experience with GraphQL, CI/CD pipelines, and AWS is a plus.
Strong communication skills and experience mentoring junior developers preferred.`;

export default function Home() {
  const [jdText, setJdText] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedResume, setUploadedResume] = useState<UploadResumeResult | null>(null);

  const handleUploaded = (res: UploadResumeResult) => {
    setUploadedResume(res);
  };

  const handleAnalyze = async () => {
    if (jdText.trim().length < 50) return;
    setState("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const data = await analyzeJob(jdText);
      setResult(data);
      setState("result");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Job Match Analyzer</h1>
          <p className="text-gray-500 text-sm">
            Powered by RAG + LLaMA 3 (Groq) — instantly see how well you match any job description
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
            ⚡ Deployed on Vercel · LLM by Groq (free)
          </div>
        </div>

        {state !== "result" && (
          <>
            {/* Resume upload */}
            <ResumeUpload onUploaded={handleUploaded} />

            {/* Resume in use indicator */}
            {!uploadedResume && (
              <div className="text-xs text-gray-400 text-center -mt-3 mb-5">
                Using default resume · Upload yours above to customize
              </div>
            )}

            {/* JD input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paste Job Description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={10}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{jdText.length} characters</span>
                <button
                  onClick={handleAnalyze}
                  disabled={jdText.trim().length < 50 || state === "loading"}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  {state === "loading" ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Analyzing with LLaMA 3…
                    </>
                  ) : "🔍 Analyze Match"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* Results */}
        {state === "result" && result && (
          <div className="space-y-5">
            {/* Resume source badge */}
            <div className="text-xs text-center text-gray-400">
              Analyzed against:{" "}
              <span className="font-medium text-gray-600">
                {uploadedResume ? "your uploaded resume" : "default resume (Deepti Gupta)"}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <MatchScore score={result.analysis.matchScore} />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-800 mb-2">Match Summary</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.analysis.matchSummary}</p>
                </div>
              </div>
            </div>

            <SkillGaps
              matchedSkills={result.analysis.matchedSkills}
              missingSkills={result.analysis.missingSkills}
              strengthPoints={result.analysis.strengthPoints}
            />

            {result.analysis.keywordSuggestions?.length > 0 && (
              <KeywordSuggestions keywords={result.analysis.keywordSuggestions} />
            )}

            <CoverLetter text={result.analysis.coverLetter} />
            <RAGDebugPanel chunks={result.debug.chunksRetrieved} />

            <div className="text-center pt-2">
              <button
                onClick={() => { setState("idle"); setResult(null); setJdText(""); }}
                className="text-sm text-gray-500 hover:text-gray-800 underline"
              >
                ← Analyze another job
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
