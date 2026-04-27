'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { fetchWorkers, createWorker, updateWorker, deleteWorker, resetWorkerPassword, fetchCompanyAssets } from '@/lib/auth-api';
import { Users, Plus, Loader2, X, Pencil, CheckCircle, AlertTriangle, Trash2, Key, MapPin, ClipboardList, HardHat } from 'lucide-react';
import dynamic from 'next/dynamic';
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function AdminWorkersPage() {
  const router = useRouter();
  const { user, token } = useAppContext();
  const [workers, setWorkers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    full_name: '',
    worker_id: '',
    position: '',
    team: '',
    password: '',
    phone: '',
    email: '',
    assigned_asset_id: '',
    workplace_latitude: null as number | null,
    workplace_longitude: null as number | null,
    workplace_address: '',
    worker_type: 'field' as 'field' | 'audit',
  };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<any>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [token, user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [w, a] = await Promise.all([
        fetchWorkers(token!),
        user?.company_id ? fetchCompanyAssets(token!, user.company_id) : Promise.resolve([]),
      ]);
      setWorkers(w);
      setAssets(a);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createWorker(token!, {
        ...form,
        assigned_asset_id: form.assigned_asset_id || undefined,
        workplace_latitude: form.workplace_latitude ?? undefined,
        workplace_longitude: form.workplace_longitude ?? undefined,
        workplace_address: form.workplace_address || undefined,
        worker_type: form.worker_type,
      });
      setForm(emptyForm);
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleEditSave = async (id: string) => {
    setSaving(true);
    try {
      await updateWorker(token!, id, editForm);
      setEditingId(null);
      setEditForm({});
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete worker "${name}"? This cannot be undone.`)) return;
    try {
      await deleteWorker(token!, id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    const password = prompt(`Set new password for "${name}" (min 6 chars):`);
    if (!password || password.length < 6) {
      if (password !== null) alert('Password must be at least 6 characters');
      return;
    }
    try {
      await resetWorkerPassword(token!, id, password);
      alert('Password updated');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400 font-medium">Access Denied</p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Admins only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] px-5 py-4 border border-blue-100 dark:border-transparent">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-white/[0.06] flex items-center justify-center">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
              <p className="text-blue-600/50 dark:text-blue-300/50 text-xs">Create and manage field worker accounts</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            <Plus size={14} />
            Add Worker
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-white">New Worker</h2>
            <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500"><X size={14} /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Worker Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['field', 'audit'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, worker_type: t }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      form.worker_type === t
                        ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {t === 'field' ? <HardHat size={14} /> : <ClipboardList size={14} />}
                    {t === 'field' ? 'Field Worker' : 'Audit Worker'}
                    <span className="text-[10px] text-gray-500 dark:text-slate-500 ml-auto">
                      {t === 'field' ? 'Resolves incidents' : 'Surveys & captures'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">5-Digit Worker ID *</label>
              <input required value={form.worker_id} onChange={e => setForm(f => ({ ...f, worker_id: e.target.value.replace(/\D/g, '').slice(0, 5) }))} maxLength={5} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="12345" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Position / Role *</label>
              <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Electrician" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Team</label>
              <input value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Team A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Password *</label>
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Assigned Asset</label>
              <select value={form.assigned_asset_id} onChange={e => setForm(f => ({ ...f, assigned_asset_id: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">None</option>
                {assets.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><MapPin size={12} className="text-purple-600" /> Workplace Location</label>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-2">Used to assign incidents to nearest worker. Click on the map to set the worker's home base.</p>
              <input
                value={form.workplace_address}
                onChange={e => setForm(f => ({ ...f, workplace_address: e.target.value }))}
                placeholder="Address (optional)"
                className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
              />
              <div className="h-56 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                <LocationPicker
                  lat={form.workplace_latitude ?? undefined}
                  lng={form.workplace_longitude ?? undefined}
                  onSelect={(lat, lng) => setForm(f => ({ ...f, workplace_latitude: lat, workplace_longitude: lng }))}
                />
              </div>
              {form.workplace_latitude && form.workplace_longitude && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Selected: {form.workplace_latitude.toFixed(5)}, {form.workplace_longitude.toFixed(5)}
                </p>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Create Worker
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-purple-600" /></div>
      ) : (
        <div className="space-y-6">
          {workers.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-slate-500">No workers found. Create your first worker above.</div>
          )}
          {(['field', 'audit'] as const).map(group => {
            const groupWorkers = workers.filter((w: any) => (w.worker_type || 'field') === group);
            if (groupWorkers.length === 0 && workers.length > 0) return null;
            const isField = group === 'field';
            return (
              <div key={group} className="space-y-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isField ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                  {isField ? <HardHat size={14} className="text-purple-600 dark:text-purple-400" /> : <ClipboardList size={14} className="text-amber-600 dark:text-amber-400" />}
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isField ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {isField ? 'Field Workers' : 'Audit Workers'}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-gray-600 dark:text-slate-400 font-medium">{groupWorkers.length}</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-500 ml-auto">
                    {isField ? 'Resolves dispatched incidents' : 'Surveys and captures incidents'}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupWorkers.map((w: any) => (
            <div key={w.id} className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
              {editingId === w.id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Position</label>
                    <input value={editForm.position ?? w.position} onChange={e => setEditForm((f: any) => ({ ...f, position: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Team</label>
                    <input value={editForm.team ?? w.team} onChange={e => setEditForm((f: any) => ({ ...f, team: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Assigned Asset</label>
                    <select value={editForm.assigned_asset_id ?? (w.assigned_asset_id || '')} onChange={e => setEditForm((f: any) => ({ ...f, assigned_asset_id: e.target.value || null }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">None</option>
                      {assets.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Status</label>
                    <select value={editForm.status ?? w.status} onChange={e => setEditForm((f: any) => ({ ...f, status: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <button onClick={() => { setEditingId(null); setEditForm({}); }} className="px-3 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                    <button onClick={() => handleEditSave(w.id)} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1 transition-colors">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{w.full_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium">{w.worker_id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${w.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{w.status}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{w.position}</p>
                    {w.team && <p className="text-[11px] text-gray-500 dark:text-slate-400">Team: {w.team}</p>}
                    {w.workplace_address && <p className="text-[11px] text-gray-400 dark:text-slate-600 flex items-center gap-1"><MapPin size={10} /> {w.workplace_address}</p>}
                    {w.assigned_asset && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-600">Asset: {w.assigned_asset.name} ({w.assigned_asset.type})</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(w.id); setEditForm({}); }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(w.id, w.full_name)}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Change Password"
                    >
                      <Key size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id, w.full_name)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
