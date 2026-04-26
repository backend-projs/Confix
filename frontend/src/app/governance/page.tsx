'use client';

import {
  Shield, Lock, Users, Eye, ScrollText, Database, Globe, Server,
  AlertTriangle, Fingerprint, KeyRound, FileCheck,
} from 'lucide-react';

export default function GovernancePage() {
  const sections = [
    {
      title: 'Multi-Tenant Data Separation',
      icon: Users,
      desc: 'Each company division operates as an isolated tenant. Data is logically separated via tenant_id. Holding executives can view aggregated data, while company-level users only see their own division.',
      items: ['Tenant-scoped queries', 'No cross-tenant data leakage', 'Division-level filtering'],
    },
    {
      title: 'Role-Based Access Simulation',
      icon: KeyRound,
      desc: 'The platform simulates role-based access control (RBAC) with four levels: Field Engineer, Supervisor, Company Admin, and Holding Executive. Each role has different visibility permissions.',
      items: ['Field Engineers: Create reports, view own data', 'Supervisors: Review, approve, and escalate', 'Company Admin: Full company access', 'Holding Executive: Cross-company overview'],
    },
    {
      title: 'Audit Trail',
      icon: ScrollText,
      desc: 'Every significant action is recorded in a tamper-evident audit trail stored as JSONB. This provides a complete chain of custody for every report.',
      items: ['Timestamped entries', 'User attribution', 'Action type logging', 'Immutable history'],
    },
    {
      title: 'Data Visibility & Classification',
      icon: Eye,
      desc: 'Reports are classified by visibility level — Internal, Restricted, or Critical. Critical-level data has additional access restrictions and coordinate masking.',
      items: ['Visibility-based access control', 'GPS coordinate masking for critical reports', 'Sensitive data flagging', 'Governance-compliant data sharing'],
    },
    {
      title: 'Human-led Risk Assessment',
      icon: AlertTriangle,
      desc: 'AI does not determine final risk. The Risk Matrix is engineer-reviewed: Impact (1-5) × Likelihood (1-5). AI provides suggestions only — final classification is always human.',
      items: ['Engineer reviews every risk score', 'AI suggestions are advisory only', 'No autonomous risk determination', 'Audit trail records who set the risk'],
    },
    {
      title: 'Worker Safety Protocol',
      icon: Shield,
      desc: 'Worker safety rules are derived from asset type and risk level. Mandatory PPE, minimum crew sizes, and supervisor approval requirements are enforced before maintenance begins.',
      items: ['Risk-based PPE requirements', 'Minimum crew size enforcement', 'Supervisor approval gates', 'Hazard zone radius definition'],
    },
    {
      title: 'Data Sovereignty',
      icon: Globe,
      desc: 'All data is stored in Supabase PostgreSQL in a defined region. No data leaves the primary database without explicit export. Data residency requirements are respected.',
      items: ['Regional data storage', 'No third-party data sharing', 'Encrypted at rest and in transit', 'Compliant with local data regulations'],
    },
    {
      title: 'Infrastructure Security',
      icon: Server,
      desc: 'The platform uses Row Level Security (RLS) in PostgreSQL, environment-based secrets management, and HTTPS for all communications.',
      items: ['Row Level Security (RLS)', 'Environment variable secrets', 'CORS protection', 'No hardcoded credentials'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1145] via-[#302b63] to-[#0f172a] p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white"><Shield size={24} /> Data Governance & Digital Trust</h1>
          <p className="text-purple-300/70 text-sm mt-1">
            How Confix ensures data integrity, privacy, compliance, and ethical AI usage in critical infrastructure operations.
          </p>
        </div>
      </div>

      <div className="bg-indigo-950/30 border border-indigo-500/15 rounded-xl p-4 flex items-start gap-3">
        <Fingerprint size={20} className="text-indigo-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-300">Ethical AI Commitment</p>
          <p className="text-sm text-slate-400">
            Confix uses AI as an advisory tool only. Risk classification, safety protocols, and operational decisions
            are always engineer-reviewed. The platform is designed for human-led governance with AI assistance — never AI autonomy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((s) => (
          <div key={s.title} className="bg-[#16162a] rounded-xl border border-white/5 p-5 space-y-3 hover:border-purple-500/20 transition-colors">
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
