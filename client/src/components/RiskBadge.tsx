interface Props {
  score: number;
  size?: "sm" | "md";
}

function riskLevel(s: number) {
  if (s >= 85) return { label: "Critical", bg: "bg-red-100 text-red-700 ring-red-600/20" };
  if (s >= 70) return { label: "High", bg: "bg-orange-100 text-orange-700 ring-orange-600/20" };
  if (s >= 40) return { label: "Medium", bg: "bg-yellow-100 text-yellow-800 ring-yellow-600/20" };
  return { label: "Low", bg: "bg-green-100 text-green-700 ring-green-600/20" };
}

export default function RiskBadge({ score, size = "sm" }: Props) {
  const { label, bg } = riskLevel(score);
  const sz = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${bg} ${sz}`}>
      {label} <span className="font-normal opacity-75">{score}</span>
    </span>
  );
}
