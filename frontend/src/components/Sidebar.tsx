'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FilePlus, FileText, Wrench, Map, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/report', label: 'New Report', icon: FilePlus },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/governance', label: 'Governance', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white dark:bg-slate-900 text-gray-900 dark:text-white flex flex-col z-40 border-r border-gray-200 dark:border-slate-700 transition-colors">
      <div className="p-5 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-cyan-600 dark:text-cyan-400">Con</span>fix
        </h1>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">
          Smart Field Reporting &amp; Safety Operations
        </p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-3 text-sm transition-colors',
                active
                  ? 'bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border-r-2 border-cyan-500 dark:border-cyan-400'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 text-[10px] text-gray-400 dark:text-slate-500">
        &copy; 2026 Confix Platform
      </div>
    </aside>
  );
}
