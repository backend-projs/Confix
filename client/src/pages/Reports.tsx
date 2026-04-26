import { useEffect, useState } from "react";
import { Search, X, Eye, MapPin } from "lucide-react";
import { fetchReports } from "../api";
import type { Report } from "../types";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import SeverityBadge from "../components/SeverityBadge";

const ASSET_TYPES = ["All", "Road", "Bridge", "Tunnel", "Telecom Tower", "Lighting Pole", "Fiber Cabinet", "Railway Segment"];
const SEVERITIES = ["All", "Low", "Medium", "High", "Critical"];
const STATUSES = ["All", "New", "Assigned", "In Progress", "Resolved"];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports().then((d) => { setReports(d); setLoading(false); });
  }, []);

  const filtered = reports.filter((r) => {
    if (assetFilter !== "All" && r.assetType !== assetFilter) return false;
    if (sevFilter !== "All" && r.severity !== sevFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.assetName.toLowerCase().includes(s) || r.locationName.toLowerCase().includes(s) || r.issueType.toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Loading reports...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">{reports.length} total inspection reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" placeholder="Search assets, locations, issues..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
          {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          {SEVERITIES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUSES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{r.assetName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.assetType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.locationName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.issueType}</td>
                  <td className="whitespace-nowrap px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><RiskBadge score={r.riskScore} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button onClick={() => setSelected(r)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-azcon-50 hover:text-azcon-600">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No reports match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.assetName}</h2>
                <p className="text-sm text-gray-500">{selected.assetType} &middot; {selected.locationName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <SeverityBadge severity={selected.severity} />
                <StatusBadge status={selected.status} />
                <RiskBadge score={selected.riskScore} size="md" />
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">{selected.description}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-500">Issue Type</span><p className="font-medium">{selected.issueType}</p></div>
                <div><span className="text-xs text-gray-500">Confidence</span><p className="font-medium">{Math.round(selected.confidence * 100)}%</p></div>
                <div><span className="text-xs text-gray-500">Assigned Team</span><p className="font-medium">{selected.assignedTeam}</p></div>
                <div><span className="text-xs text-gray-500">Created</span><p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p></div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} /> {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-xs text-gray-500">Recommended Action</span>
                <p className="mt-1 text-sm text-gray-800">{selected.recommendedAction}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-xs text-gray-500">AI Explanation</span>
                <ul className="mt-1 space-y-1">
                  {selected.explanation.map((e, i) => (
                    <li key={i} className="text-xs text-gray-600">- {e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
