'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerCompany } from '@/lib/auth-api';
import { Building2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    admin_name: '',
    admin_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCompany(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration Submitted</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Your company registration is pending review. A superadmin will review your request and create your admin account once approved.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-500 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to login
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
            <Building2 size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Register Company</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Apply for tenant access on Confix</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#16162a] rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm space-y-4">
          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Company Name *</label>
            <input
              required
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Acme Infrastructure Ltd"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Contact Email *</label>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="admin@acme.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Contact Phone</label>
            <input
              value={form.contact_phone}
              onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="+1 234 567 890"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-white/5 pt-4">
            <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mb-2">Initial Admin Account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Admin Full Name *</label>
                <input
                  required
                  value={form.admin_name}
                  onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={form.admin_email}
                  onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="john@acme.com (defaults to contact email)"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
}
