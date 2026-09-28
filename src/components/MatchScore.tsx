"use client";

interface Props {
  score: number;
}

export function MatchScore({ score }: Props) {
  const color =
    score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const ringColor =
    score >= 70 ? "stroke-green-500" : score >= 50 ? "stroke-yellow-400" : "stroke-red-500";

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const label =
    score >= 80 ? "Excellent Match" : score >= 65 ? "Good Match" : score >= 50 ? "Partial Match" : "Low Match";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={radius} fill="none"
            className={ringColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <span className={`absolute text-3xl font-bold ${color}`}>{score}%</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{label}</span>
    </div>
  );
}
