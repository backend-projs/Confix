'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { COMPANIES, ROLES, cn } from '@/lib/utils';
import { t, LANG_OPTIONS } from '@/lib/i18n';
import {
  Gauge, PenLine, ClipboardList, HardHat, Globe2, BookLock,
  Building, UserCog, Menu, X, Sun, Moon, ChevronDown, Mic, ScanEye,
  LogIn, LogOut, Shield, Users, FileText,
} from 'lucide-react';
import NotificationsBell from './NotificationsBell';

const baseNavItems = [
  { href: '/dashboard', tKey: 'nav.dashboard', icon: Gauge },
  { href: '/reports', tKey: 'nav.reports', icon: ClipboardList },
  { href: '/maintenance', tKey: 'nav.maintenance', icon: HardHat },
  { href: '/map', tKey: 'nav.map', icon: Globe2 },
  { href: '/governance', tKey: 'nav.governance', icon: BookLock },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCompany, setSelectedCompany, selectedRole, setSelectedRole, lang, setLang, theme, toggleTheme, user, logout } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

  // Close mobile menu and dropdown on route change
  useEffect(() => { setMobileOpen(false); setReportDropdownOpen(false); }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!reportDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-report-dropdown]')) setReportDropdownOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [reportDropdownOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Build nav items based on role
  const navItems = [...baseNavItems];
  // New Report dropdown is handled separately, not in navItems array
  if (user?.role === 'admin') {
    navItems.push({ href: '/admin/workers', tKey: 'nav.workers', icon: Users });
  }

  const showLegacySelectors = !user && pathname !== '/login';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:border-transparent dark:bg-gradient-to-r dark:from-[#0f0c29] dark:via-[#302b63] dark:to-[#24243e] shadow-sm dark:shadow-lg dark:shadow-purple-950/20 transition-colors">
        <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 max-w-[1440px] mx-auto w-full">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/login'} className="flex items-center gap-2 mr-4 lg:mr-8 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">
              Con<span className="text-purple-600 dark:text-purple-400">fix</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
            {user && (
              <>
                {/* New Report Dropdown */}
                <div className="relative" data-report-dropdown>
                  <button
                    onClick={() => setReportDropdownOpen(o => !o)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                      (pathname === '/report' || pathname === '/voice-report' || pathname === '/analyze-image')
                        ? 'bg-purple-50 text-purple-700 dark:bg-white/15 dark:text-white shadow-inner shadow-purple-500/10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                    )}
                  >
                    <PenLine size={16} />
                    <span className="hidden lg:inline">{t('nav.newReport', lang)}</span>
                    <ChevronDown size={14} className={cn('transition-transform', reportDropdownOpen && 'rotate-180')} />
                  </button>
                  {reportDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1a1640] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-purple-950/30 py-1 z-50">
                      <Link href="/report" onClick={() => setReportDropdownOpen(false)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm transition-colors', pathname === '/report' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <PenLine size={14} /> {t('nav.manualReport', lang)}
                      </Link>
                      <Link href="/voice-report" onClick={() => setReportDropdownOpen(false)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm transition-colors', pathname === '/voice-report' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <Mic size={14} /> {t('nav.voiceReport', lang)}
                      </Link>
                      <Link href="/analyze-image" onClick={() => setReportDropdownOpen(false)} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm transition-colors', pathname === '/analyze-image' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <ScanEye size={14} /> {t('nav.imageAnalysis', lang)}
                      </Link>
                    </div>
                  )}
                </div>
                {/* Other nav items */}
                {navItems.map((item: any) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                        active
                          ? 'bg-purple-50 text-purple-700 dark:bg-white/15 dark:text-white shadow-inner shadow-purple-500/10'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                      )}
                    >
                      <item.icon size={16} />
                      <span className="hidden lg:inline">{t(item.tKey, lang)}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Desktop Selectors */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language selector */}
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5 border border-gray-200 dark:border-white/10">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                    lang === l.code
                      ? 'bg-purple-600 text-white dark:bg-purple-600/40 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/5'
                  )}
                  aria-label={`Switch to ${l.label}`}
                >
                  <img src={l.flagUrl} alt={l.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            {showLegacySelectors && (
              <>
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-purple-600 dark:text-purple-400" />
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="text-xs bg-gray-100 border border-gray-200 text-gray-800 dark:bg-white/10 dark:border-white/10 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  >
                    {COMPANIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCog size={14} className="text-blue-600 dark:text-blue-400" />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="text-xs bg-gray-100 border border-gray-200 text-gray-800 dark:bg-white/10 dark:border-white/10 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{r}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {!user && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-500 transition-colors"
              >
                <LogIn size={14} />
                Sign In
              </Link>
            )}

            {/* Notifications Bell */}
            {user && <NotificationsBell />}

            {/* API Docs */}
            <a
              href="https://confix-jocy.onrender.com/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
              title="API Documentation"
            >
              <FileText size={14} />
              <span className="hidden xl:inline">API</span>
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/[0.06] dark:hover:bg-white/10 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Superadmin / Admin links - far right before logout */}
            {user?.role === 'superadmin' && (
              <Link
                href="/superadmin"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap border',
                  pathname === '/superadmin'
                    ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                <Shield size={14} />
                Superadmin
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin/workers"
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap border',
                  pathname === '/admin/workers'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                Admin
              </Link>
            )}

            {/* Sign Out Button - rightmost */}
            {user && (
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 dark:bg-white/[0.06] dark:hover:bg-red-500/20 dark:text-slate-300 dark:hover:text-red-400 transition-colors"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* Mobile: language flags + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5 border border-gray-200 dark:border-white/10">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'flex items-center px-1.5 py-1 rounded-md transition-all',
                    lang === l.code ? 'bg-purple-600 dark:bg-purple-600/40' : 'opacity-50'
                  )}
                  aria-label={`Switch to ${l.label}`}
                >
                  <img src={l.flagUrl} alt={l.label} className="w-5 h-3.5 object-cover rounded-[2px]" />
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
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
          <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gradient-to-b dark:from-[#0f0c29] dark:via-[#1a1640] dark:to-[#0e0e1a] shadow-2xl dark:shadow-purple-950/30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-white/5">
              <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">
                Con<span className="text-purple-600 dark:text-purple-400">fix</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="px-3 py-3 space-y-1">
              {user && (
                <>
                  {/* New Report Dropdown in Mobile */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400">
                      <PenLine size={18} />
                      <span>{t('nav.newReport', lang)}</span>
                    </div>
                    <div className="pl-8 space-y-1">
                      <Link href="/report" onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm', pathname === '/report' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <PenLine size={14} /> {t('nav.manualReport', lang)}
                      </Link>
                      <Link href="/voice-report" onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm', pathname === '/voice-report' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <Mic size={14} /> {t('nav.voiceReport', lang)}
                      </Link>
                      <Link href="/analyze-image" onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm', pathname === '/analyze-image' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5')}>
                        <ScanEye size={14} /> {t('nav.imageAnalysis', lang)}
                      </Link>
                    </div>
                  </div>
                  {/* Other nav items */}
                  {navItems.map((item: any) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                          active
                            ? 'bg-purple-50 text-purple-700 dark:bg-white/15 dark:text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                        )}
                      >
                        <item.icon size={18} />
                        <span>{t(item.tKey, lang)}</span>
                      </Link>
                    );
                  })}
                </>
              )}
              {!user && (
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}
              {/* API Docs - Mobile */}
              <a
                href="https://confix-jocy.onrender.com/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-all"
              >
                <FileText size={18} />
                <span>API Docs</span>
              </a>
            </nav>

            {/* Mobile selectors / signout */}
            <div className="px-4 py-4 mt-2 border-t border-gray-200 dark:border-white/5 space-y-4">
              {user && (
                <button
                  onClick={() => { logout(); router.push('/login'); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              )}
              {showLegacySelectors && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-500 font-medium flex items-center gap-1.5">
                      <Building size={12} className="text-purple-600 dark:text-purple-400" /> Company
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full text-sm bg-gray-100 border border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {COMPANIES.map((c) => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-500 font-medium flex items-center gap-1.5">
                      <UserCog size={12} className="text-blue-600 dark:text-blue-400" /> Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full text-sm bg-gray-100 border border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{r}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
