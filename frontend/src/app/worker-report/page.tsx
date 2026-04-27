'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { fetchMe } from '@/lib/auth-api';
import { createReport } from '@/lib/api';
import { getRiskLevel, getRiskColor } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Camera, Send, Loader2, AlertTriangle, ImagePlus, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkerReportPage() {
  const router = useRouter();
  const { user, token, lang } = useAppContext();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState(0);
  const [likelihood, setLikelihood] = useState(0);
  const [images, setImages] = useState<{ file: File; preview: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchMe(token)
      .then(({ user: u, assignedAssets }) => {
        setProfile(u);
        setAssets(assignedAssets || []);
        if (assignedAssets && assignedAssets.length > 0) {
          setSelectedAsset(assignedAssets[0]);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [token]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-purple-600 dark:text-purple-400/60 text-sm animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user || user.role !== 'worker') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Access Denied</p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">This page is for field workers only.</p>
        </div>
      </div>
    );
  }

  const riskScore = impact * likelihood;
  const riskLevel = riskScore > 0 ? getRiskLevel(riskScore) : '';

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImages(prev => [...prev, { file, preview: reader.result as string, name: file.name }]);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, { file, preview: reader.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impact || !likelihood) return alert(t('report.selectImpact', lang));
    if (!description.trim()) return alert('Please describe the issue');
    if (!selectedAsset) return alert('Please select an asset');

    setSubmitting(true);
    try {
      await createReport({
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        assetType: selectedAsset.type,
        locationName: selectedAsset.location_name || 'Unknown',
        latitude: selectedAsset.latitude,
        longitude: selectedAsset.longitude,
        issueType: 'Other',
        description,
        imageName: images.map(i => i.name).join(', ') || null,
        impact,
        likelihood,
        visibilityLevel: 'Internal',
      });
      setSuccess(true);
      setTimeout(() => router.push('/reports'), 1500);
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-500/20 rounded-xl p-6 text-center">
          <p className="text-green-600 dark:text-green-400 font-semibold text-lg">{t('report.success', lang)}</p>
          <p className="text-green-500/70 text-sm mt-1">{t('report.redirecting', lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] p-4 border border-blue-100 dark:border-transparent">
        <div className="relative z-10">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">New Field Report</h1>
          <p className="text-blue-600/60 dark:text-blue-300/70 text-xs mt-0.5">Auto-filled from your profile</p>
        </div>
      </div>

      {/* Auto-filled Context Card */}
      <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/[0.06] flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-xs">{profile?.full_name?.charAt(0) || 'W'}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{profile?.full_name}</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-500">{profile?.position} · {profile?.team}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setShowAssetPicker(!showAssetPicker)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500">Asset</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedAsset?.name || 'No asset assigned'}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-600">{selectedAsset?.type}{selectedAsset?.location_name ? ` · ${selectedAsset.location_name}` : ''}</p>
            </div>
            {assets.length > 1 && (showAssetPicker ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}
          </button>

          {showAssetPicker && assets.length > 1 && (
            <div className="mt-2 space-y-1">
              {assets.map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setSelectedAsset(a); setShowAssetPicker(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedAsset?.id === a.id ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-slate-400'}`}
                >
                  <p className="font-medium">{a.name}</p>
                  <p className="text-[10px] opacity-70">{a.type} · {a.location_name || 'Unknown location'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Issue Description *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Photos */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Photos</label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryPick} />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              <Camera size={14} />
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-300 px-3 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ImagePlus size={14} />
              Gallery
            </button>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
          <h2 className="font-semibold text-rose-600 dark:text-rose-300 text-xs mb-3 flex items-center gap-1.5"><AlertTriangle size={14} /> Risk Assessment</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1.5">Impact Severity</label>
              <div className="flex flex-wrap gap-2">
                {['Minor','Moderate','Serious','Major','Critical'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setImpact(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${impact === i + 1 ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1.5">Likelihood</label>
              <div className="flex flex-wrap gap-2">
                {['Rare','Unlikely','Possible','Likely','Almost Certain'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setLikelihood(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${likelihood === i + 1 ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {riskLevel && (
            <div className="mt-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-500/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-slate-500">Assessed Risk</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pb-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}
