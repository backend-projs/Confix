const map: Record<string, string> = {
  Low: "bg-green-100 text-green-700 ring-green-600/20",
  Medium: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  High: "bg-orange-100 text-orange-700 ring-orange-600/20",
  Critical: "bg-red-100 text-red-700 ring-red-600/20",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${map[severity] || map.Medium}`}>
      {severity}
    </span>
  );
}
