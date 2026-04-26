'use client';

import { useEffect, useState } from 'react';
import { fetchReports } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import {
  getRiskColor, getStatusColor, getVisibilityColor, formatDate,
  ASSET_TYPES, ISSUE_TYPES, STATUSES,
} from '@/lib/utils';
import { Search, X, Eye, ShieldBan } from 'lucide-react';

export default function ReportsPage() {
  const { selectedCompany, selectedRole } = useAppContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ assetType: '', issueType: '', status: '', riskLevel: '', visibilityLevel: '' });
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    if (selectedRole === 'Field Engineer') return;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCompany !== 'all') params.tenantId = selectedCompany;
        if (search) params.search = search;
        if (filters.assetType) params.assetType = filters.assetType;
        if (filters.issueType) params.issueType = filters.issueType;
        if (filters.status) params.status = filters.status;
        if (filters.riskLevel) params.riskLevel = filters.riskLevel;
        if (filters.visibilityLevel) params.visibilityLevel = filters.visibilityLevel;
        const data = await fetchReports(params);
        setReports(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [selectedCompany, selectedRole, search, filters]);

  if (selectedRole === 'Field Engineer') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <ShieldBan size={36} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-sm max-w-md">
          Field Engineers do not have permission to view the full reports list. Please switch to Supervisor, Company Admin, or Holding Executive role to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a] p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Field Reports</h1>
          <p className="text-purple-300/70 text-sm mt-1">View, search, and filter all infrastructure issue reports.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#16162a] rounded-xl border border-white/5 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset, location, issue..." className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {[
          { key: 'assetType', label: 'Asset Type', opts: ASSET_TYPES },
          { key: 'issueType', label: 'Issue Type', opts: ISSUE_TYPES },
          { key: 'status', label: 'Status', opts: STATUSES },
          { key: 'riskLevel', label: 'Risk Level', opts: ['Low', 'Medium', 'High', 'Critical'] },
          { key: 'visibilityLevel', label: 'Visibility', opts: ['Internal', 'Restricted', 'Critical'] },
        ].map(f => (
          <select key={f.key} value={(filters as any)[f.key]} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="" className="bg-slate-900">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-purple-400 animate-pulse">Loading reports...</div>
      ) : (
        <div className="bg-[#16162a] rounded-xl border border-white/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                {['Company', 'Asset', 'Type', 'Location', 'Issue', 'Impact', 'Lklhd', 'Score', 'Risk', 'Status', 'Reviewed', 'Created', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r: any) => (
                <tr key={r.id} className="hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => setSelectedReport(r)}>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{r.company_name}</td>
                  <td className="px-3 py-2.5 font-medium text-xs text-slate-200">{r.asset_name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{r.asset_type}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{r.location_name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{r.issue_type}</td>
                  <td className="px-3 py-2.5 text-xs text-center text-slate-400">{r.impact}</td>
                  <td className="px-3 py-2.5 text-xs text-center text-slate-400">{r.likelihood}</td>
                  <td className="px-3 py-2.5 text-xs text-center font-mono font-bold text-purple-400">{r.risk_matrix_score}</td>
                  <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span></td>
                  <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  <td className="px-3 py-2.5 text-xs text-center text-slate-400">{r.supervisor_reviewed ? '✓' : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-3 py-2.5"><Eye size={14} className="text-slate-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <div className="text-center py-8 text-slate-500">No reports found</div>}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-[#1a1a2e] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedReport.asset_name}</h2>
                <p className="text-sm text-slate-400">{selectedReport.company_name} · {selectedReport.location_name}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold text-slate-400">Asset Type:</span> <span className="text-slate-200">{selectedReport.asset_type}</span></div>
              <div><span className="font-semibold text-slate-400">Issue Type:</span> <span className="text-slate-200">{selectedReport.issue_type}</span></div>
              <div><span className="font-semibold text-slate-400">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></div>
              <div><span className="font-semibold text-slate-400">Visibility:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisibilityColor(selectedReport.visibility_level)}`}>{selectedReport.visibility_level}</span></div>
            </div>

            <div className="text-sm"><span className="font-semibold text-slate-400">Description:</span><p className="mt-1 text-slate-300">{selectedReport.description}</p></div>

            {/* Risk Matrix */}
            <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10">
              <h3 className="text-sm font-semibold mb-2 text-purple-300">Engineer-reviewed Risk Matrix</h3>
              <p className="text-sm text-slate-300">Impact {selectedReport.impact} × Likelihood {selectedReport.likelihood} = <span className="font-bold text-white">{selectedReport.risk_matrix_score}</span></p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(selectedReport.risk_level)}`}>{selectedReport.risk_level}</span>
              <p className="text-xs text-slate-500 italic mt-2">Final risk classification is engineer-reviewed.</p>
            </div>

            {/* Safety */}
            <div className="bg-amber-950/20 rounded-lg p-4 space-y-2 border border-amber-500/10">
              <h3 className="text-sm font-semibold text-amber-300">Worker Safety Protocol</h3>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Required PPE:</span> {(selectedReport.required_ppe || []).join(', ')}</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Safety Instructions:</span> {(selectedReport.safety_instructions || []).join(', ')}</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Worker Safety Level:</span> {selectedReport.worker_safety_level}</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Minimum Crew:</span> {selectedReport.minimum_crew}</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Supervisor Approval:</span> {selectedReport.supervisor_approval_required ? 'Required' : 'Not required'}</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Hazard Radius:</span> {selectedReport.hazard_radius_meters}m</div>
              <div className="text-sm text-slate-300"><span className="font-medium text-slate-400">Safety Checklist:</span> {selectedReport.safety_checklist_completed ? 'Completed ✓' : 'Pending'}</div>
            </div>

            {/* Coordinates */}
            <div className="text-sm">
              <span className="font-semibold text-slate-400">Coordinates:</span> {selectedReport.exact_coordinates_restricted ? <span className="text-red-400 italic">Restricted — masked for governance compliance</span> : <span className="text-slate-300">{selectedReport.latitude}, {selectedReport.longitude}</span>}
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-slate-300">Audit Trail</h3>
              <div className="space-y-1">
                {(selectedReport.audit_trail || []).map((evt: any, i: number) => (
                  <div key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-slate-600 whitespace-nowrap">{new Date(evt.timestamp).toLocaleString()}</span>
                    <span>{evt.action}</span>
                    <span className="text-slate-600">— {evt.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
