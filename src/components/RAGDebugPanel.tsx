"use client";

interface Props {
  chunks: Array<{ section: string; similarity: string; preview: string }>;
}

export function RAGDebugPanel({ chunks }: Props) {
  return (
    <details className="bg-gray-900 text-gray-100 rounded-xl p-4">
      <summary className="cursor-pointer text-sm font-bold text-gray-200 hover:text-white">
        🔬 RAG Debug — Retrieved Chunks (click to expand)
      </summary>
      <p className="text-sm text-gray-400 mt-2 mb-3">
        These are the resume sections retrieved as most relevant to your JD. Higher similarity = more relevant.
      </p>
      <div className="space-y-3 mt-3">
        {chunks.map((chunk, i) => (
          <div key={i} className="border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-purple-300 font-bold font-mono">chunk[{i}]</span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">section: <span className="text-blue-300 font-semibold">{chunk.section}</span></span>
                <span className="text-gray-300">similarity:{" "}
                  <span className={`font-bold ${
                    parseFloat(chunk.similarity) > 0.7 ? "text-green-400" :
                    parseFloat(chunk.similarity) > 0.4 ? "text-yellow-400" : "text-red-400"
                  }`}>{chunk.similarity}</span>
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300 font-mono truncate">{chunk.preview}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
