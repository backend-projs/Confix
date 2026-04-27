'use client';

import { useEffect, useState } from 'react';
import { fetchReports } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import {
  getRiskColor, getStatusColor, getVisibilityColor, formatDate,
  ASSET_TYPES, ISSUE_TYPES, STATUSES,
} from '@/lib/utils';
import { Search, X, Eye, ShieldBan, BellPlus, Loader2, Scan } from 'lucide-react';
import { t } from '@/lib/i18n';
import { notifyNearestWorker } from '@/lib/auth-api';

export default function ReportsPage() {
  const { selectedCompany, selectedRole, lang, user, token } = useAppContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ assetType: '', issueType: '', status: '', riskLevel: '', visibilityLevel: '' });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  const handleNotifyNearest = async () => {
    if (!selectedReport || !token) return;
    setNotifying(true);
    setNotifyResult(null);
    try {
      const result = await notifyNearestWorker(token, selectedReport.id);
      const km = (result.worker.distance_meters / 1000).toFixed(2);
      setNotifyResult(`Notification sent to ${result.worker.full_name} (${km} km away)`);
    } catch (err: any) {
      setNotifyResult(`Error: ${err.message}`);
    }
    setNotifying(false);
  };

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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-purple-100 dark:from-red-500/20 dark:to-purple-500/20 flex items-center justify-center mb-4">
          <ShieldBan size={36} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('reports.accessRestricted', lang)}</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md">
          {t('reports.accessMsg', lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] p-4 sm:p-6 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title', lang)}</h1>
          <p className="text-purple-600/60 dark:text-purple-300/70 text-xs sm:text-sm mt-1">{t('reports.subtitle', lang)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 items-center shadow-sm dark:shadow-none">
        <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('reports.searchPlaceholder', lang)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {[
          { key: 'assetType', label: 'Asset Type', opts: ASSET_TYPES },
          { key: 'issueType', label: 'Issue Type', opts: ISSUE_TYPES },
          { key: 'status', label: 'Status', opts: STATUSES },
          { key: 'riskLevel', label: 'Risk Level', opts: ['Low', 'Medium', 'High', 'Critical'] },
          { key: 'visibilityLevel', label: 'Visibility', opts: ['Internal', 'Restricted', 'Critical'] },
        ].map(f => (
          <select key={f.key} value={(filters as any)[f.key]} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} className="bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-2 py-2 text-xs sm:text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0">
            <option value="" className="bg-white dark:bg-slate-900">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o} className="bg-white dark:bg-slate-900">{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-purple-600 dark:text-purple-400 animate-pulse">{t('reports.loading', lang)}</div>
      ) : (
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 overflow-x-auto shadow-sm dark:shadow-none">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-white/5">
              <tr>
                {[t('reports.company',lang), 'Img', t('reports.asset',lang), t('reports.type',lang), t('reports.location',lang), t('reports.issue',lang), t('reports.impact',lang), t('reports.lklhd',lang), t('reports.score',lang), t('reports.risk',lang), t('reports.status',lang), t('reports.reviewed',lang), t('reports.created',lang), ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {reports.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => setSelectedReport(r)}>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400">{r.company_name}</td>
                  <td className="px-3 py-2.5">
                    {r.image_name ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                        <img 
                          src={`https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=100&name=${encodeURIComponent(r.image_name.split(',')[0].trim())}`}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                        <Scan size={12} className="text-gray-300 dark:text-slate-700" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-xs text-gray-900 dark:text-slate-200">{r.asset_name}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-500">{r.asset_type}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-500">{r.location_name}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-slate-300">{r.issue_type}</td>
                  <td className="px-3 py-2.5 text-xs text-center text-gray-500 dark:text-slate-400">{r.impact}</td>
                  <td className="px-3 py-2.5 text-xs text-center text-gray-500 dark:text-slate-400">{r.likelihood}</td>
                  <td className="px-3 py-2.5 text-xs text-center font-mono font-bold text-purple-600 dark:text-purple-400">{r.risk_matrix_score}</td>
                  <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span></td>
                  <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  <td className="px-3 py-2.5 text-xs text-center text-gray-500 dark:text-slate-400">{r.supervisor_reviewed ? '✓' : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-3 py-2.5"><Eye size={14} className="text-gray-400 dark:text-slate-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <div className="text-center py-8 text-gray-400 dark:text-slate-500">{t('reports.noResults', lang)}</div>}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedReport(null); setNotifyResult(null); }}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-4 border border-gray-200 dark:border-white/10 mx-2 sm:mx-0 shadow-xl" onClick={e => { e.stopPropagation(); }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedReport.asset_name}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{selectedReport.company_name} · {selectedReport.location_name}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.assetType', lang)}:</span> <span className="text-gray-800 dark:text-slate-200">{selectedReport.asset_type}</span></div>
              <div><span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.issueType', lang)}:</span> <span className="text-gray-800 dark:text-slate-200">{selectedReport.issue_type}</span></div>
              <div><span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.status', lang)}:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></div>
              <div><span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.visibility', lang)}:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVisibilityColor(selectedReport.visibility_level)}`}>{selectedReport.visibility_level}</span></div>
            </div>

            <div className="text-sm"><span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.descLabel', lang)}:</span><p className="mt-1 text-gray-700 dark:text-slate-300">{selectedReport.description}</p></div>

            {/* Photos Section */}
            {selectedReport.image_name && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('report.photos', lang) || 'Attached Photos'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedReport.image_name.split(',').map((name: string, i: number) => (
                    <div key={i} className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 shadow-sm">
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 text-center p-2 opacity-100 group-hover:opacity-0 transition-opacity">
                        {name.trim()}
                      </div>
                      <img 
                        src={`https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=400&name=${encodeURIComponent(name.trim())}`} 
                        alt="Report attachment" 
                        className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                        onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-medium border border-white/30">View Full</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notify Nearest Worker (admin/superadmin) */}
            {user && (user.role === 'admin' || user.role === 'superadmin') && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Dispatch Worker</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Send notification to the nearest worker by workplace location</p>
                  </div>
                  <button
                    onClick={handleNotifyNearest}
                    disabled={notifying}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {notifying ? <Loader2 size={14} className="animate-spin" /> : <BellPlus size={14} />}
                    Notify Nearest
                  </button>
                </div>
                {notifyResult && (
                  <p className={`text-xs ${notifyResult.startsWith('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                    {notifyResult}
                  </p>
                )}
              </div>
            )}

            {/* Safety */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 space-y-2 border border-amber-200 dark:border-amber-500/10">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('reports.safetyProtocol', lang)}</h3>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.requiredPPE', lang)}:</span> {(selectedReport.required_ppe || []).join(', ')}</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.safetyInstr', lang)}:</span> {(selectedReport.safety_instructions || []).join(', ')}</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.workerSafety', lang)}:</span> {selectedReport.worker_safety_level}</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.minCrew', lang)}:</span> {selectedReport.minimum_crew}</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.supervisorApproval', lang)}:</span> {selectedReport.supervisor_approval_required ? t('reports.required', lang) : t('reports.notRequired', lang)}</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.hazardRadius', lang)}:</span> {selectedReport.hazard_radius_meters}m</div>
              <div className="text-sm text-gray-700 dark:text-slate-300"><span className="font-medium text-gray-500 dark:text-slate-400">{t('reports.safetyChecklist', lang)}:</span> {selectedReport.safety_checklist_completed ? t('reports.completed', lang) + ' ✓' : t('reports.pending', lang)}</div>
            </div>

            {/* Coordinates */}
            <div className="text-sm">
              <span className="font-semibold text-gray-500 dark:text-slate-400">{t('reports.coordinates', lang)}:</span> {selectedReport.exact_coordinates_restricted ? <span className="text-red-500 dark:text-red-400 italic">{t('reports.restricted', lang)}</span> : <span className="text-gray-700 dark:text-slate-300">{selectedReport.latitude}, {selectedReport.longitude}</span>}
            </div>

            {/* Audit Trail */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">{t('reports.auditTrail', lang)}</h3>
              <div className="space-y-1">
                {(selectedReport.audit_trail || []).map((evt: any, i: number) => (
                  <div key={i} className="text-xs text-gray-500 dark:text-slate-400 flex gap-2">
                    <span className="text-gray-400 dark:text-slate-600 whitespace-nowrap">{new Date(evt.timestamp).toLocaleString()}</span>
                    <span>{evt.action}</span>
                    <span className="text-gray-400 dark:text-slate-600">— {evt.user}</span>
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
