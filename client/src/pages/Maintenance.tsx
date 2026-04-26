import { useEffect, useState } from "react";
import { Wrench, CheckCircle2 } from "lucide-react";
import { fetchReports, updateReportStatus } from "../api";
import type { Report } from "../types";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

const STATUS_OPTIONS = ["New", "Assigned", "In Progress", "Resolved"];

export default function Maintenance() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchReports().then((d) => { setReports(d); setLoading(false); });
  }, []);

  const sorted = [...reports].sort((a, b) => b.riskScore - a.riskScore);

  async function changeStatus(id: string, status: string) {
    await updateReportStatus(id, status);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: status as Report["status"] } : r));
    setToast(`Status updated to "${status}"`);
    setTimeout(() => setToast(""), 2500);
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Loading queue...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Queue</h1>
        <p className="mt-1 text-sm text-gray-500">Prioritized by risk score. {sorted.filter((r) => r.status !== "Resolved").length} pending tasks.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Team</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((r, i) => (
                <tr key={r.id} className={`transition-colors ${r.status === "Resolved" ? "bg-green-50/50 opacity-60" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.assetName}</p>
                    <p className="text-xs text-gray-500">{r.locationName}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.issueType}</td>
                  <td className="whitespace-nowrap px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><RiskBadge score={r.riskScore} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 text-xs">{r.assignedTeam}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{r.recommendedAction}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => changeStatus(r.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
