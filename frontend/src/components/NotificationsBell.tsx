'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { fetchMyNotifications, markNotificationRead } from '@/lib/auth-api';
import { cn, formatDate } from '@/lib/utils';

export default function NotificationsBell() {
  const { token, user } = useAppContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const unreadCount = items.filter(n => !n.read_at).length;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchMyNotifications(token);
      setItems(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !token) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (n: any) => {
    if (!n.read_at && token) {
      try {
        await markNotificationRead(token, n.id);
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      } catch (e) { console.error(e); }
    }
    if (n.report_id) {
      setOpen(false);
      router.push(`/maintenance?thread=${n.report_id}`);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-white/[0.06] dark:hover:bg-white/10 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#1a1640] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
            {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
          {items.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-xs text-gray-500 dark:text-slate-500">
              No notifications yet
            </div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {items.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                  !n.read_at && 'bg-blue-50/50 dark:bg-blue-500/5'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    n.read_at ? 'bg-gray-100 dark:bg-white/5' : 'bg-blue-100 dark:bg-blue-500/20'
                  )}>
                    <AlertTriangle size={14} className={n.read_at ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                    {n.message && (
                      <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    {n.reports?.location_name && (
                      <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin size={10} /> {n.reports.location_name}
                        {n.distance_meters != null && (
                          <span className="ml-1">· {(n.distance_meters / 1000).toFixed(2)} km</span>
                        )}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.read_at && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
