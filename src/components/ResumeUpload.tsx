"use client";

import { useState, useRef, DragEvent } from "react";
import { uploadResume, uploadResumeText, type UploadResumeResult } from "@/lib/api";

type Tab = "file" | "paste";
type UploadState = "idle" | "uploading" | "done" | "error";

interface Props {
  onUploaded: (result: UploadResumeResult) => void;
}

export function ResumeUpload({ onUploaded }: Props) {
  const [tab, setTab] = useState<Tab>("file");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      setErrorMsg("Only PDF or .txt files are supported.");
      setUploadState("error");
      return;
    }
    setFileName(file.name);
    setUploadState("uploading");
    setErrorMsg("");
    try {
      const result = await uploadResume(file);
      setUploadState("done");
      onUploaded(result);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setUploadState("error");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePasteSubmit = async () => {
    if (pasteText.trim().length < 100) return;
    setUploadState("uploading");
    setErrorMsg("");
    try {
      const result = await uploadResumeText(pasteText);
      setUploadState("done");
      onUploaded(result);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setUploadState("error");
    }
  };

  const handleReset = () => {
    setUploadState("idle");
    setFileName("");
    setPasteText("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Done state ────────────────────────────────────────────────────────────
  if (uploadState === "done") {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-green-800">
          <span>✅</span>
          <span className="font-medium">
            {fileName ? `"${fileName}"` : "Resume text"} uploaded and indexed
          </span>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-green-700 hover:text-green-900 underline"
        >
          Change resume
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-sm font-semibold text-gray-700">📄 Upload Your Resume</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Optional — defaults to Deepti&apos;s resume if skipped
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-5">
        {(["file", "paste"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-medium pb-2 mr-4 border-b-2 transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "file" ? "📁 Upload File" : "📋 Paste Text"}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── File upload tab ─────────────────────────────── */}
        {tab === "file" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {uploadState === "uploading" ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-xs text-gray-500">Extracting and indexing…</p>
              </div>
            ) : (
              <>
                <p className="text-2xl mb-2">📂</p>
                <p className="text-sm font-medium text-gray-600">
                  Drag & drop or <span className="text-blue-500">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or .txt · Max 5MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* ── Paste text tab ──────────────────────────────── */}
        {tab === "paste" && (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your full resume text here (copy from Word, Google Docs, etc.)…"
              rows={7}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{pasteText.length} chars</span>
              <button
                onClick={handlePasteSubmit}
                disabled={pasteText.trim().length < 100 || uploadState === "uploading"}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {uploadState === "uploading" ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Indexing…
                  </>
                ) : "Index Resume"}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {uploadState === "error" && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <span>❌</span> {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
