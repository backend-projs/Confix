'use client';

import { useEffect, useState } from 'react';
import { fetchReports, updateReportStatus, completeSafetyChecklist, triggerEmergencyAlert } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import { getRiskColor, getStatusColor, STATUSES, formatDate } from '@/lib/utils';
import { Wrench, CheckCircle, AlertOctagon, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function MaintenancePage() {
  const { selectedCompany, lang } = useAppContext();
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] p-4 sm:p-6 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><Wrench size={22} /> {t('maint.title', lang)}</h1>
          <p className="text-purple-600/60 dark:text-purple-300/70 text-xs sm:text-sm mt-1">{t('maint.subtitle', lang)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-purple-600 dark:text-purple-400 animate-pulse">{t('maint.loading', lang)}</div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-8 text-center shadow-sm dark:shadow-none">
          <ShieldCheck size={40} className="mx-auto text-green-500 dark:text-green-400 mb-2" />
          <p className="text-gray-900 dark:text-white font-semibold">{t('maint.allClear', lang)}</p>
          <p className="text-sm text-gray-500 dark:text-slate-500">{t('maint.noTasks', lang)}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-4 hover:border-purple-300 dark:hover:border-purple-500/20 transition-colors shadow-sm dark:shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{r.asset_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{r.company_name} · {r.location_name} · {r.issue_type}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Created {formatDate(r.created_at)} · Assigned to {r.assigned_team || 'Unassigned'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                  {r.status !== 'Resolved' && (
                    <select
                      value={r.status}
                      onChange={e => handleStatusChange(r.id, e.target.value)}
                      disabled={actionLoading === r.id}
                      className="text-xs bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {STATUSES.filter(s => s !== 'Verified').map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>)}
                    </select>
                  )}

                  <button onClick={() => setSafetyModal(r)} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/20 flex items-center gap-1 border border-amber-500/20">
                    <CheckCircle size={14} />
                    {r.safety_checklist_completed ? t('common.completed', lang) : t('maint.safetyCheck', lang)}
                  </button>

                  <button onClick={() => handleEmergency(r.id)} disabled={actionLoading === r.id} className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg font-medium hover:bg-red-500/20 flex items-center gap-1 border border-red-500/20">
                    <AlertOctagon size={14} /> {t('maint.emergency', lang)}
                  </button>
                </div>
              </div>

              <div className="mt-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg p-2.5 sm:p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-white/5">
                <div><span className="font-semibold text-gray-700 dark:text-slate-300">{t('maint.ppe', lang)}:</span> {(r.required_ppe || []).join(', ')}</div>
                <div><span className="font-semibold text-gray-700 dark:text-slate-300">{t('maint.minCrew', lang)}:</span> {r.minimum_crew}</div>
                <div><span className="font-semibold text-gray-700 dark:text-slate-300">{t('maint.supervisor', lang)}:</span> {r.supervisor_approval_required ? t('reports.required', lang) : t('maint.notRequired', lang)}</div>
                <div><span className="font-semibold text-gray-700 dark:text-slate-300">{t('maint.hazardRadius', lang)}:</span> {r.hazard_radius_meters}m</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {safetyModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSafetyModal(null)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 dark:border-white/10 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('maint.safetyCheckIn', lang)}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{safetyModal.asset_name} — {safetyModal.location_name}</p>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-2 border border-amber-200 dark:border-amber-500/10">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('maint.requiredPPE', lang)}</h3>
              <ul className="space-y-1">
                {(safetyModal.required_ppe || []).map((p: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><CheckCircle size={14} className="text-green-500 dark:text-green-400" /> {p}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-500/10">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('maint.safetyInstr', lang)}</h3>
              <ul className="space-y-1">
                {(safetyModal.safety_instructions || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><ChevronRight size={14} className="text-blue-500 dark:text-blue-400" /> {s}</li>
                ))}
              </ul>
            </div>

            <div className="text-sm space-y-1 text-gray-700 dark:text-slate-300">
              <p><span className="font-semibold text-gray-500 dark:text-slate-400">Worker Safety Level:</span> {safetyModal.worker_safety_level}</p>
              <p><span className="font-semibold text-gray-500 dark:text-slate-400">Minimum Crew:</span> {safetyModal.minimum_crew}</p>
              <p><span className="font-semibold text-gray-500 dark:text-slate-400">{t('maint.supervisorApproval', lang)}:</span> {safetyModal.supervisor_approval_required ? t('maint.requiredBefore', lang) : t('maint.notRequired', lang)}</p>
              <p><span className="font-semibold text-gray-500 dark:text-slate-400">Status:</span> {safetyModal.safety_checklist_completed ? <span className="text-green-500 dark:text-green-400 font-medium">Completed</span> : <span className="text-amber-500 dark:text-amber-400 font-medium">Pending</span>}</p>
            </div>

            {!safetyModal.safety_checklist_completed && (
              <button onClick={() => handleSafetyComplete(safetyModal.id)} disabled={actionLoading === safetyModal.id} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading === safetyModal.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {t('maint.confirmChecklist', lang)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
