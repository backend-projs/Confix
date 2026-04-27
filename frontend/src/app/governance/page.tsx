'use client';

import {
  Shield, Lock, Users, Eye, ScrollText, Database, Globe, Server,
  AlertTriangle, Fingerprint, KeyRound, FileCheck,
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a] p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white"><Shield size={22} /> {t('gov.title', lang)}</h1>
          <p className="text-purple-300/70 text-xs sm:text-sm mt-1">
            {t('gov.subtitle', lang)}
          </p>
        </div>
      </div>

      <div className="bg-indigo-950/30 border border-indigo-500/15 rounded-xl p-4 flex items-start gap-3">
        <Fingerprint size={20} className="text-indigo-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-300">{t('gov.ethicalAI', lang)}</p>
          <p className="text-sm text-slate-400">
            {t('gov.ethicalAIDesc', lang)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
        {sections.map((s) => (
          <div key={s.title} className="bg-[#16162a] rounded-xl border border-white/5 p-4 sm:p-5 space-y-3 hover:border-purple-500/20 transition-colors">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-2 rounded-lg"><s.icon size={18} className="text-purple-400" /></div>
              <h3 className="font-semibold text-white">{s.title}</h3>
            </div>
            <p className="text-sm text-slate-400">{s.desc}</p>
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
