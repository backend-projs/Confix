'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createReport, getAISuggestions } from '@/lib/api';
import {
  COMPANIES, ASSET_TYPES, ISSUE_TYPES, IMPACT_OPTIONS, LIKELIHOOD_OPTIONS,
  getRiskLevel, getRiskColor,
} from '@/lib/utils';
import { Bot, AlertTriangle, Send, Loader2, MapPin, ImagePlus, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/lib/i18n';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs">Loading map...</div>,
});

export default function NewReportPage() {
  const router = useRouter();
  const { lang, user } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    tenantId: 'transport', companyName: 'Transport Division',
    assetName: '', assetType: 'Road', locationName: '',
    latitude: '', longitude: '',
    issueType: 'Asphalt Crack', description: '', imageName: '',
    visibilityLevel: 'Internal',
    impact: 0, likelihood: 0,
    createdBy: '', assignedTeam: '',
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      const co = COMPANIES.find(c => c.id === user.company_id);
      setForm(f => ({
        ...f,
        tenantId: user.company_id || 'transport',
        companyName: co?.name || user.company_id || 'Transport Division',
        createdBy: user.full_name || '',
        assignedTeam: user.team || '',
      }));
    }
  }, [user]);

  const riskScore = form.impact * form.likelihood;
  const riskLevel = riskScore > 0 ? getRiskLevel(riskScore) : '';

  const handleCompany = (tenantId: string) => {
    const co = COMPANIES.find(c => c.id === tenantId);
    setForm(f => ({ ...f, tenantId, companyName: co?.name || tenantId }));
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, imageName: file.name }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Extract EXIF GPS metadata if available
    const arrayReader = new FileReader();
    arrayReader.onload = () => {
      try {
        const view = new DataView(arrayReader.result as ArrayBuffer);
        const exifGps = extractExifGps(view);
        if (exifGps) {
          setForm(f => ({
            ...f,
            latitude: exifGps.lat.toFixed(6),
            longitude: exifGps.lng.toFixed(6),
            locationName: f.locationName || `GPS ${exifGps.lat.toFixed(4)}, ${exifGps.lng.toFixed(4)}`,
          }));
        }
      } catch { /* no exif data */ }
    };
    arrayReader.readAsArrayBuffer(file);
  };

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await getAISuggestions({ assetType: form.assetType, description: form.description, imageName: form.imageName });
      setAiSuggestions(res);
    } catch { setAiSuggestions(null); }
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.impact || !form.likelihood) return alert(t('report.selectImpact', lang));
    setSubmitting(true);
    try {
      await createReport(form);
      setSuccess(true);
      setTimeout(() => router.push('/reports'), 1500);
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  if (success) return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-500/20 rounded-xl p-6 text-center">
        <p className="text-green-600 dark:text-green-400 font-semibold text-lg">{t('report.success', lang)}</p>
        <p className="text-green-500/70 text-sm mt-1">{t('report.redirecting', lang)}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Information */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-5 space-y-4 shadow-sm dark:shadow-none">
          <h2 className="font-semibold text-purple-700 dark:text-purple-300 border-b border-gray-200 dark:border-white/5 pb-2">{t('report.assetInfo', lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.company', lang)}</label>
              <select value={form.tenantId} onChange={e => handleCompany(e.target.value)} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {COMPANIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.assetName', lang)} *</label>
              <input required value={form.assetName} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Bridge A21" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.assetType', lang)}</label>
              <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {ASSET_TYPES.map(typ => <option key={typ} value={typ} className="bg-white dark:bg-slate-900">{typ}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.locationName', lang)} *</label>
              <input required value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Ziya Bunyadov Ave" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <MapPin size={14} /> {t('report.selectLocation', lang)}
            </label>
            <div className="h-44 sm:h-56 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
              <LocationPicker onSelect={handleLocationSelect} lat={form.latitude ? parseFloat(form.latitude) : undefined} lng={form.longitude ? parseFloat(form.longitude) : undefined} />
            </div>
            {form.latitude && form.longitude && (
              <p className="text-[11px] text-purple-600/60 dark:text-purple-400/60 mt-1.5">{t('report.selected', lang)}: {form.latitude}, {form.longitude}</p>
            )}
          </div>
        </div>

        {/* Issue Details */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-5 space-y-4 shadow-sm dark:shadow-none">
          <h2 className="font-semibold text-blue-600 dark:text-blue-300 border-b border-gray-200 dark:border-white/5 pb-2">{t('report.issueDetails', lang)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.issueType', lang)}</label>
              <select value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {ISSUE_TYPES.map(typ => <option key={typ} value={typ} className="bg-white dark:bg-slate-900">{typ}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.visibilityLevel', lang)}</label>
              <select value={form.visibilityLevel} onChange={e => setForm(f => ({ ...f, visibilityLevel: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {['Internal', 'Restricted', 'Critical'].map(v => <option key={v} value={v} className="bg-white dark:bg-slate-900">{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.description', lang)} *</label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder={t('report.descPlaceholder', lang)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.attachImage', lang)}</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <ImagePlus size={15} /> {t('report.chooseImage', lang)}
              </button>
              {form.imageName && (
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <span>{form.imageName}</span>
                  <button type="button" onClick={() => { setForm(f => ({ ...f, imageName: '' })); setImagePreview(null); }} className="text-gray-400 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white"><X size={12} /></button>
                </div>
              )}
            </div>
            {imagePreview && (
              <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>{t('report.createdBy', lang)} *</span>
                {user && <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Auto-filled</span>}
              </label>
              <input required value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} readOnly={!!user} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 read-only:opacity-70 read-only:cursor-default" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>{t('report.assignedTeam', lang)}</span>
                {user && <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Auto-filled</span>}
              </label>
              <input value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value }))} readOnly={!!user} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 read-only:opacity-70 read-only:cursor-default" placeholder="e.g. Road Crew B" />
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-5 space-y-4 shadow-sm dark:shadow-none">
          <h2 className="font-semibold text-indigo-600 dark:text-indigo-300 border-b border-gray-200 dark:border-white/5 pb-2 flex items-center gap-2"><Bot size={18} className="text-indigo-500 dark:text-indigo-400" /> {t('report.aiAssistant', lang)}</h2>
          <button type="button" onClick={handleAI} disabled={aiLoading || !form.description} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 flex items-center gap-2 transition-all">
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
            {aiLoading ? t('report.aiLoading', lang) : t('report.aiButton', lang)}
          </button>
          {aiSuggestions && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/15 rounded-lg p-4 space-y-2">
              <div><span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('report.suggestedCategory', lang)}:</span> <span className="text-sm text-gray-800 dark:text-slate-200">{aiSuggestions.suggestedIssueCategory}</span></div>
              <div><span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('report.suggestedSummary', lang)}:</span> <span className="text-sm text-gray-800 dark:text-slate-200">{aiSuggestions.suggestedSummary}</span></div>
              <div><span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('report.suggestedPPE', lang)}:</span> <span className="text-sm text-gray-800 dark:text-slate-200">{aiSuggestions.suggestedPPE?.join(', ')}</span></div>
              <div><span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('report.safetyInstructions', lang)}:</span> <span className="text-sm text-gray-800 dark:text-slate-200">{aiSuggestions.suggestedSafetyInstructions?.join(', ')}</span></div>
              <div><span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('report.suggestedNextStep', lang)}:</span> <span className="text-sm text-gray-800 dark:text-slate-200">{aiSuggestions.suggestedNextStep}</span></div>
              <p className="text-xs text-gray-500 dark:text-slate-500 italic mt-2 border-t border-gray-200 dark:border-white/5 pt-2">{t('report.aiDisclaimer', lang)}</p>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-3 sm:p-5 space-y-4 shadow-sm dark:shadow-none">
          <h2 className="font-semibold text-rose-600 dark:text-rose-300 border-b border-gray-200 dark:border-white/5 pb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-rose-500 dark:text-rose-400" /> {t('report.riskAssessment', lang)}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-500">{t('report.riskSubtitle', lang)}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">{t('report.impactSeverity', lang)} *</label>
              <div className="flex flex-wrap gap-2">
                {IMPACT_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, impact: o.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.impact === o.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">{t('report.likelihood', lang)} *</label>
              <div className="flex flex-wrap gap-2">
                {LIKELIHOOD_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, likelihood: o.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.likelihood === o.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]'}`}
                  >{o.label}</button>
                ))}
              </div>
            </div>
          </div>
          {riskLevel && (
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-500/10 flex items-center gap-4">
              <span className="text-xs text-gray-500 dark:text-slate-500">{t('report.assessedRisk', lang)}:</span>
              <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-500 italic">{t('report.riskDisclaimer', lang)}</p>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {t('report.submit', lang)}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Minimal EXIF GPS extraction from JPEG ArrayBuffer DataView */
function extractExifGps(view: DataView): { lat: number; lng: number } | null {
  if (view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      const exifOffset = offset + 4;
      const tiffStr = String.fromCharCode(view.getUint8(exifOffset), view.getUint8(exifOffset + 1), view.getUint8(exifOffset + 2), view.getUint8(exifOffset + 3));
      if (tiffStr !== 'Exif') return null;
      const tiffBase = exifOffset + 6;
      const littleEndian = view.getUint16(tiffBase) === 0x4949;
      const ifdOffset = view.getUint32(tiffBase + 4, littleEndian);
      const ifdCount = view.getUint16(tiffBase + ifdOffset, littleEndian);
      let gpsIfdPointer = 0;
      for (let i = 0; i < ifdCount; i++) {
        const entryOff = tiffBase + ifdOffset + 2 + i * 12;
        if (view.getUint16(entryOff, littleEndian) === 0x8825) { gpsIfdPointer = view.getUint32(entryOff + 8, littleEndian); break; }
      }
      if (!gpsIfdPointer) return null;
      const gpsCount = view.getUint16(tiffBase + gpsIfdPointer, littleEndian);
      let latRef = '', lngRef = '', latVals: number[] = [], lngVals: number[] = [];
      for (let i = 0; i < gpsCount; i++) {
        const e = tiffBase + gpsIfdPointer + 2 + i * 12;
        const tag = view.getUint16(e, littleEndian);
        const valOff = view.getUint32(e + 8, littleEndian);
        if (tag === 1) latRef = String.fromCharCode(view.getUint8(tiffBase + valOff) || view.getUint8(e + 8));
        if (tag === 3) lngRef = String.fromCharCode(view.getUint8(tiffBase + valOff) || view.getUint8(e + 8));
        if (tag === 2) latVals = readRationals(view, tiffBase + valOff, littleEndian);
        if (tag === 4) lngVals = readRationals(view, tiffBase + valOff, littleEndian);
      }
      if (latVals.length === 3 && lngVals.length === 3) {
        let lat = latVals[0] + latVals[1] / 60 + latVals[2] / 3600;
        let lng = lngVals[0] + lngVals[1] / 60 + lngVals[2] / 3600;
        if (latRef === 'S') lat = -lat;
        if (lngRef === 'W') lng = -lng;
        return { lat, lng };
      }
      return null;
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function readRationals(view: DataView, off: number, le: boolean): number[] {
  const vals: number[] = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(off + i * 8, le);
    const den = view.getUint32(off + i * 8 + 4, le);
    vals.push(den ? num / den : 0);
  }
  return vals;
}
