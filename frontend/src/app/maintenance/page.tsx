'use client';

import { useEffect, useState } from 'react';
import { fetchReports, updateReportStatus, completeSafetyChecklist, triggerEmergencyAlert } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import { getRiskColor, getStatusColor, STATUSES, formatDate } from '@/lib/utils';
import { Wrench, CheckCircle, AlertOctagon, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';

export default function MaintenancePage() {
  const { selectedCompany } = useAppContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [safetyModal, setSafetyModal] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCompany !== 'all') params.tenantId = selectedCompany;
      const data = await fetchReports(params);
      setReports(data.filter((r: any) => ['New', 'Reviewed', 'Assigned', 'In Progress'].includes(r.status)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedCompany]);

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await updateReportStatus(id, status);
      await load();
    } catch (e) { alert('Failed to update status'); }
    setActionLoading('');
  };

  const handleSafetyComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await completeSafetyChecklist(id, true);
      setSafetyModal(null);
      await load();
    } catch (e) { alert('Failed to complete checklist'); }
    setActionLoading('');
  };

  const handleEmergency = async (id: string) => {
    if (!confirm('Trigger emergency alert for this report? This will escalate immediately.')) return;
    setActionLoading(id);
    try {
      await triggerEmergencyAlert(id);
      await load();
    } catch (e) { alert('Failed to trigger alert'); }
    setActionLoading('');
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a] p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white"><Wrench size={24} /> Maintenance Queue</h1>
          <p className="text-purple-300/70 text-sm mt-1">Manage active maintenance tasks, safety check-ins, and emergency alerts.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-purple-400 animate-pulse">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="bg-[#16162a] rounded-xl border border-white/5 p-8 text-center">
          <ShieldCheck size={40} className="mx-auto text-green-400 mb-2" />
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-sm text-slate-500">No active maintenance tasks at this time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((r: any) => (
            <div key={r.id} className="bg-[#16162a] rounded-xl border border-white/5 p-4 hover:border-purple-500/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-white">{r.asset_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-slate-400">{r.company_name} · {r.location_name} · {r.issue_type}</p>
                  <p className="text-xs text-slate-500 mt-1">Created {formatDate(r.created_at)} · Assigned to {r.assigned_team || 'Unassigned'}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {r.status !== 'Resolved' && (
                    <select
                      value={r.status}
                      onChange={e => handleStatusChange(r.id, e.target.value)}
                      disabled={actionLoading === r.id}
                      className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {STATUSES.filter(s => s !== 'Verified').map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                    </select>
                  )}

                  <button onClick={() => setSafetyModal(r)} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/20 flex items-center gap-1 border border-amber-500/20">
                    <CheckCircle size={14} />
                    {r.safety_checklist_completed ? 'Completed' : 'Safety Check'}
                  </button>

                  <button onClick={() => handleEmergency(r.id)} disabled={actionLoading === r.id} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg font-medium hover:bg-red-500/20 flex items-center gap-1 border border-red-500/20">
                    <AlertOctagon size={14} /> Emergency
                  </button>
                </div>
              </div>

              <div className="mt-3 bg-white/[0.03] rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400 border border-white/5">
                <div><span className="font-semibold text-slate-300">PPE:</span> {(r.required_ppe || []).join(', ')}</div>
                <div><span className="font-semibold text-slate-300">Min Crew:</span> {r.minimum_crew}</div>
                <div><span className="font-semibold text-slate-300">Supervisor:</span> {r.supervisor_approval_required ? 'Required' : 'Not needed'}</div>
                <div><span className="font-semibold text-slate-300">Hazard Radius:</span> {r.hazard_radius_meters}m</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {safetyModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSafetyModal(null)}>
          <div className="bg-[#1a1a2e] rounded-2xl max-w-lg w-full p-6 space-y-4 border border-white/10" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">Worker Safety Check-In</h2>
            <p className="text-sm text-slate-400">{safetyModal.asset_name} — {safetyModal.location_name}</p>

            <div className="bg-amber-950/20 rounded-lg p-4 space-y-2 border border-amber-500/10">
              <h3 className="text-sm font-semibold text-amber-300">Required PPE</h3>
              <ul className="space-y-1">
                {(safetyModal.required_ppe || []).map((p: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle size={14} className="text-green-400" /> {p}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-950/20 rounded-lg p-4 space-y-2 border border-blue-500/10">
              <h3 className="text-sm font-semibold text-blue-300">Safety Instructions</h3>
              <ul className="space-y-1">
                {(safetyModal.safety_instructions || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300"><ChevronRight size={14} className="text-blue-400" /> {s}</li>
                ))}
              </ul>
            </div>

            <div className="text-sm space-y-1 text-slate-300">
              <p><span className="font-semibold text-slate-400">Worker Safety Level:</span> {safetyModal.worker_safety_level}</p>
              <p><span className="font-semibold text-slate-400">Minimum Crew:</span> {safetyModal.minimum_crew}</p>
              <p><span className="font-semibold text-slate-400">Supervisor Approval:</span> {safetyModal.supervisor_approval_required ? 'Required before work begins' : 'Not required'}</p>
              <p><span className="font-semibold text-slate-400">Status:</span> {safetyModal.safety_checklist_completed ? <span className="text-green-400 font-medium">Completed</span> : <span className="text-amber-400 font-medium">Pending</span>}</p>
            </div>

            {!safetyModal.safety_checklist_completed && (
              <button onClick={() => handleSafetyComplete(safetyModal.id)} disabled={actionLoading === safetyModal.id} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading === safetyModal.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Confirm Safety Checklist Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
