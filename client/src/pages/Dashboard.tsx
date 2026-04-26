import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  FileWarning, AlertTriangle, Activity, CheckCircle2, ClipboardList, TrendingUp,
} from "lucide-react";
import { fetchReports } from "../api";
import type { Report } from "../types";
import StatCard from "../components/StatCard";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports().then((d) => { setReports(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Loading dashboard...</div>;

  const critical = reports.filter((r) => r.riskScore >= 85).length;
  const high = reports.filter((r) => r.riskScore >= 70 && r.riskScore < 85).length;
  const avgRisk = reports.length ? Math.round(reports.reduce((a, b) => a + b.riskScore, 0) / reports.length) : 0;
  const pending = reports.filter((r) => r.status !== "Resolved").length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;

  const riskDist = [
    { name: "Critical", value: critical, color: "#ef4444" },
    { name: "High", value: high, color: "#f97316" },
    { name: "Medium", value: reports.filter((r) => r.riskScore >= 40 && r.riskScore < 70).length, color: "#eab308" },
    { name: "Low", value: reports.filter((r) => r.riskScore < 40).length, color: "#22c55e" },
  ];

  const assetBreakdown = Object.entries(
    reports.reduce<Record<string, number>>((acc, r) => { acc[r.assetType] = (acc[r.assetType] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const topRisk = [...reports].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const recent = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor critical infrastructure, detect risks earlier, and prioritize maintenance with data-driven insights.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Reports" value={reports.length} icon={ClipboardList} color="bg-azcon-700" />
        <StatCard title="Critical Issues" value={critical} icon={FileWarning} color="bg-red-600" />
        <StatCard title="High Risk" value={high} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="Avg Risk Score" value={avgRisk} icon={TrendingUp} color="bg-cyan-600" />
        <StatCard title="Pending" value={pending} icon={Activity} color="bg-amber-500" />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle2} color="bg-green-600" />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} (${value})`}>
                {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Reports by Asset Type</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={assetBreakdown} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e5af1" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top risk */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Top 5 Highest Risk</h2>
          </div>
          <div className="divide-y">
            {topRisk.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{r.assetName}</p>
                  <p className="text-xs text-gray-500">{r.locationName} &middot; {r.issueType}</p>
                </div>
                <RiskBadge score={r.riskScore} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Inspections</h2>
          </div>
          <div className="divide-y">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{r.assetName}</p>
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={r.severity} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
