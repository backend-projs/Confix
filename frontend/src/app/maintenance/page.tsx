'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import {
  fetchThreads,
  fetchThreadMessages,
  postThreadMessage,
  resolveThread,
  reopenThread,
  fetchThreadAiSuggestion,
} from '@/lib/auth-api';
import { getRiskColor, formatDate, cn } from '@/lib/utils';
import {
  Wrench, Send, Sparkles, X, CheckCircle2, RotateCcw, Search, MessageSquare,
  ArrowLeft, Loader2, Clock, User as UserIcon, Hash, Image as ImageIcon,
} from 'lucide-react';

interface Thread {
  id: string;
  asset_name: string;
  asset_type: string;
  issue_type: string;
  description: string;
  location_name: string;
  risk_level: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  assigned_worker_id: string | null;
  reported_by: string | null;
  assigned_worker?: { id: string; full_name: string; worker_type: string; position: string } | null;
  reporter?: { id: string; full_name: string; worker_type: string; position: string } | null;
  latest_message?: { id: string; body: string; sender_role: string; created_at: string; is_system: boolean } | null;
  message_count?: number;
  image_name?: string | null;
}

function relativeTime(date: string | null | undefined) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(date);
}

function isResolved(t: Thread) {
  return t.status === 'resolved' || !!t.resolved_at;
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function MaintenancePage() {
  const { token } = useAppContext();
  const searchParams = useSearchParams();
  const initialThread = searchParams.get('thread');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(initialThread);
  const [search, setSearch] = useState('');
  const [showResolved, setShowResolved] = useState(true);

  const loadThreads = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchThreads(token);
      setThreads(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    loadThreads();
    const interval = setInterval(loadThreads, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const activeThread = useMemo(() => threads.find(t => t.id === activeId) || null, [threads, activeId]);

  const filtered = useMemo(() => {
    let list = threads;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        t.asset_name?.toLowerCase().includes(q) ||
        t.issue_type?.toLowerCase().includes(q) ||
        t.location_name?.toLowerCase().includes(q)
      );
    }
    if (!showResolved) list = list.filter(t => !isResolved(t));
    return list;
  }, [threads, search, showResolved]);

  const activeCount = threads.filter(t => !isResolved(t)).length;
  const resolvedCount = threads.filter(t => isResolved(t)).length;

  return (
    <div className="space-y-3">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] px-4 py-4 sm:px-6 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-white/[0.06] flex items-center justify-center">
              <Wrench size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Maintenance Threads
              </h1>
              <p className="text-purple-600/60 dark:text-purple-300/60 text-xs">Forum-style chat per incident · live AI assist</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-600 dark:text-slate-400"><b className="text-gray-900 dark:text-white">{activeCount}</b> active</span>
            <span className="text-gray-400 dark:text-slate-600"><b>{resolvedCount}</b> resolved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[70vh]">
        {/* Thread List */}
        <div className={cn(
          'lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden',
          activeThread && 'hidden lg:flex'
        )}>
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200 dark:border-white/5 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search threads..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={e => setShowResolved(e.target.checked)}
                className="rounded accent-purple-600"
              />
              Show resolved
            </label>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
            {loading && (
              <div className="flex items-center justify-center py-10 text-purple-600 dark:text-purple-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 px-4 text-sm text-gray-500 dark:text-slate-500">
                <MessageSquare size={28} className="mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                No threads match your filters.
              </div>
            )}
            {filtered.map(t => {
              const resolved = isResolved(t);
              const reporter = t.reporter;
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors block',
                    isActive && 'bg-purple-50/60 dark:bg-purple-500/10',
                    resolved && 'opacity-50 grayscale'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white',
                      resolved ? 'bg-gray-400 dark:bg-slate-700' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    )}>
                      {getInitials(reporter?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Hash size={11} className="text-gray-400 dark:text-slate-600" />
                        <span className={cn('text-sm truncate', resolved ? 'font-medium text-gray-500 dark:text-slate-500' : 'font-bold text-gray-900 dark:text-white')}>
                          {t.asset_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {t.issue_type} · {t.location_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-medium border',
                          resolved ? 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10' : getRiskColor(t.risk_level)
                        )}>
                          {t.risk_level}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/10">
                          {t.asset_type}
                        </span>
                        {resolved && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-500 border border-gray-200 dark:border-white/10">
                            ✓ resolved
                          </span>
                        )}
                      </div>
                      {t.latest_message?.body && (
                        <p className={cn('text-[11px] mt-1.5 line-clamp-1', resolved ? 'text-gray-400 dark:text-slate-600' : 'text-gray-600 dark:text-slate-400')}>
                          <span className="font-medium">{t.latest_message.is_system ? 'system' : t.latest_message.sender_role}:</span> {t.latest_message.body}
                        </p>
                      )}
                      <div className="flex items-center gap-2.5 mt-1.5 text-[10px] text-gray-400 dark:text-slate-600">
                        <span className="flex items-center gap-0.5"><MessageSquare size={10} /> {t.message_count || 0}</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {relativeTime(t.latest_message?.created_at || t.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Thread / Chat */}
        <div className={cn(
          'lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden min-h-[60vh]',
          !activeThread && 'hidden lg:flex'
        )}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mb-3">
                <MessageSquare size={26} className="text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Select a thread</h3>
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-1 max-w-xs">
                Choose an incident on the left to open its discussion thread with workers and admins.
              </p>
            </div>
          ) : (
            <ThreadChatView
              key={activeThread.id}
              thread={activeThread}
              onBack={() => setActiveId(null)}
              onUpdated={loadThreads}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Chat View ────────────────────── */

function ThreadChatView({ thread, onBack, onUpdated }: { thread: Thread; onBack: () => void; onUpdated: () => void }) {
  const { token, user } = useAppContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [chatImage, setChatImage] = useState<{ file: File; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const resolved = isResolved(thread);

  const loadMessages = async () => {
    if (!token) return;
    try {
      const data = await fetchThreadMessages(token, thread.id);
      setMessages(data);
    } catch (e) { console.error(e); }
    setLoadingMessages(false);
  };

  const loadAi = async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const data = await fetchThreadAiSuggestion(token, thread.id);
      setAiSuggestion(data);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  useEffect(() => {
    setMessages([]);
    setLoadingMessages(true);
    setAiDismissed(false);
    loadMessages();
    loadAi();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || !token) return;
    setSending(true);
    try {
      // Simulate image upload by using Unsplash for the demo if an image was picked
      let attachment_url = undefined;
      if (chatImage) {
        attachment_url = `https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400&name=${encodeURIComponent(chatImage.file.name)}`;
      }

      const msg = await postThreadMessage(token, thread.id, draft.trim(), attachment_url);
      setMessages(prev => [...prev, msg]);
      setDraft('');
      setChatImage(null);
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    }
    setSending(false);
  };

  const handleApplyAiSolution = () => {
    if (!aiSuggestion?.suggestion) return;
    setDraft(prev => (prev ? `${prev}\n\n` : '') + `Trying suggested solution: ${aiSuggestion.suggestion}`);
  };

  const handleResolve = async () => {
    if (!token) return;
    setResolving(true);
    try {
      await resolveThread(token, thread.id, resolveNotes.trim() || undefined);
      setShowResolveBox(false);
      setResolveNotes('');
      onUpdated();
      await loadMessages();
    } catch (err: any) {
      alert(err.message);
    }
    setResolving(false);
  };

  const handleReopen = async () => {
    if (!token) return;
    try {
      await reopenThread(token, thread.id);
      onUpdated();
      await loadMessages();
    } catch (err: any) { alert(err.message); }
  };

  const canResolve = !!user && (user.role === 'admin' || user.role === 'superadmin' || user.id === thread.assigned_worker_id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-white/5 flex items-start gap-3">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-slate-400">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Hash size={14} className="text-gray-400 dark:text-slate-600" />
            <h2 className={cn('font-bold text-gray-900 dark:text-white truncate', resolved && 'opacity-60')}>{thread.asset_name}</h2>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium border', resolved ? 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10' : getRiskColor(thread.risk_level))}>
              {thread.risk_level}
            </span>
            {resolved && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                ✓ Resolved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {thread.issue_type} · {thread.location_name} · opened {relativeTime(thread.created_at)}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">
            {thread.reporter && (
              <span className="flex items-center gap-1"><UserIcon size={10} className="text-amber-500" /> Reporter: <b className="text-gray-700 dark:text-slate-300">{thread.reporter.full_name}</b> {thread.reporter.worker_type && <span className="text-gray-400">({thread.reporter.worker_type})</span>}</span>
            )}
            {thread.assigned_worker && (
              <span className="flex items-center gap-1"><UserIcon size={10} className="text-purple-500" /> Assigned: <b className="text-gray-700 dark:text-slate-300">{thread.assigned_worker.full_name}</b></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canResolve && !resolved && (
            <button
              onClick={() => setShowResolveBox(s => !s)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-500 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={13} /> Mark Resolved
            </button>
          )}
          {canResolve && resolved && (
            <button
              onClick={handleReopen}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} /> Reopen
            </button>
          )}
        </div>
      </div>

      {/* Resolve box */}
      {showResolveBox && !resolved && (
        <div className="px-3 sm:px-4 py-3 bg-green-50/60 dark:bg-green-500/5 border-b border-green-200 dark:border-green-500/20 space-y-2">
          <p className="text-xs text-green-800 dark:text-green-300 font-medium">
            What did you do to fix it? (Saved for AI to suggest in future similar incidents.)
          </p>
          <textarea
            value={resolveNotes}
            onChange={e => setResolveNotes(e.target.value)}
            rows={2}
            placeholder="e.g., Replaced regulator on panel B and tightened cable conduit."
            className="w-full bg-white dark:bg-[#0f0f1f] border border-green-200 dark:border-green-500/30 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowResolveBox(false); setResolveNotes(''); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10">
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-1.5"
            >
              {resolving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm Resolved
            </button>
          </div>
        </div>
      )}

      {/* Messages stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
        {/* AI Suggestion banner */}
        {!aiDismissed && (
          <AiSuggestionBanner
            loading={aiLoading}
            data={aiSuggestion}
            onDismiss={() => setAiDismissed(true)}
            onApply={handleApplyAiSolution}
            disabled={resolved}
          />
        )}

        {/* Original report message */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {getInitials(thread.reporter?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{thread.reporter?.full_name || 'Reporter'}</span>
              {thread.reporter?.worker_type && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-medium">
                  {thread.reporter.worker_type}
                </span>
              )}
              <span className="text-[10px] text-gray-400 dark:text-slate-600">{relativeTime(thread.created_at)}</span>
            </div>
            <div className="mt-1 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-white/[0.03] rounded-xl rounded-tl-sm px-3 py-2 border border-gray-200 dark:border-white/5">
              <p className="font-medium text-gray-900 dark:text-white mb-1">{thread.issue_type} reported at {thread.location_name}</p>
              <p>{thread.description || 'No description provided.'}</p>
              
              {/* Photo Evidence Section */}
              {thread.image_name && (
                <div className="mt-3 space-y-2 pt-2 border-t border-gray-200 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-1">
                    <ImageIcon size={10} /> Photo Evidence
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {thread.image_name.split(',').map((name, i) => (
                      <div key={i} className="group relative w-24 aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                        <img 
                          src={`https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=300&name=${encodeURIComponent(name.trim())}`}
                          alt="Evidence"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[8px] font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-1 rounded border border-white/30">Zoom</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat messages */}
        {loadingMessages && (
          <div className="text-center py-4 text-xs text-gray-400"><Loader2 size={14} className="inline animate-spin" /></div>
        )}
        {messages.map(m => (
          <ChatMessage key={m.id} message={m} currentUserId={user?.id} />
        ))}

        {resolved && thread.resolution_notes && (
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-3 py-2.5 text-xs text-green-800 dark:text-green-300">
            <p className="font-semibold mb-1 flex items-center gap-1.5"><CheckCircle2 size={12} /> Resolution notes</p>
            <p>{thread.resolution_notes}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-white/5 p-3 flex items-end gap-2">
        <button
          type="button"
          onClick={() => chatImageInputRef.current?.click()}
          className={cn(
            "p-2 rounded-lg transition-colors",
            chatImage ? "text-purple-600 bg-purple-50 dark:bg-purple-500/20" : "text-gray-400 dark:text-slate-600 hover:bg-gray-100 dark:hover:bg-white/5"
          )}
          title="Attach photo"
        >
          <ImageIcon size={16} />
        </button>
        <input 
          ref={chatImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setChatImage({ file, preview: URL.createObjectURL(file) });
          }}
        />
        {chatImage && (
          <div className="absolute bottom-full mb-2 left-4 group">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg">
              <img src={chatImage.preview} alt="upload preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setChatImage(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          disabled={resolved}
          placeholder={resolved ? 'Thread resolved — reopen to send messages' : `Reply to #${thread.asset_name}...`}
          className="flex-1 resize-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-32"
        />
        <button
          type="submit"
          disabled={sending || resolved || !draft.trim()}
          className="p-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}

/* ────────────────────── Chat message bubble ────────────────────── */

function ChatMessage({ message, currentUserId }: { message: any; currentUserId?: string }) {
  if (message.is_system) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
        <span className="text-[10px] text-gray-400 dark:text-slate-600 italic px-2">{message.body} · {relativeTime(message.created_at)}</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
      </div>
    );
  }

  const isMine = currentUserId && message.sender?.id === currentUserId;
  const senderRole = message.sender_role || message.sender?.role || 'user';
  const isAdmin = senderRole === 'admin' || senderRole === 'superadmin';

  return (
    <div className={cn('flex items-start gap-2.5', isMine && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0',
        isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
      )}>
        {getInitials(message.sender?.full_name)}
      </div>
      <div className={cn('flex-1 min-w-0', isMine && 'text-right')}>
        <div className={cn('flex items-center gap-2', isMine && 'flex-row-reverse')}>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">{message.sender?.full_name || 'User'}</span>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-medium',
            isAdmin ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
          )}>
            {senderRole}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-slate-600">{relativeTime(message.created_at)}</span>
        </div>
        <div className={cn(
          'inline-block mt-1 text-sm whitespace-pre-wrap text-left',
          isMine ? 'rounded-xl rounded-tr-sm bg-purple-600 text-white px-3 py-2' : 'rounded-xl rounded-tl-sm bg-gray-100 dark:bg-white/[0.04] text-gray-800 dark:text-slate-200 px-3 py-2 border border-gray-200 dark:border-white/5',
        )}>
          {message.body}
        </div>
        {message.attachment_url && (
          <div className={cn("mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 max-w-[200px] shadow-sm", isMine ? "ml-auto" : "")}>
            <img src={message.attachment_url} alt="attachment" className="w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────── AI Suggestion Banner ────────────────────── */

function AiSuggestionBanner({
  loading, data, onDismiss, onApply, disabled,
}: {
  loading: boolean;
  data: any;
  onDismiss: () => void;
  onApply: () => void;
  disabled: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-blue-50 dark:from-purple-500/10 dark:via-fuchsia-500/10 dark:to-blue-500/10 px-4 py-3 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
        <Sparkles size={14} className="animate-pulse" />
        Searching past resolved cases for a similar fix...
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-blue-50 dark:from-purple-500/10 dark:via-fuchsia-500/10 dark:to-blue-500/10 px-4 py-3 space-y-2 relative">
      <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white">
        <X size={12} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-purple-900 dark:text-purple-200">✨ AI Suggested Solution</p>
          <p className="text-[10px] text-purple-700/70 dark:text-purple-300/70">Based on past resolved incidents</p>
        </div>
      </div>
      {data?.has_suggestion ? (
        <>
          <div className="bg-white/70 dark:bg-black/20 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 border border-purple-200/50 dark:border-purple-500/20">
            {data.suggestion}
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-300">
            <b>This solution successfully resolved this exact problem {data.success_count} time{data.success_count === 1 ? '' : 's'} previously</b>
            {data.total_history > data.success_count && (
              <span className="text-purple-600/70 dark:text-purple-300/70"> · {data.total_history} similar cases analyzed</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onApply}
              disabled={disabled}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={12} /> Try this solution
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/70 dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-purple-700 dark:text-purple-300">
          {data?.message || 'No prior resolutions match this incident yet. Be the first to log a successful solution.'}
        </p>
      )}
    </div>
  );
}
