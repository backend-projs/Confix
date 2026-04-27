'use client';

import { useEffect, useState } from 'react';
import { fetchReports, fetchStats } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import { getRiskColor, formatDate } from '@/lib/utils';
import { t } from '@/lib/i18n';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import {
  AlertTriangle, FileText, ShieldAlert, HardHat, Radiation, ClipboardCheck, UserCheck, Activity,
  LayoutGrid, ArrowUpRight, Map as MapIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});

const RISK_SHADES = ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'];
const TOOLTIP_STYLE_DARK = { background: '#1a1a2e', border: 'none', borderRadius: 10, color: '#c4b5fd', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,.4)' };
const TOOLTIP_STYLE_LIGHT = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' };

export default function DashboardPage() {
  const { selectedCompany, lang, theme } = useAppContext();
  const TOOLTIP_STYLE = theme === 'dark' ? TOOLTIP_STYLE_DARK : TOOLTIP_STYLE_LIGHT;
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCompany !== 'all') params.tenantId = selectedCompany;
        const [s, r] = await Promise.all([fetchStats(), fetchReports(params)]);
        setStats(s);
        setReports(r);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [selectedCompany]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-600 dark:text-purple-400/60 text-sm animate-pulse">{t('dashboard.loading', lang)}</div></div>;
  if (!stats) return <div className="text-red-500 dark:text-red-400">{t('dashboard.failed', lang)}</div>;

  const filtered = selectedCompany === 'all' ? reports : reports.filter((r: any) => r.tenant_id === selectedCompany);
  const topPriority = [...filtered].sort((a, b) => b.risk_matrix_score - a.risk_matrix_score).slice(0, 5);
  const recent = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const statCards = [
    { label: t('dashboard.totalReports', lang), value: stats.totalReports, icon: FileText },
    { label: t('dashboard.critical', lang), value: stats.criticalReports, icon: AlertTriangle },
    { label: t('dashboard.highRisk', lang), value: stats.highRiskReports, icon: ShieldAlert },
    { label: t('dashboard.maintenance', lang), value: stats.pendingMaintenance, icon: HardHat },
    { label: t('dashboard.hazardZones', lang), value: stats.activeHazardZones, icon: Radiation },
    { label: t('dashboard.safetyPending', lang), value: stats.safetyChecklistsPending, icon: ClipboardCheck },
    { label: t('dashboard.reviews', lang), value: stats.supervisorReviewsPending, icon: UserCheck },
    { label: t('dashboard.avgScore', lang), value: stats.averageRiskMatrixScore, icon: Activity },
  ];

  const trendData = (stats.statusDistribution || []).map((d: any) => ({ ...d, value: d.count }));

  return (
    <div className="space-y-5">
      {/* Hero — compact */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#2d1b69] dark:to-[#0f172a] px-4 py-4 sm:px-7 sm:py-5 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-white/[0.06] flex items-center justify-center">
            <LayoutGrid size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title', lang)}</h1>
            <p className="text-purple-600/50 dark:text-purple-300/50 text-xs">{t('dashboard.subtitle', lang)}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards — monochrome purple gradient */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {statCards.map((s, i) => (
          <div key={s.label} className="rounded-xl bg-white dark:bg-[#16162a] border border-gray-200 dark:border-white/[0.04] p-4 group hover:border-purple-300 dark:hover:border-purple-500/10 transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">{s.label}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/[0.06] flex items-center justify-center">
                <s.icon size={15} className="text-purple-600 dark:text-purple-400/60" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: charts 2-col + list 1-col */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Risk Donut */}
        <div className="lg:col-span-3 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 flex flex-col h-[280px] shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.riskDistribution', lang)}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.riskDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={76} paddingAngle={3} strokeWidth={0}>
                  {stats.riskDistribution.map((_: any, i: number) => (
                    <Cell key={i} fill={RISK_SHADES[i % RISK_SHADES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {(stats.riskDistribution || []).map((d: any, i: number) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-500">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_SHADES[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Reports by Company — bar */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 flex flex-col h-[280px] shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.reportsByCompany', lang)}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.reportsByCompany} barCategoryGap="25%" margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(139,92,246,0.04)' }} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Priority list */}
        <div className="lg:col-span-4 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle size={12} /> {t('dashboard.highestPriority', lang)}</h3>
          <div className="space-y-1.5">
            {topPriority.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-gray-400 dark:text-slate-600 w-3">{i + 1}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-slate-300">{r.asset_name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-600">{r.company_name}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: area + asset breakdown + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Status area chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 flex flex-col h-[280px] shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.statusOverview', lang)}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#areaGrad)" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6', stroke: '#16162a', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#a78bfa', stroke: '#16162a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset breakdown — horizontal bar */}
        <div className="lg:col-span-3 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 flex flex-col h-[280px] shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-2">{t('dashboard.assetTypes', lang)}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.assetTypeBreakdown} layout="vertical" barCategoryGap="20%" margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#475569' }} width={85} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(139,92,246,0.04)' }} />
                <defs>
                  <linearGradient id="hBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#hBarGrad)" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="lg:col-span-4 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><ArrowUpRight size={12} /> {t('dashboard.latestReports', lang)}</h3>
          <div className="space-y-1.5">
            {recent.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-slate-300">{r.asset_name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-600">{r.issue_type} · {r.location_name}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${getRiskColor(r.risk_level)}`}>{r.risk_level}</span>
                  <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">{formatDate(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Infrastructure Map */}
      <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/[0.04] p-4 sm:p-5 shadow-sm dark:shadow-none">
        <h3 className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><MapIcon size={12} /> {t('dashboard.infrastructureMap', lang) || 'Infrastructure Map'}</h3>
        <div className="h-[320px] rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.04]">
          <MapView reports={filtered} onSelect={() => {}} />
        </div>
      </div>
    </div>
  );
}
