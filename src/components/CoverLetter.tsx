"use client";

import { useState } from "react";

interface Props {
  text: string;
}

export function CoverLetter({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">✉️ AI-Generated Cover Letter</h3>
        <button
          onClick={handleCopy}
          className="text-sm font-semibold bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          {copied ? "✅ Copied!" : "📋 Copy"}
        </button>
      </div>
      <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed bg-white border border-gray-200 rounded-lg p-5 max-h-80 overflow-y-auto">
        {text}
      </div>
    </div>
  );
}
