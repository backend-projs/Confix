'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { fetchRegistrations, approveRegistration, rejectRegistration, fetchAdmins, createAdmin, fetchCompanies, deleteAdmin, resetAdminPassword } from '@/lib/auth-api';
import { Shield, CheckCircle, XCircle, Loader2, UserPlus, Building2, AlertTriangle, Trash2, Key } from 'lucide-react';

export default function SuperadminPage() {
  const router = useRouter();
  const { user, token } = useAppContext();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'admins'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [token, user, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [regs, comps, admns] = await Promise.all([
        fetchRegistrations(token!, activeTab === 'pending' ? 'pending' : activeTab === 'approved' ? 'approved' : undefined),
        fetchCompanies(token!),
        fetchAdmins(token!),
      ]);
      setRegistrations(regs);
      setCompanies(comps);
      setAdmins(admns);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const password = prompt('Set initial admin password (min 6 chars):');
    if (!password || password.length < 6) return;
    setProcessingId(id);
    try {
      await approveRegistration(token!, id, password);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
    setProcessingId(null);
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAdmin(token!, id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetAdminPassword = async (id: string, name: string) => {
    const password = prompt(`Set new password for "${name}" (min 6 chars):`);
    if (!password || password.length < 6) {
      if (password !== null) alert('Password must be at least 6 characters');
      return;
    }
    try {
      await resetAdminPassword(token!, id, password);
      alert('Password updated');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectRegistration(token!, id, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
    setProcessingId(null);
  };

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400 font-medium">Access Denied</p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Superadmin only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] px-5 py-4 border border-purple-100 dark:border-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-white/[0.06] flex items-center justify-center">
            <Shield size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Superadmin Panel</h1>
            <p className="text-purple-600/50 dark:text-purple-300/50 text-xs">Manage company registrations and admin accounts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'admins'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
          >
            {tab === 'pending' ? 'Pending Registrations' : tab === 'approved' ? 'Approved' : 'Admins'}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-purple-600" /></div>
      ) : (
        <>
          {activeTab !== 'admins' && (
            <div className="space-y-3">
              {registrations.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-500 dark:text-slate-500">
                  No {activeTab} registrations found.
                </div>
              )}
              {registrations.map((reg: any) => (
                <div key={reg.id} className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-purple-600" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{reg.company_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : reg.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                          {reg.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Contact: {reg.contact_email} {reg.contact_phone && `· ${reg.contact_phone}`}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Admin: {reg.admin_name} {reg.admin_email && `<${reg.admin_email}>`}</p>
                      {reg.rejection_reason && (
                        <p className="text-xs text-red-500 dark:text-red-400">Reason: {reg.rejection_reason}</p>
                      )}
                    </div>

                    {reg.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(reg.id)}
                          disabled={processingId === reg.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
                        >
                          {processingId === reg.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectModal(reg.id)}
                          disabled={processingId === reg.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-3">
              {admins.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-500 dark:text-slate-500">
                  No admin accounts found.
                </div>
              )}
              {admins.map((admin: any) => (
                <div key={admin.id} className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{admin.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{admin.email} · {admin.companies?.name || 'No company'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-medium">Admin</span>
                    <button
                      onClick={() => handleResetAdminPassword(admin.id, admin.full_name)}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Change Password"
                    >
                      <Key size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-5 w-full max-w-sm shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reject Registration</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {processingId === showRejectModal ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
