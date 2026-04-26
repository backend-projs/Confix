import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export default function StatCard({ title, value, icon: Icon, color, trend }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-gray-400">{trend}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-5 ${color}`} />
    </div>
  );
}
