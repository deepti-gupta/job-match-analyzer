"use client";

import { useState } from "react";
import type { KeywordSuggestion } from "@/lib/api";

interface Props {
  keywords: KeywordSuggestion[];
}

const PRIORITY_CONFIG = {
  high:   { label: "High Priority", bg: "bg-white",  border: "border-red-300",    tag: "bg-red-600 text-white",        dot: "bg-red-500" },
  medium: { label: "Medium",        bg: "bg-white",  border: "border-yellow-400", tag: "bg-yellow-500 text-white",     dot: "bg-yellow-500" },
  low:    { label: "Low",           bg: "bg-white",  border: "border-gray-300",   tag: "bg-gray-600 text-white",       dot: "bg-gray-400" },
} as const;

export function KeywordSuggestions({ keywords }: Props) {
  const [copiedAll, setCopiedAll] = useState(false);

  const high   = keywords.filter((k) => k.priority === "high");
  const medium = keywords.filter((k) => k.priority === "medium");
  const low    = keywords.filter((k) => k.priority === "low");

  const handleCopyAll = async () => {
    const text = keywords
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
      .map((k) => `${k.keyword} [${k.priority}] — ${k.reason}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (!keywords.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            🎯 ATS Keyword Suggestions
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {keywords.length} keywords
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Add these to your resume to pass ATS screening for this role
          </p>
        </div>
        <button
          onClick={handleCopyAll}
          className="text-sm font-semibold bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          {copiedAll ? "✅ Copied!" : "📋 Copy all"}
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900 font-medium leading-relaxed">
          <strong>How to use:</strong> Weave these keywords naturally into your resume bullet points, summary, or skills section. ATS systems scan for exact matches — use the keyword as written.
        </div>

        {/* Priority groups */}
        {[
          { items: high,   priority: "high"   as const },
          { items: medium, priority: "medium" as const },
          { items: low,    priority: "low"    as const },
        ]
          .filter(({ items }) => items.length > 0)
          .map(({ items, priority }) => {
            const cfg = PRIORITY_CONFIG[priority];
            return (
              <div key={priority}>

                {/* Group label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {cfg.label} · {items.length}
                  </span>
                </div>

                {/* Keyword rows */}
                <div className="flex flex-col gap-2">
                  {items.map((k, i) => (
                    <div
                      key={i}
                      className={`${cfg.bg} ${cfg.border} border rounded-xl px-4 py-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Keyword pill */}
                          <span className={`${cfg.tag} text-sm font-bold px-3 py-1 rounded-full mt-0.5 shrink-0 whitespace-nowrap`}>
                            {k.keyword}
                          </span>
                          {/* Reason */}
                          <p className="text-sm text-gray-700 leading-relaxed">{k.reason}</p>
                        </div>
                        {/* Copy single */}
                        <button
                          onClick={() => navigator.clipboard.writeText(k.keyword)}
                          className="text-gray-400 hover:text-gray-700 shrink-0 text-xl leading-none mt-0.5"
                          title="Copy keyword"
                        >
                          ⎘
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
      </div>
    </div>
  );
}
