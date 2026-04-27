'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ScanEye, Upload, Loader2, AlertCircle, RefreshCw, ShieldCheck, ShieldAlert, MapPin, Eye, Tag, Activity, Camera, X, Send, CheckCircle2, AlertTriangle, Navigation, Map } from 'lucide-react';
import { cn, COMPANIES, ASSET_TYPES, ISSUE_TYPES, IMPACT_OPTIONS, LIKELIHOOD_OPTIONS, getRiskLevel, getRiskColor } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { analyzeImage, createReport } from '@/lib/api';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading map...</div>,
});

interface AnalysisResult {
  metadata: {
    confidence_score: number;
    environment: string;
  };
  asset: {
    category: string;
    identified_id: string | null;
  };
  diagnostics: {
    is_defective: boolean;
    defect_type: string | null;
    severity: string;
    technical_description: string;
  };
  spatial_context: {
    extracted_text: string[];
    visual_location_markers: string;
  };
  exif?: {
    latitude: number | null;
    longitude: number | null;
    date_taken: string | null;
    location_source: 'exif' | 'none';
  };
  _provider?: string;
}

type PageState = 'idle' | 'analyzing' | 'result' | 'error' | 'location' | 'form' | 'submitting' | 'submitted';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function severityToImpact(sev: string): number {
  switch (sev) {
    case 'Critical': return 5;
    case 'High': return 4;
    case 'Medium': return 3;
    case 'Low': return 2;
    default: return 0;
  }
}

function categoryToAssetType(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('road') || lower.includes('asphalt')) return 'Road';
  if (lower.includes('bridge')) return 'Bridge';
  if (lower.includes('tunnel') || lower.includes('metro') || lower.includes('underground')) return 'Tunnel';
  if (lower.includes('telecom') || lower.includes('tower') || lower.includes('antenna')) return 'Telecom Tower';
  if (lower.includes('fiber') || lower.includes('cabinet')) return 'Fiber Cabinet';
  if (lower.includes('light') || lower.includes('pole') || lower.includes('lamp')) return 'Lighting Pole';
  if (lower.includes('rail') || lower.includes('track') || lower.includes('fastener')) return 'Railway Segment';
  if (lower.includes('construct') || lower.includes('site')) return 'Construction Site';
  return 'Road';
}

function defectToIssueType(defect: string | null): string {
  if (!defect) return 'Other';
  const lower = defect.toLowerCase();
  if (lower.includes('crack') && lower.includes('asphalt')) return 'Asphalt Crack';
  if (lower.includes('crack') && lower.includes('concrete')) return 'Concrete Crack';
  if (lower.includes('crack')) return 'Concrete Crack';
  if (lower.includes('pothole')) return 'Pothole';
  if (lower.includes('corrosion') || lower.includes('rust') || lower.includes('oxidat')) return 'Corrosion';
  if (lower.includes('water') || lower.includes('leak')) return 'Water Leakage';
  if (lower.includes('cable') || lower.includes('expos')) return 'Cable Exposure';
  if (lower.includes('light') || lower.includes('lamp')) return 'Lighting Failure';
  if (lower.includes('deform') || lower.includes('surface')) return 'Surface Deformation';
  if (lower.includes('structural') || lower.includes('damage')) return 'Structural Damage';
  if (lower.includes('hazard')) return 'Worksite Hazard';
  return 'Other';
}

export default function AnalyzeImagePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { lang } = useAppContext();

  // Report form state
  const [form, setForm] = useState({
    tenantId: 'transport', companyName: 'Transport Division',
    assetName: '', assetType: 'Road', locationName: '',
    latitude: '', longitude: '',
    issueType: 'Other', description: '', imageName: '',
    visibilityLevel: 'Internal',
    impact: 0, likelihood: 0,
    createdBy: '', assignedTeam: '',
  });

  const riskScore = form.impact * form.likelihood;
  const riskLevel = riskScore > 0 ? getRiskLevel(riskScore) : '';

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit');
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setResult(null);
    setState('idle');
    setExifGps(null);

    // Extract EXIF GPS metadata
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const view = new DataView(reader.result as ArrayBuffer);
        const gps = extractExifGps(view);
        if (gps) setExifGps(gps);
      } catch { /* no exif */ }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch (err: any) {
      setError(err.name === 'NotAllowedError' ? 'Camera access denied. Please allow camera permission.' : 'Camera not available on this device.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const captured = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFile(captured);
      }
      stopCamera();
    }, 'image/jpeg', 0.92);
  }, [handleFile, stopCamera]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setState('analyzing');
    setError(null);
    try {
      const data = await analyzeImage(file);
      setResult(data);
      setState('result');
    } catch (err: any) {
      setError(err.message || t('imgAI.error', lang));
      setState('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setState('idle');
    stopCamera();
    if (inputRef.current) inputRef.current.value = '';
    setForm({
      tenantId: 'transport', companyName: 'Transport Division',
      assetName: '', assetType: 'Road', locationName: '',
      latitude: '', longitude: '',
      issueType: 'Other', description: '', imageName: '',
      visibilityLevel: 'Internal',
      impact: 0, likelihood: 0,
      createdBy: '', assignedTeam: '',
    });
  };

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locationMethod, setLocationMethod] = useState<'none' | 'gps' | 'map' | 'exif'>('none');
  const [exifGps, setExifGps] = useState<{ lat: number; lng: number } | null>(null);

  const handleCreateReport = () => {
    if (!result) return;
    // Pre-fill form from AI result
    const assetType = categoryToAssetType(result.asset.category);
    const issueType = defectToIssueType(result.diagnostics.defect_type);
    const impact = severityToImpact(result.diagnostics.severity);
    setForm(f => ({
      ...f,
      assetType,
      assetName: result.asset.identified_id || result.asset.category,
      issueType,
      description: result.diagnostics.technical_description,
      imageName: file?.name || 'camera-capture.jpg',
      impact,
      locationName: result.spatial_context.extracted_text?.filter(Boolean).join(', ') || '',
    }));
    // Check backend EXIF first, then client-side EXIF
    const backendExif = result.exif;
    const hasBackendGps = backendExif && backendExif.latitude != null && backendExif.longitude != null;
    const gpsSource = hasBackendGps
      ? { lat: backendExif!.latitude!, lng: backendExif!.longitude! }
      : exifGps;

    if (gpsSource) {
      setForm(f2 => ({
        ...f2,
        latitude: gpsSource.lat.toFixed(6),
        longitude: gpsSource.lng.toFixed(6),
        locationName: f2.locationName || `EXIF GPS ${gpsSource.lat.toFixed(4)}, ${gpsSource.lng.toFixed(4)}`,
      }));
      setState('location');
      setLocationMethod('exif');
      setGpsError(null);
      return;
    }

    setState('location');
    setLocationMethod('none');
    setGpsError(null);
  };

  const handleUseGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0
        });
      });
      setForm(f => ({
        ...f,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
        locationName: f.locationName || `GPS ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      }));
      setLocationMethod('gps');
    } catch (err: any) {
      const msg = err.code === 1 ? 'Location permission denied' : err.code === 2 ? 'Position unavailable' : 'Location request timed out';
      setGpsError(msg);
    }
    setGpsLoading(false);
  };

  const handleSelectOnMap = () => {
    setLocationMethod('map');
  };

  const handleConfirmLocation = () => {
    if (!form.latitude || !form.longitude) {
      setGpsError(t('imgAI.locationRequired', lang));
      return;
    }
    setState('form');
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  }, []);

  const handleCompany = (tenantId: string) => {
    const co = COMPANIES.find(c => c.id === tenantId);
    setForm(f => ({ ...f, tenantId, companyName: co?.name || tenantId }));
  };

  const handleSubmitReport = async () => {
    if (!form.latitude || !form.longitude) { setError(t('imgAI.locationRequired', lang)); return; }
    if (!form.impact || !form.likelihood) { setError(t('report.selectImpact', lang)); return; }
    if (!form.assetName || !form.locationName || !form.description || !form.createdBy) { setError('Please fill all required fields'); return; }
    setState('submitting');
    setError(null);
    try {
      await createReport(form);
      setState('submitted');
      setTimeout(() => router.push('/reports'), 2000);
    } catch (err: any) {
      setError(err.message);
      setState('form');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center pb-12">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto text-center pt-4 sm:pt-6 pb-3 sm:pb-4 px-2 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
          {t('imgAI.title', lang)}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('imgAI.subtitle', lang)}</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 space-y-4 sm:space-y-6">
        {/* Camera viewfinder */}
        {cameraOpen && (
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[450px] object-contain" />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transition-all active:scale-90"
              >
                <div className="w-12 h-12 rounded-full border-4 border-purple-600" />
              </button>
              <button
                onClick={stopCamera}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Upload zone */}
        {!cameraOpen && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer',
              'flex flex-col items-center justify-center gap-3 p-4 sm:p-8',
              dragOver
                ? 'border-purple-500 bg-purple-500/10'
                : preview
                  ? 'border-white/10 bg-[#16162a]'
                  : 'border-white/10 bg-[#16162a] hover:border-purple-500/40 hover:bg-purple-500/5'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {preview ? (
              <div className="relative w-full max-h-[400px] overflow-hidden rounded-xl">
                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Upload size={28} className="text-purple-400" />
                </div>
                <p className="text-slate-300 text-sm font-medium">{t('imgAI.dragDrop', lang)}</p>
                <p className="text-slate-600 text-xs">{t('imgAI.maxSize', lang)}</p>
              </>
            )}
          </div>
        )}

        {/* Camera button */}
        {!preview && !cameraOpen && (
          <div className="flex justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); openCamera(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <Camera size={18} className="text-purple-400" />
              {t('imgAI.camera', lang)}
            </button>
          </div>
        )}

        {/* Actions */}
        {file && state !== 'result' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={state === 'analyzing'}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
                state === 'analyzing'
                  ? 'bg-purple-900/40 text-purple-300 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/30'
              )}
            >
              {state === 'analyzing' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ScanEye size={18} />
              )}
              {state === 'analyzing' ? t('imgAI.analyzing', lang) : t('imgAI.analyze', lang)}
            </button>
            <button
              onClick={handleReset}
              disabled={state === 'analyzing'}
              className="px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {state === 'result' && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ScanEye size={22} className="text-purple-400" />
                {t('imgAI.result', lang)}
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={14} /> {t('imgAI.reset', lang)}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Metadata card */}
              <div className="bg-[#16162a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Eye size={16} className="text-purple-400" /> {t('imgAI.metadata', lang)}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t('imgAI.confidence', lang)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                          style={{ width: `${(result.metadata.confidence_score * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-purple-300">
                        {(result.metadata.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t('imgAI.environment', lang)}</span>
                    <span className="text-sm text-slate-200 bg-white/5 px-3 py-1 rounded-lg">
                      {result.metadata.environment}
                    </span>
                  </div>
                  {result._provider && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t('imgAI.provider', lang)}</span>
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        {result._provider}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* EXIF card */}
              {result.exif && (
                <div className="bg-[#16162a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-400" /> {t('imgAI.exifData', lang)}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t('imgAI.exifGPS', lang)}</span>
                      {result.exif.latitude != null && result.exif.longitude != null ? (
                        <span className="text-sm font-mono text-emerald-300">
                          {result.exif.latitude.toFixed(6)}, {result.exif.longitude.toFixed(6)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">{t('imgAI.noExifGPS', lang)}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t('imgAI.exifDate', lang)}</span>
                      {result.exif.date_taken ? (
                        <span className="text-sm text-slate-200 bg-white/5 px-3 py-1 rounded-lg">
                          {new Date(result.exif.date_taken).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t('imgAI.exifSource', lang)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${result.exif.location_source === 'exif' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                        {result.exif.location_source === 'exif' ? 'EXIF GPS' : 'No GPS in image'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset card */}
              <div className="bg-[#16162a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Tag size={16} className="text-blue-400" /> {t('imgAI.asset', lang)}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t('imgAI.assetCategory', lang)}</span>
                    <span className="text-sm text-white font-medium">{result.asset.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{t('imgAI.assetId', lang)}</span>
                    <span className="text-sm text-slate-300">
                      {result.asset.identified_id || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnostics card */}
              <div className="bg-[#16162a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 space-y-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Activity size={16} className="text-orange-400" /> {t('imgAI.diagnostics', lang)}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {result.diagnostics.is_defective ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-300 text-sm font-medium">
                        <ShieldAlert size={16} /> {t('imgAI.defective', lang)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
                        <ShieldCheck size={16} /> {t('imgAI.notDefective', lang)}
                      </span>
                    )}
                    {result.diagnostics.severity && (
                      <span className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border',
                        SEVERITY_COLORS[result.diagnostics.severity] || 'bg-white/5 text-slate-300 border-white/10'
                      )}>
                        {result.diagnostics.severity}
                      </span>
                    )}
                  </div>
                  {result.diagnostics.defect_type && (
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">{t('imgAI.defectType', lang)}</span>
                      <span className="text-sm text-white">{result.diagnostics.defect_type}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">{t('imgAI.techDesc', lang)}</span>
                    <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                      {result.diagnostics.technical_description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spatial Context card */}
              <div className="bg-[#16162a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 space-y-4 md:col-span-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-400" /> {t('imgAI.spatial', lang)}
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1.5">{t('imgAI.extractedText', lang)}</span>
                    {result.spatial_context.extracted_text && result.spatial_context.extracted_text.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.spatial_context.extracted_text.map((txt, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                            {txt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">{t('imgAI.noText', lang)}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">{t('imgAI.locationMarkers', lang)}</span>
                    <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                      {result.spatial_context.visual_location_markers}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Report button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateReport}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/30 transition-all"
              >
                <Send size={16} /> {t('imgAI.createReport', lang)}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={14} /> {t('imgAI.reset', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Location Step */}
        {state === 'location' && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={20} className="text-emerald-400" /> {t('imgAI.locationStep', lang)}
            </h2>
            <p className="text-sm text-slate-400">{t('imgAI.locationStepDesc', lang)}</p>

            {/* EXIF GPS found */}
            {locationMethod === 'exif' && form.latitude && form.longitude && (
              <div className="bg-[#16162a] rounded-2xl border border-purple-500/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                  <CheckCircle2 size={16} /> {t('imgAI.exifFound', lang)}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Lat: <span className="font-mono text-slate-200">{form.latitude}</span></span>
                  <span>Lng: <span className="font-mono text-slate-200">{form.longitude}</span></span>
                </div>
                <div className="h-48 rounded-lg overflow-hidden border border-white/10">
                  <LocationPicker
                    onSelect={handleLocationSelect}
                    lat={parseFloat(form.latitude)}
                    lng={parseFloat(form.longitude)}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{t('imgAI.adjustPin', lang)}</p>
              </div>
            )}

            {/* GPS / Map choice buttons */}
            {locationMethod === 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleUseGPS}
                  disabled={gpsLoading}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-[#16162a] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                >
                  {gpsLoading ? (
                    <Loader2 size={32} className="text-emerald-400 animate-spin" />
                  ) : (
                    <Navigation size={32} className="text-emerald-400" />
                  )}
                  <span className="text-sm font-medium text-slate-200">{t('imgAI.useGPS', lang)}</span>
                  <span className="text-xs text-slate-500">{t('imgAI.useGPSDesc', lang)}</span>
                </button>
                <button
                  onClick={handleSelectOnMap}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-[#16162a] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                >
                  <Map size={32} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-200">{t('imgAI.selectMap', lang)}</span>
                  <span className="text-xs text-slate-500">{t('imgAI.selectMapDesc', lang)}</span>
                </button>
              </div>
            )}

            {/* GPS Error */}
            {gpsError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-300/80 text-sm">{gpsError}</p>
                  <button onClick={handleSelectOnMap} className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 mt-1">
                    {t('imgAI.selectMap', lang)}
                  </button>
                </div>
              </div>
            )}

            {/* GPS success */}
            {locationMethod === 'gps' && form.latitude && form.longitude && (
              <div className="bg-[#16162a] rounded-2xl border border-emerald-500/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 size={16} /> {t('imgAI.gpsAcquired', lang)}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Lat: <span className="font-mono text-slate-200">{form.latitude}</span></span>
                  <span>Lng: <span className="font-mono text-slate-200">{form.longitude}</span></span>
                </div>
                <div className="h-48 rounded-lg overflow-hidden border border-white/10">
                  <LocationPicker
                    onSelect={handleLocationSelect}
                    lat={parseFloat(form.latitude)}
                    lng={parseFloat(form.longitude)}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{t('imgAI.adjustPin', lang)}</p>
              </div>
            )}

            {/* Map selection */}
            {locationMethod === 'map' && (
              <div className="bg-[#16162a] rounded-2xl border border-blue-500/20 p-4 sm:p-5 space-y-3">
                <p className="text-sm text-slate-300">{t('imgAI.tapMap', lang)}</p>
                <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                  <LocationPicker
                    onSelect={handleLocationSelect}
                    lat={form.latitude ? parseFloat(form.latitude) : undefined}
                    lng={form.longitude ? parseFloat(form.longitude) : undefined}
                  />
                </div>
                {form.latitude && form.longitude && (
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Lat: <span className="font-mono text-slate-200">{form.latitude}</span></span>
                    <span>Lng: <span className="font-mono text-slate-200">{form.longitude}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm location button */}
            {(locationMethod === 'exif' || locationMethod === 'gps' || locationMethod === 'map') && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmLocation}
                  disabled={!form.latitude || !form.longitude}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
                    form.latitude && form.longitude
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  )}
                >
                  <CheckCircle2 size={16} /> {t('imgAI.confirmLocation', lang)}
                </button>
                <button
                  onClick={() => { setLocationMethod('none'); setForm(f => ({ ...f, latitude: '', longitude: '' })); setGpsError(null); setExifGps(null); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <RefreshCw size={14} /> {t('imgAI.changeMethod', lang)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Report creation form */}
        {(state === 'form' || state === 'submitting') && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send size={20} className="text-purple-400" /> {t('imgAI.fillReport', lang)}
            </h2>

            <div className="bg-[#16162a] rounded-xl border border-white/5 p-3 sm:p-5 space-y-4">
              <h3 className="font-semibold text-purple-300 border-b border-white/5 pb-2">{t('report.assetInfo', lang)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.company', lang)}</label>
                  <select value={form.tenantId} onChange={e => handleCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {COMPANIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.assetName', lang)} *</label>
                  <input value={form.assetName} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Bridge A21" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.assetType', lang)}</label>
                  <select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {ASSET_TYPES.map(typ => <option key={typ} value={typ} className="bg-slate-900">{typ}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.locationName', lang)} *</label>
                  <input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Ziya Bunyadov Ave" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <MapPin size={14} /> {t('report.selectLocation', lang)}
                </label>
                <div className="h-56 rounded-lg overflow-hidden border border-white/10">
                  <LocationPicker
                    onSelect={handleLocationSelect}
                    lat={form.latitude ? parseFloat(form.latitude) : undefined}
                    lng={form.longitude ? parseFloat(form.longitude) : undefined}
                  />
                </div>
                {form.latitude && form.longitude && (
                  <p className="text-[11px] text-purple-400/60 mt-1.5">
                    {t('report.selected', lang)}: {form.latitude}, {form.longitude}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#16162a] rounded-xl border border-white/5 p-3 sm:p-5 space-y-4">
              <h3 className="font-semibold text-blue-300 border-b border-white/5 pb-2">{t('report.issueDetails', lang)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.issueType', lang)}</label>
                  <select value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {ISSUE_TYPES.map(typ => <option key={typ} value={typ} className="bg-slate-900">{typ}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.visibilityLevel', lang)}</label>
                  <select value={form.visibilityLevel} onChange={e => setForm(f => ({ ...f, visibilityLevel: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {['Internal', 'Restricted', 'Critical'].map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.description', lang)} *</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder={t('report.descPlaceholder', lang)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.createdBy', lang)} *</label>
                  <input value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t('report.assignedTeam', lang)}</label>
                  <input value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Road Crew B" />
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-[#16162a] rounded-xl border border-white/5 p-3 sm:p-5 space-y-4">
              <h3 className="font-semibold text-rose-300 border-b border-white/5 pb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-rose-400" /> {t('report.riskAssessment', lang)}</h3>
              <p className="text-xs text-slate-500">{t('report.riskSubtitle', lang)}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('report.impactSeverity', lang)} *</label>
                  <div className="flex flex-wrap gap-2">
                    {IMPACT_OPTIONS.map(o => (
                      <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, impact: o.value }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.impact === o.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'}`}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">{t('report.likelihood', lang)} *</label>
                  <div className="flex flex-wrap gap-2">
                    {LIKELIHOOD_OPTIONS.map(o => (
                      <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, likelihood: o.value }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.likelihood === o.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'}`}
                      >{o.label}</button>
                    ))}
                  </div>
                </div>
              </div>
              {riskLevel && (
                <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/10 flex items-center gap-4">
                  <span className="text-xs text-slate-500">{t('report.assessedRisk', lang)}:</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitReport}
                disabled={state === 'submitting'}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
                  state === 'submitting'
                    ? 'bg-purple-900/40 text-purple-300 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20'
                )}
              >
                {state === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {t('report.submit', lang)}
              </button>
              <button
                onClick={handleReset}
                disabled={state === 'submitting'}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={14} /> {t('imgAI.reset', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Submitted success */}
        {state === 'submitted' && (
          <div className="flex items-center justify-center py-16">
            <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-semibold text-lg">{t('report.success', lang)}</p>
              <p className="text-green-500/70 text-sm mt-1">{t('report.redirecting', lang)}</p>
            </div>
          </div>
        )}
      </div>
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
        if (view.getUint16(entryOff, littleEndian) === 0x8825) {
          gpsIfdPointer = view.getUint32(entryOff + 8, littleEndian);
          break;
        }
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
