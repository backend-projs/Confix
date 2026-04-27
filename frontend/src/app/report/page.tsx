'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createReport, getAISuggestions, analyzeImage } from '@/lib/api';
import {
  COMPANIES, ASSET_TYPES, ISSUE_TYPES, IMPACT_OPTIONS, LIKELIHOOD_OPTIONS,
  getRiskLevel, getRiskColor, cn,
} from '@/lib/utils';
import {
  Bot, AlertTriangle, Send, Loader2, MapPin, ImagePlus, X, PenLine,
  Mic, MicOff, ScanEye, Upload, Camera, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { t, LANG_OPTIONS } from '@/lib/i18n';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs">Loading map...</div>,
});

type InputMethod = 'manual' | 'voice' | 'image';

function categoryToAssetType(cat: string): string {
  const l = cat.toLowerCase();
  if (l.includes('road') || l.includes('asphalt')) return 'Road';
  if (l.includes('bridge')) return 'Bridge';
  if (l.includes('tunnel') || l.includes('metro')) return 'Tunnel';
  if (l.includes('telecom') || l.includes('tower')) return 'Telecom Tower';
  if (l.includes('fiber') || l.includes('cabinet')) return 'Fiber Cabinet';
  if (l.includes('light') || l.includes('pole')) return 'Lighting Pole';
  if (l.includes('rail') || l.includes('track')) return 'Railway Segment';
  return 'Road';
}

function defectToIssueType(defect: string | null): string {
  if (!defect) return 'Other';
  const l = defect.toLowerCase();
  if (l.includes('crack') && l.includes('asphalt')) return 'Asphalt Crack';
  if (l.includes('crack')) return 'Concrete Crack';
  if (l.includes('pothole')) return 'Pothole';
  if (l.includes('corrosion') || l.includes('rust')) return 'Corrosion';
  if (l.includes('water') || l.includes('leak')) return 'Water Leakage';
  if (l.includes('cable')) return 'Cable Exposure';
  if (l.includes('light')) return 'Lighting Failure';
  if (l.includes('deform') || l.includes('surface')) return 'Surface Deformation';
  if (l.includes('structural') || l.includes('damage')) return 'Structural Damage';
  return 'Other';
}

function severityToImpact(sev: string): number {
  switch (sev) { case 'Critical': return 5; case 'High': return 4; case 'Medium': return 3; case 'Low': return 2; default: return 0; }
}

export default function ManualReportPage() {
  const router = useRouter();
  const { lang, user } = useAppContext();
  const speechCode = LANG_OPTIONS.find(l => l.code === lang)?.speechCode || 'en-US';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<InputMethod>('manual');

  // Form state
  const [form, setForm] = useState({
    tenantId: 'transport', companyName: 'Transport Division',
    assetName: '', assetType: 'Road', locationName: '',
    latitude: '', longitude: '',
    issueType: 'Asphalt Crack', description: '', imageName: '',
    visibilityLevel: 'Internal',
    impact: 0, likelihood: 0,
    createdBy: user?.full_name || '', assignedTeam: '',
  });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Voice state
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Image AI state
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgState, setImgState] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [imgResult, setImgResult] = useState<any>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  // Auto-fill createdBy when user loads
  useEffect(() => {
    if (user?.full_name) setForm(f => ({ ...f, createdBy: f.createdBy || user.full_name }));
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
    const arrayReader = new FileReader();
    arrayReader.onload = () => {
      try {
        const view = new DataView(arrayReader.result as ArrayBuffer);
        const gps = extractExifGps(view);
        if (gps) setForm(f => ({ ...f, latitude: gps.lat.toFixed(6), longitude: gps.lng.toFixed(6), locationName: f.locationName || `GPS ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` }));
      } catch { /* no exif */ }
    };
    arrayReader.readAsArrayBuffer(file);
  };

  // ───── Voice Recording ─────
  const startRecording = useCallback(async () => {
    setVoiceError(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        if (blob.size < 1000) { setVoiceError('Recording too short'); setVoiceState('idle'); return; }
        setVoiceState('processing');
        try {
          const API = process.env.NEXT_PUBLIC_API_URL;
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          fd.append('lang', speechCode);
          const res = await fetch(`${API}/voice-report/transcribe-and-parse`, { method: 'POST', body: fd });
          if (!res.ok) {
            const err = await res.json();
            if (err.raw_transcript) { setForm(f => ({ ...f, description: err.raw_transcript })); setVoiceError('AI parsing failed, raw transcript applied'); }
            else throw new Error(err.error || 'Transcription failed');
          } else {
            const data = await res.json();
            setForm(f => ({ ...f, description: data.description || f.description, issueType: data.problem_type && ISSUE_TYPES.includes(data.problem_type) ? data.problem_type : f.issueType }));
          }
        } catch (err: any) { setVoiceError(err.message); }
        setVoiceState('idle');
      };
      mediaRecorderRef.current = mr;
      mr.start(250);
      setVoiceState('listening');
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (err: any) {
      setVoiceError(err.name === 'NotAllowedError' ? 'Microphone permission denied' : 'Microphone not available');
    }
  }, [speechCode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ───── Image AI Analysis ─────
  const handleImgFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { setImgError('File exceeds 10MB limit'); return; }
    if (!f.type.startsWith('image/')) { setImgError('Please upload an image file'); return; }
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
    setImgError(null);
    setImgResult(null);
    setImgState('idle');
  }, []);

  const handleAnalyze = async () => {
    if (!imgFile) return;
    setImgState('analyzing');
    setImgError(null);
    try {
      const data = await analyzeImage(imgFile);
      setImgResult(data);
      setImgState('done');
      // Auto-fill form from AI result
      const assetType = categoryToAssetType(data.asset?.category || '');
      const issueType = defectToIssueType(data.diagnostics?.defect_type);
      const impact = severityToImpact(data.diagnostics?.severity || '');
      setForm(f => ({
        ...f,
        assetType,
        assetName: data.asset?.identified_id || data.asset?.category || f.assetName,
        issueType,
        description: data.diagnostics?.technical_description || f.description,
        imageName: imgFile.name,
        impact: impact || f.impact,
        locationName: f.locationName || (data.spatial_context?.extracted_text?.filter(Boolean).join(', ') || ''),
      }));
      setImagePreview(imgPreview);
      // Check EXIF GPS from result
      if (data.exif?.latitude != null && data.exif?.longitude != null) {
        setForm(f => ({ ...f, latitude: data.exif.latitude.toFixed(6), longitude: data.exif.longitude.toFixed(6) }));
      }
    } catch (err: any) {
      setImgError(err.message || 'Analysis failed');
      setImgState('idle');
    }
  };

  // ───── AI Suggestions ─────
  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await getAISuggestions({ assetType: form.assetType, description: form.description, imageName: form.imageName });
      setAiSuggestions(res);
    } catch { setAiSuggestions(null); }
    setAiLoading(false);
  };

  // ───── Submit ─────
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
        <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
        <p className="text-green-600 dark:text-green-400 font-semibold text-lg">{t('report.success', lang)}</p>
        <p className="text-green-500/70 text-sm mt-1">{t('report.redirecting', lang)}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1a1145] dark:via-[#302b63] dark:to-[#0f172a] p-4 sm:p-6 border border-purple-100 dark:border-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manual Report</h1>
          <p className="text-purple-600/60 dark:text-purple-300/70 text-xs sm:text-sm mt-1">Create a report using manual input, voice recording, or AI image analysis</p>
        </div>
      </div>

      {/* Input Method Tabs */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {([
          { key: 'manual' as InputMethod, icon: PenLine, label: 'Manual', desc: 'Fill form directly' },
          { key: 'voice' as InputMethod, icon: Mic, label: 'Voice', desc: 'Speak to fill description' },
          { key: 'image' as InputMethod, icon: ScanEye, label: 'Image AI', desc: 'Upload photo for analysis' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setMethod(tab.key)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all text-center',
              method === tab.key
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#16162a] text-gray-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500/30'
            )}>
            <tab.icon size={20} />
            <span className="text-sm font-semibold">{tab.label}</span>
            <span className="text-[10px] hidden sm:block opacity-70">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ───── Voice Input Section ───── */}
      {method === 'voice' && (
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2"><Mic size={18} /> Voice Input</h2>
          <p className="text-xs text-gray-500 dark:text-slate-500">Press the button to record. Your speech will be transcribed and used to fill the description field.</p>
          <div className="flex items-center gap-4">
            {voiceState === 'idle' && (
              <button onClick={startRecording} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/20">
                <Mic size={18} /> Start Recording
              </button>
            )}
            {voiceState === 'listening' && (
              <button onClick={stopRecording} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all animate-pulse">
                <MicOff size={18} /> Stop ({formatDuration(recordingDuration)})
              </button>
            )}
            {voiceState === 'processing' && (
              <div className="flex items-center gap-2 text-purple-500 text-sm font-medium">
                <Loader2 size={18} className="animate-spin" /> Transcribing & parsing...
              </div>
            )}
          </div>
          {voiceError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs">
              {voiceError}
            </div>
          )}
          {form.description && method === 'voice' && voiceState === 'idle' && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} /> Description filled from voice input
            </div>
          )}
        </div>
      )}

      {/* ───── Image AI Section ───── */}
      {method === 'image' && (
        <div className="bg-white dark:bg-[#16162a] rounded-xl border border-gray-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2"><ScanEye size={18} /> Image AI Analysis</h2>
          <p className="text-xs text-gray-500 dark:text-slate-500">Upload a photo and AI will identify the asset, defect, and severity to pre-fill the form.</p>

          {/* Upload zone */}
          <div
            onClick={() => imgInputRef.current?.click()}
            className={cn(
              'rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 p-6 transition-all',
              imgPreview ? 'border-gray-200 dark:border-white/10' : 'border-gray-300 dark:border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5'
            )}>
            <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImgFile(f); }} />
            {imgPreview ? (
              <img src={imgPreview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Upload size={24} className="text-purple-400" />
                <p className="text-gray-600 dark:text-slate-400 text-sm">Click to upload image</p>
                <p className="text-gray-400 dark:text-slate-600 text-xs">Max 10MB</p>
              </>
            )}
          </div>

          {/* Actions */}
          {imgFile && imgState !== 'done' && (
            <div className="flex items-center gap-3">
              <button onClick={handleAnalyze} disabled={imgState === 'analyzing'}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all', imgState === 'analyzing' ? 'bg-purple-900/40 text-purple-300 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/20')}>
                {imgState === 'analyzing' ? <Loader2 size={16} className="animate-spin" /> : <ScanEye size={16} />}
                {imgState === 'analyzing' ? 'Analyzing...' : 'Analyze Image'}
              </button>
              <button onClick={() => { setImgFile(null); setImgPreview(null); setImgResult(null); setImgState('idle'); }}
                className="p-2.5 rounded-xl text-gray-500 dark:text-slate-500 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10">
                <RefreshCw size={14} />
              </button>
            </div>
          )}

          {imgError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs">{imgError}</div>
          )}

          {imgState === 'done' && imgResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={16} /> AI analysis applied to form
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2"><span className="text-gray-500 dark:text-slate-500">Asset:</span> <span className="text-gray-800 dark:text-slate-200">{imgResult.asset?.category}</span></div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2"><span className="text-gray-500 dark:text-slate-500">Severity:</span> <span className="text-gray-800 dark:text-slate-200">{imgResult.diagnostics?.severity}</span></div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2 col-span-2"><span className="text-gray-500 dark:text-slate-500">Defect:</span> <span className="text-gray-800 dark:text-slate-200">{imgResult.diagnostics?.defect_type || 'None'}</span></div>
              </div>
              <button onClick={() => { setImgFile(null); setImgPreview(null); setImgResult(null); setImgState('idle'); }}
                className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-400"><RefreshCw size={12} /> Analyze another image</button>
            </div>
          )}
        </div>
      )}

      {/* ───── Report Form ───── */}
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
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.createdBy', lang)} *</label>
              <input required value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{t('report.assignedTeam', lang)}</label>
              <input value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Road Crew B" />
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
