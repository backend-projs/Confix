'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { COMPANIES, ROLES, cn } from '@/lib/utils';
import {
  Gauge, PenLine, ClipboardList, HardHat, Globe2, BookLock,
  Building, UserCog,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/report', label: 'New Report', icon: PenLine },
  { href: '/reports', label: 'Reports', icon: ClipboardList },
  { href: '/maintenance', label: 'Maintenance', icon: HardHat },
  { href: '/map', label: 'Map', icon: Globe2 },
  { href: '/governance', label: 'Governance', icon: BookLock },
];

export default function TopBar() {
  const pathname = usePathname();
  const { selectedCompany, setSelectedCompany, selectedRole, setSelectedRole } = useAppContext();

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
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Selectors */}
        <div className="flex items-center gap-3">
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
