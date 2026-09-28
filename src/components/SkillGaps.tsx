"use client";

interface Props {
  matchedSkills: string[];
  missingSkills: string[];
  strengthPoints: string[];
}

export function SkillGaps({ matchedSkills, missingSkills, strengthPoints }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Matched Skills */}
      <div className="bg-green-50 border border-green-300 rounded-xl p-4">
        <h3 className="text-sm font-bold text-green-900 mb-3">
          ✅ Matched Skills ({matchedSkills.length})
        </h3>
        <ul className="flex flex-wrap gap-2">
          {matchedSkills.map((skill) => (
            <li key={skill} className="bg-white border border-green-300 text-green-900 text-sm font-semibold px-3 py-1 rounded-full">
              {skill}
            </li>
          ))}
        </ul>
      </div>

      {/* Missing Skills */}
      <div className="bg-red-50 border border-red-300 rounded-xl p-4">
        <h3 className="text-sm font-bold text-red-900 mb-3">
          ❌ Missing Skills ({missingSkills.length})
        </h3>
        {missingSkills.length === 0 ? (
          <p className="text-sm font-medium text-red-800">None — you have all required skills!</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <li key={skill} className="bg-white border border-red-300 text-red-900 text-sm font-semibold px-3 py-1 rounded-full">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Strength Points */}
      <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-3">💪 Your Strengths</h3>
        <ul className="space-y-2.5">
          {strengthPoints.map((point, i) => (
            <li key={i} className="text-sm text-gray-800 font-medium flex items-start gap-2">
              <span className="text-blue-500 mt-1 shrink-0">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
