import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, CheckCircle2, Brain, AlertTriangle } from "lucide-react";
import { postInspect, createReport } from "../api";
import type { AiResult } from "../types";
import RiskBadge from "../components/RiskBadge";
import SeverityBadge from "../components/SeverityBadge";

const ASSET_TYPES = ["Road", "Bridge", "Tunnel", "Telecom Tower", "Lighting Pole", "Fiber Cabinet", "Railway Segment"];

export default function Inspect() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ assetName: "", assetType: "Road", locationName: "", latitude: "40.4093", longitude: "49.8671", description: "", imageName: "" });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 1500));
    const data = await postInspect({ ...form, latitude: +form.latitude, longitude: +form.longitude });
    setResult(data);
    setAnalyzing(false);
  }

  async function handleAddReport() {
    if (!result) return;
    await createReport({
      ...result,
      assignedTeam: "Unassigned",
    });
    setSaved(true);
    setTimeout(() => navigate("/reports"), 1200);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Inspection</h1>
        <p className="mt-1 text-sm text-gray-500">Submit asset details and run AI-powered analysis to detect issues.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Asset Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Asset Name</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" value={form.assetName} onChange={(e) => set("assetName", e.target.value)} placeholder="e.g. Bridge A21" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Asset Type</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" value={form.assetType} onChange={(e) => set("assetType", e.target.value)}>
                {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Location Name</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" value={form.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder="e.g. Ziya Bunyadov Ave" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Latitude</label>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Longitude</label>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Upload Image</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-azcon-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-azcon-700" type="file" accept="image/*" onChange={(e) => set("imageName", e.target.files?.[0]?.name || "")} />
              <p className="mt-1 text-[11px] text-gray-400">Tip: filename affects AI detection (e.g. crack_photo.jpg)</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
              <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azcon-500 focus:outline-none focus:ring-1 focus:ring-azcon-500" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the observed issue..." />
            </div>
            <button onClick={handleAnalyze} disabled={analyzing || !form.assetName} className="flex w-full items-center justify-center gap-2 rounded-lg bg-azcon-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-azcon-800 disabled:opacity-50">
              {analyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Search size={16} /> Analyze with AI</>}
            </button>
          </div>
        </div>

        {/* AI Result */}
        <div>
          {analyzing && (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-azcon-300 bg-azcon-50/50 p-10">
              <Brain size={48} className="animate-pulse text-azcon-500" />
              <p className="mt-4 text-sm font-medium text-azcon-700">AI is analyzing inspection image...</p>
              <p className="mt-1 text-xs text-azcon-400">Running detection model and risk scoring engine</p>
            </div>
          )}
          {!analyzing && !result && (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <Search size={40} className="text-gray-300" />
              <p className="mt-3 text-sm text-gray-400">Submit the form to run AI analysis</p>
            </div>
          )}
          {result && !analyzing && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Brain size={20} className="text-azcon-600" />
                <h2 className="text-sm font-semibold text-gray-700">AI Analysis Result</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Detected Issue</span>
                  <span className="text-sm font-semibold text-gray-900">{result.issueType}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Severity</span>
                  <SeverityBadge severity={result.severity} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Confidence</span>
                  <span className="text-sm font-semibold text-gray-900">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Risk Score</span>
                  <RiskBadge score={result.riskScore} size="md" />
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Recommended Action</span>
                  <p className="mt-1 text-sm text-gray-800">{result.recommendedAction}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">Explanation</span>
                  <ul className="mt-1 space-y-1">
                    {result.explanation.map((e, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                {!saved ? (
                  <button onClick={handleAddReport} className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">
                    <CheckCircle2 size={16} /> Add to Reports
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-3 text-sm font-medium text-green-700">
                    <CheckCircle2 size={16} /> Report saved! Redirecting...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
