'use client';

import {
  Shield, ShieldCheck, Lock, Users, Eye, ScrollText, Database, Globe, Server,
  AlertTriangle, Fingerprint, KeyRound, FileCheck, FileText,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/lib/i18n';

export default function GovernancePage() {
  const { lang } = useAppContext();
  const sections = [
    {
      title: t('gov.multiTenant', lang),
      icon: Users,
      desc: t('gov.multiTenantDesc', lang),
      items: ['Tenant-scoped queries', 'No cross-tenant data leakage', 'Division-level filtering'],
    },
    {
      title: t('gov.rbac', lang),
      icon: KeyRound,
      desc: t('gov.rbacDesc', lang),
      items: ['Field Engineers: Create reports, view own data', 'Supervisors: Review, approve, and escalate', 'Company Admin: Full company access', 'Holding Executive: Cross-company overview'],
    },
    {
      title: t('gov.audit', lang),
      icon: ScrollText,
      desc: t('gov.auditDesc', lang),
      items: ['Timestamped entries', 'User attribution', 'Action type logging', 'Immutable history'],
    },
    {
      title: t('gov.visibility', lang),
      icon: Eye,
      desc: t('gov.visibilityDesc', lang),
      items: ['Visibility-based access control', 'GPS coordinate masking for critical reports', 'Sensitive data flagging', 'Governance-compliant data sharing'],
    },
    {
      title: t('gov.humanRisk', lang),
      icon: AlertTriangle,
      desc: t('gov.humanRiskDesc', lang),
      items: ['Engineer reviews every risk score', 'AI suggestions are advisory only', 'No autonomous risk determination', 'Audit trail records who set the risk'],
    },
    {
      title: t('gov.workerSafety', lang),
      icon: Shield,
      desc: t('gov.workerSafetyDesc', lang),
      items: ['Risk-based PPE requirements', 'Minimum crew size enforcement', 'Supervisor approval gates', 'Hazard zone radius definition'],
    },
    {
      title: t('gov.dataSovereignty', lang),
      icon: Globe,
      desc: t('gov.dataSovereigntyDesc', lang),
      items: ['Regional data storage', 'No third-party data sharing', 'Encrypted at rest and in transit', 'Compliant with local data regulations'],
    },
    {
      title: t('gov.infraSecurity', lang),
      icon: Server,
      desc: t('gov.infraSecurityDesc', lang),
      items: ['Row Level Security (RLS)', 'Environment variable secrets', 'CORS protection', 'No hardcoded credentials'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] p-4 sm:p-6 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><ShieldCheck size={22} /> {t('gov.title', lang)}</h1>
          <p className="text-purple-600/60 dark:text-purple-300/70 text-xs sm:text-sm mt-1">{t('gov.subtitle', lang)}</p>
        </div>
      </div>

      <div className="bg-indigo-950/30 border border-indigo-500/15 rounded-xl p-4 flex items-start gap-3">
        <Fingerprint size={20} className="text-indigo-400 mt-0.5" />
        <div>
          <div className="text-center py-12 text-purple-600 dark:text-purple-400 animate-pulse">{t('gov.loading', lang)}</div>
          <p className="text-sm text-slate-400">{t('gov.ethicalAIDesc', lang)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
        {sections.map((s) => (
          <div key={s.title} className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-500/20 transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mt-0.5"><FileText size={16} className="text-indigo-600 dark:text-indigo-400" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {s.items.map((item, i) => (
                <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                  <FileCheck size={12} className="text-green-400 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
