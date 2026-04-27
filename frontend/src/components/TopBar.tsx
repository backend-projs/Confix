'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { COMPANIES, ROLES, cn } from '@/lib/utils';
import { t, LANG_OPTIONS } from '@/lib/i18n';
import {
  Gauge, PenLine, ClipboardList, HardHat, Globe2, BookLock,
  Building, UserCog, Mic, ScanEye, Menu, X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', tKey: 'nav.dashboard', icon: Gauge },
  { href: '/report', tKey: 'nav.newReport', icon: PenLine },
  { href: '/reports', tKey: 'nav.reports', icon: ClipboardList },
  { href: '/maintenance', tKey: 'nav.maintenance', icon: HardHat },
  { href: '/map', tKey: 'nav.map', icon: Globe2 },
  { href: '/voice-report', tKey: 'nav.voiceReport', icon: Mic },
  { href: '/analyze-image', tKey: 'nav.imageAnalysis', icon: ScanEye },
  { href: '/governance', tKey: 'nav.governance', icon: BookLock },
];

export default function TopBar() {
  const pathname = usePathname();
  const { selectedCompany, setSelectedCompany, selectedRole, setSelectedRole, lang, setLang } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] shadow-lg shadow-purple-950/20">
        <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mr-4 lg:mr-8 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Con<span className="text-purple-400">fix</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    active
                      ? 'bg-white/15 text-white shadow-inner shadow-purple-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={16} />
                  <span className="hidden xl:inline">{t(item.tKey, lang)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Selectors */}
          <div className="hidden lg:flex items-center gap-3">
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

          {/* Mobile: language flags + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5 border border-white/10">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'flex items-center px-1.5 py-1 rounded-md transition-all',
                    lang === l.code ? 'bg-purple-600/40' : 'opacity-50'
                  )}
                  aria-label={`Switch to ${l.label}`}
                >
                  <img src={l.flagUrl} alt={l.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#0f0c29] via-[#1a1640] to-[#0e0e1a] shadow-2xl shadow-purple-950/30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/5">
              <span className="text-white font-bold text-lg tracking-tight">
                Con<span className="text-purple-400">fix</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="px-3 py-3 space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <item.icon size={18} />
                    <span>{t(item.tKey, lang)}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile selectors */}
            <div className="px-4 py-4 mt-2 border-t border-white/5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                  <Building size={12} className="text-purple-400" /> Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full text-sm bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {COMPANIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                  <UserCog size={12} className="text-blue-400" /> Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-sm bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
