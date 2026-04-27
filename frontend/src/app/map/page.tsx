'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchReports } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import { getRiskColor, getStatusColor, formatDate, getRiskLevel, cn } from '@/lib/utils';
import { MapPin, X, List, ChevronDown } from 'lucide-react';
import { t } from '@/lib/i18n';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-gray-400">Loading map...</div> });

export default function MapPage() {
  const { selectedCompany, lang } = useAppContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCompany !== 'all') params.tenantId = selectedCompany;
        const data = await fetchReports(params);
        setReports(data.filter((r: any) => r.latitude && r.longitude));
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [selectedCompany]);

  // Auto-open panel on mobile when selecting a report
  const handleSelect = (r: any) => {
    setSelected(r);
    setPanelOpen(true);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a] p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white"><MapPin size={22} /> {t('map.title', lang)}</h1>
          <p className="text-purple-300/70 text-xs sm:text-sm mt-1">{t('map.subtitle', lang)}</p>
        </div>
      </div>

      {/* Desktop: side-by-side | Mobile: stacked with toggle */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:h-[calc(100vh-250px)]">
        <div className="relative z-0 bg-[#16162a] rounded-xl border border-white/5 overflow-hidden h-[60vh] sm:h-[65vh] lg:flex-1 lg:h-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-purple-400 animate-pulse">{t('map.loading', lang)}</div>
          ) : (
            <MapView reports={reports} onSelect={handleSelect} focusReport={selected} />
          )}
        </div>

        {/* Mobile panel toggle button */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="lg:hidden flex items-center justify-between w-full px-4 py-2.5 bg-[#16162a] rounded-xl border border-white/5 text-sm text-slate-300"
        >
          <span className="flex items-center gap-2">
            <List size={16} className="text-purple-400" />
            {selected ? selected.asset_name : `${t('map.allReports', lang)} (${reports.length})`}
          </span>
          <ChevronDown size={16} className={cn('transition-transform', panelOpen && 'rotate-180')} />
        </button>

        {/* Side panel: always visible on desktop, toggle on mobile */}
        <div className={cn(
          'lg:w-80 bg-[#16162a] rounded-xl border border-white/5 p-4 overflow-y-auto transition-all',
          panelOpen ? 'max-h-[60vh]' : 'max-h-0 lg:max-h-none overflow-hidden p-0 lg:p-4 border-transparent lg:border-white/5'
        )}>
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm text-white">{selected.asset_name}</h3>
                <button onClick={() => { setSelected(null); setPanelOpen(false); }} className="text-slate-500 hover:text-white"><X size={16} /></button>
              </div>
              <p className="text-xs text-slate-500">{selected.company_name} · {selected.location_name}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRiskColor(selected.risk_level)}`}>{selected.risk_level}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(selected.status)}`}>{selected.status}</span>
              </div>
              <div className="text-xs space-y-1 text-slate-400">
                <p><span className="font-semibold text-slate-300">{t('map.issue', lang)}:</span> {selected.issue_type}</p>
                <p><span className="font-semibold text-slate-300">{t('map.assetType', lang)}:</span> {selected.asset_type}</p>
                <p><span className="font-semibold text-slate-300">{t('map.impact', lang)}:</span> {['', 'Minor', 'Moderate', 'Serious', 'Major', 'Critical'][selected.impact] || selected.impact}</p>
                <p><span className="font-semibold text-slate-300">{t('map.likelihood', lang)}:</span> {['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'][selected.likelihood] || selected.likelihood}</p>
                <p><span className="font-semibold text-slate-300">{t('map.hazardRadius', lang)}:</span> {selected.hazard_radius_meters}m</p>
                <p><span className="font-semibold text-slate-300">{t('map.minCrew', lang)}:</span> {selected.minimum_crew}</p>
                <p><span className="font-semibold text-slate-300">{t('map.ppe', lang)}:</span> {(selected.required_ppe || []).join(', ')}</p>
              </div>
              <p className="text-xs text-slate-400">{selected.description}</p>
              <p className="text-xs text-slate-600">Created {formatDate(selected.created_at)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-slate-300">{t('map.allReports', lang)} ({reports.length})</h3>
              <div className="space-y-2">
                {reports.map((r: any) => (
                  <div key={r.id} onClick={() => handleSelect(r)} className="p-2 rounded-lg border border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200">{r.asset_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{r.location_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#16162a] rounded-xl border border-white/5 p-3 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">{t('map.riskLevel', lang)}:</span>
        {['Low', 'Medium', 'High', 'Critical'].map(level => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level === 'Low' ? '#22c55e' : level === 'Medium' ? '#eab308' : level === 'High' ? '#f97316' : '#ef4444' }} />
            <span>{level}</span>
          </div>
        ))}
        <span className="text-slate-600">{t('map.dashedCircles', lang)}</span>
      </div>
    </div>
  );
}
