const map: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 ring-blue-600/20",
  Assigned: "bg-purple-100 text-purple-700 ring-purple-600/20",
  "In Progress": "bg-amber-100 text-amber-700 ring-amber-600/20",
  Resolved: "bg-green-100 text-green-700 ring-green-600/20",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${map[status] || map.New}`}>
      {status}
    </span>
  );
}
