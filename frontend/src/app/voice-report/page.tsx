'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { t, LANG_OPTIONS } from '@/lib/i18n';
import { createReport } from '@/lib/api';

const PROBLEM_TYPES = ['Bug', 'UI Issue', 'Performance', 'Feature Request', 'Infrastructure', 'Safety Hazard', 'Other'];

interface ParsedReport {
  problem_type: string;
  problem: string;
  description: string;
  corrected_transcript?: string;
}

type PageState = 'idle' | 'listening' | 'processing' | 'filled' | 'submitted';

export default function VoiceReportPage() {
  const [state, setState] = useState<PageState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [correctedTranscript, setCorrectedTranscript] = useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { lang } = useAppContext();
  const speechCode = LANG_OPTIONS.find(l => l.code === lang)?.speechCode || 'en-US';

  // Form fields
  const [problemType, setProblemType] = useState('Other');
  const [problem, setProblem] = useState('');
  const [description, setDescription] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support for MediaRecorder
  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      setManualMode(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setRawFallback(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (audioBlob.size < 1000) {
          setError(t('voice.noCapture', lang));
          setState('idle');
          return;
        }

        setState('processing');
        await sendAudioToWhisper(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // collect chunks every 250ms
      setState('listening');

      // Recording timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setError(t('voice.micDenied', lang));
      } else {
        setError(t('voice.noSpeechSupport', lang));
        setSupported(false);
        setManualMode(true);
      }
    }
  }, [lang, speechCode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('lang', speechCode);

      const res = await fetch(`${API}/voice-report/transcribe-and-parse`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.raw_transcript) {
          setRawFallback(errData.raw_response || null);
          setRawTranscript(errData.raw_transcript);
          setProblemType('Other');
          setProblem('');
          setDescription(errData.raw_transcript);
          setState('filled');
          setError(t('voice.aiFailed', lang));
          return;
        }
        throw new Error(errData.error || 'Transcription failed');
      }

      const data = await res.json();
      setProblemType(data.problem_type || 'Other');
      setProblem(data.problem || '');
      setDescription(data.description || '');
      setRawTranscript(data.raw_transcript || null);
      if (data.corrected_transcript) setCorrectedTranscript(data.corrected_transcript);
      setState('filled');
    } catch (err: any) {
      console.error('Whisper/parse error:', err);
      setState('idle');
      setError(t('voice.serviceDown', lang));
    }
  };

  // Manual text mode still uses the old /parse endpoint
  const parseManualText = async (text: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API}/voice-report/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, lang: speechCode }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData.raw_transcript || errData.raw_response) {
          setRawFallback(errData.raw_response || text);
          setProblemType('Other');
          setProblem('');
          setDescription(text);
          setState('filled');
          setError(t('voice.aiFailed', lang));
          return;
        }
        throw new Error(errData.error || 'Parse failed');
      }

      const data: ParsedReport = await res.json();
      setProblemType(data.problem_type || 'Other');
      setProblem(data.problem || '');
      setDescription(data.description || '');
      setRawTranscript(text);
      if (data.corrected_transcript) setCorrectedTranscript(data.corrected_transcript);
      setState('filled');
    } catch (err: any) {
      console.error('Parse error:', err);
      setProblemType('Other');
      setProblem('');
      setDescription(text);
      setState('filled');
      setError(t('voice.serviceDown', lang));
    }
  };

  const handleSubmit = async () => {
    setState('processing');
    try {
      await createReport({
        assetName: 'Voice Report Asset',
        assetType: 'Other',
        locationName: 'Unknown',
        issueType: problemType || 'Other',
        description: (problem ? problem + '\n\n' : '') + description,
        impact: 3,
        likelihood: 3,
        visibilityLevel: 'Internal',
        latitude: 40.4093,
        longitude: 49.8671,
      });
      setState('submitted');
    } catch (err: any) {
      console.error('Failed to create voice report:', err);
      setError(err.message || 'Failed to submit report');
      setState('filled');
    }
  };

  const handleReset = () => {
    setState('idle');
    setError(null);
    setRawFallback(null);
    setCorrectedTranscript(null);
    setRawTranscript(null);
    setProblemType('Other');
    setProblem('');
    setDescription('');
    setRecordingDuration(0);
    setManualMode(!supported ? true : false);
  };

  const handleManualSubmitText = () => {
    if (!description.trim()) return;
    setState('processing');
    parseManualText(description.trim());
  };

  // Button press handlers
  const handleButtonDown = () => {
    if (state === 'idle') startRecording();
  };
  const handleButtonUp = () => {
    if (state === 'listening') stopRecording();
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto text-center pt-4 sm:pt-6 pb-3 sm:pb-4 px-2">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
          {t('voice.title', lang)}
        </h1>
        <p className="text-gray-500 dark:text-slate-500 text-sm mt-1">{t('voice.subtitle', lang)}</p>
      </div>

      {/* Main Button Area */}
      {(state === 'idle' || state === 'listening' || state === 'processing') && !manualMode && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 -mt-8">
          {/* Shazam Button */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsing rings */}
            {state === 'idle' && (
              <>
                <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-purple-500/5 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-purple-500/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </>
            )}

            {/* Listening animated rings */}
            {state === 'listening' && (
              <>
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-purple-500/20 animate-ripple" />
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-purple-500/15 animate-ripple" style={{ animationDelay: '0.5s' }} />
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-violet-500/15 animate-ripple" style={{ animationDelay: '1s' }} />
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-purple-400/10 animate-ripple" style={{ animationDelay: '1.5s' }} />
              </>
            )}

            {/* Processing spinner ring */}
            {state === 'processing' && (
              <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
            )}

            {/* Main button */}
            <button
              onMouseDown={handleButtonDown}
              onMouseUp={handleButtonUp}
              onTouchStart={handleButtonDown}
              onTouchEnd={handleButtonUp}
              disabled={state === 'processing'}
              aria-label={state === 'listening' ? 'Release to stop recording' : state === 'processing' ? 'Processing your speech' : 'Press and hold to record'}
              className={cn(
                'relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 select-none',
                'shadow-2xl shadow-purple-900/40',
                state === 'idle' && 'bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] hover:scale-105 active:scale-95 cursor-pointer',
                state === 'listening' && 'bg-gradient-to-br from-[#a855f7] via-[#7c3aed] to-[#6d28d9] scale-110 animate-recording-glow',
                state === 'processing' && 'bg-gradient-to-br from-[#581c87] via-[#4c1d95] to-[#3b0764] cursor-wait opacity-80',
              )}
            >
              {state === 'processing' ? (
                <Loader2 size={36} className="text-white/80 animate-spin sm:w-12 sm:h-12" />
              ) : state === 'listening' ? (
                <Mic size={36} className="text-white animate-pulse sm:w-12 sm:h-12" />
              ) : (
                <Mic size={36} className="text-white/90 sm:w-12 sm:h-12" />
              )}
              <span className="text-white/70 text-xs mt-2 font-medium">
                {state === 'processing' ? t('voice.analyzing', lang) : state === 'listening' ? t('voice.listening', lang) : t('voice.holdToSpeak', lang)}
              </span>
            </button>
          </div>

          {/* Recording duration indicator */}
          {state === 'listening' && (
            <div className="max-w-md text-center px-4">
              <p className="text-purple-300 text-lg font-mono font-semibold tracking-wider">
                {formatDuration(recordingDuration)}
              </p>
              <p className="text-gray-500 dark:text-slate-500 text-xs mt-1">{t('voice.recordingInProgress', lang)}</p>
            </div>
          )}

          {/* Instructions */}
          {state === 'idle' && (
            <div className="max-w-md text-center px-4 space-y-3">
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                {t('voice.pressAndHold', lang)}
              </p>
              <button
                onClick={() => setManualMode(true)}
                className="text-purple-400/60 hover:text-purple-400 text-xs underline underline-offset-2 transition-colors"
              >
                {t('voice.typeManually', lang)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual text input mode */}
      {manualMode && (state === 'idle' || state === 'processing') && (
        <div className="w-full max-w-2xl mx-auto mt-8 space-y-4">
          {!supported && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-700 dark:text-amber-300/80 text-sm">
                {t('voice.noSpeechSupport', lang)}
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-[#16162a] rounded-2xl border border-gray-200 dark:border-white/[0.04] p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('voice.describeProblem', lang)}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder={t('voice.descPlaceholder', lang)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualSubmitText}
                disabled={!description.trim() || state === 'processing'}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  description.trim() && state !== 'processing'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                )}
              >
                {state === 'processing' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {state === 'processing' ? t('voice.analyzing', lang) : t('voice.analyzeAI', lang)}
              </button>
              {supported && (
                <button
                  onClick={() => { setManualMode(false); setDescription(''); }}
                  className="text-purple-400/60 hover:text-purple-400 text-xs underline underline-offset-2 transition-colors"
                >
                  {t('voice.switchVoice', lang)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-2xl mx-auto mt-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle size={18} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-red-600 dark:text-red-300/80 text-sm">{error}</p>
            </div>
            {state === 'idle' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <RefreshCw size={14} /> {t('voice.retry', lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filled form */}
      {(state === 'filled' || state === 'submitted') && (
        <div className="w-full max-w-2xl mx-auto mt-6 space-y-6">
          <div className="bg-white dark:bg-[#16162a] rounded-2xl border border-gray-200 dark:border-white/[0.04] p-6 space-y-5 shadow-sm dark:shadow-none">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('voice.problemReport', lang)}</h2>

            {/* Corrected transcript comparison */}
            {correctedTranscript && rawTranscript && correctedTranscript !== rawTranscript && (
              <div className="space-y-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/15 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  {t('voice.aiCorrected', lang)}
                </p>
                <div className="text-xs space-y-1.5">
                  <p className="text-gray-500 dark:text-slate-500"><span className="font-medium text-gray-500 dark:text-slate-400">{t('voice.rawHeard', lang)}:</span> <span className="line-through opacity-60">{rawTranscript}</span></p>
                  <p className="text-gray-700 dark:text-slate-300"><span className="font-medium text-indigo-400">{t('voice.corrected', lang)}:</span> {correctedTranscript}</p>
                </div>
              </div>
            )}

            {/* Problem Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400">{t('voice.problemType', lang)}</label>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => state === 'filled' && setProblemType(type)}
                    disabled={state === 'submitted'}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                      problemType === type
                        ? 'bg-purple-100 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-slate-300'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem summary */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400">{t('voice.problemSummary', lang)}</label>
              <input
                type="text"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                disabled={state === 'submitted'}
                placeholder={t('voice.summaryPlaceholder', lang)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400">{t('voice.detailedDesc', lang)}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={state === 'submitted'}
                rows={5}
                placeholder={t('voice.descFullPlaceholder', lang)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
              />
            </div>

            {/* Raw fallback display */}
            {rawFallback && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400 dark:text-slate-500">{t('voice.rawResponse', lang)}</label>
                <pre className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] rounded-lg p-3 text-xs text-gray-500 dark:text-slate-500 overflow-x-auto whitespace-pre-wrap">
                  {rawFallback}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {state === 'filled' && (
                <button
                  onClick={handleSubmit}
                  disabled={!problem.trim() && !description.trim()}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    (problem.trim() || description.trim())
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/30'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                  )}
                >
                  <Send size={16} /> {t('voice.submitReport', lang)}
                </button>
              )}
              {state === 'submitted' && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 size={18} /> {t('voice.submitted', lang)}
                </div>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                <RefreshCw size={14} /> {t('voice.newReport', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
