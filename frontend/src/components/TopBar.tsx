'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { COMPANIES, ROLES, cn } from '@/lib/utils';
import { t, LANG_OPTIONS } from '@/lib/i18n';
import {
  Gauge, PenLine, ClipboardList, HardHat, Globe2, BookLock,
  Building, UserCog, Mic,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', tKey: 'nav.dashboard', icon: Gauge },
  { href: '/report', tKey: 'nav.newReport', icon: PenLine },
  { href: '/reports', tKey: 'nav.reports', icon: ClipboardList },
  { href: '/maintenance', tKey: 'nav.maintenance', icon: HardHat },
  { href: '/map', tKey: 'nav.map', icon: Globe2 },
  { href: '/voice-report', tKey: 'nav.voiceReport', icon: Mic },
  { href: '/governance', tKey: 'nav.governance', icon: BookLock },
];

export default function TopBar() {
  const pathname = usePathname();
  const { selectedCompany, setSelectedCompany, selectedRole, setSelectedRole, lang, setLang } = useAppContext();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] shadow-lg shadow-purple-950/20">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Con<span className="text-purple-400">fix</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-white/15 text-white shadow-inner shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={16} />
                <span className="hidden lg:inline">{t(item.tKey, lang)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Selectors */}
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5 border border-white/10">
            {LANG_OPTIONS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                  lang === l.code
                    ? 'bg-purple-600/40 text-white shadow-sm'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                )}
                aria-label={`Switch to ${l.label}`}
              >
                <img src={l.flagUrl} alt={l.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Building size={14} className="text-purple-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="text-xs bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
            >
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCog size={14} className="text-blue-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
