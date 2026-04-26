import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { AlertTriangle, MapPin } from "lucide-react";
import { fetchReports } from "../api";
import type { Report } from "../types";
import RiskBadge from "../components/RiskBadge";
import SeverityBadge from "../components/SeverityBadge";
import StatusBadge from "../components/StatusBadge";
import "leaflet/dist/leaflet.css";

function riskColor(score: number): string {
  if (score >= 85) return "#ef4444";
  if (score >= 70) return "#f97316";
  if (score >= 40) return "#eab308";
  return "#22c55e";
}

export default function MapView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchReports().then((d) => { setReports(d); setLoading(false); });
  }, []);

  const sorted = [...reports].sort((a, b) => b.riskScore - a.riskScore);
  const critical = reports.filter((r) => r.riskScore >= 85).length;
  const high = reports.filter((r) => r.riskScore >= 70 && r.riskScore < 85).length;

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Loading map...</div>;

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <MapContainer
          center={[40.4093, 49.8671]}
          zoom={11}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={r.riskScore >= 85 ? 12 : r.riskScore >= 70 ? 10 : 8}
              pathOptions={{
                color: riskColor(r.riskScore),
                fillColor: riskColor(r.riskScore),
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup maxWidth={320}>
                <div className="space-y-2 p-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">{r.assetName}</p>
                  </div>
                  <p className="text-xs text-gray-500">{r.assetType} &middot; {r.locationName}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.severity === "Critical" ? "bg-red-100 text-red-700" : r.severity === "High" ? "bg-orange-100 text-orange-700" : r.severity === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-700"}`}>{r.severity}</span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === "Resolved" ? "bg-green-100 text-green-700" : r.status === "In Progress" ? "bg-amber-100 text-amber-700" : r.status === "Assigned" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{r.status}</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr><td className="py-0.5 text-gray-500">Issue</td><td className="py-0.5 font-medium text-gray-800">{r.issueType}</td></tr>
                      <tr><td className="py-0.5 text-gray-500">Risk Score</td><td className="py-0.5 font-bold" style={{ color: riskColor(r.riskScore) }}>{r.riskScore}</td></tr>
                      <tr><td className="py-0.5 text-gray-500">Confidence</td><td className="py-0.5 font-medium text-gray-800">{Math.round(r.confidence * 100)}%</td></tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] text-gray-600">{r.recommendedAction}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Side panel */}
      <div className="w-80 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="sticky top-0 border-b bg-white px-4 py-4 z-10">
          <h2 className="text-sm font-bold text-gray-900">Problem Reports on Map</h2>
          <div className="mt-2 flex gap-3 text-xs">
            <span className="text-gray-500">{reports.length} total</span>
            <span className="font-semibold text-red-600">{critical} critical</span>
            <span className="font-semibold text-orange-600">{high} high</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Critical</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />High</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />Medium</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />Low</span>
          </div>
        </div>
        <div className="divide-y">
          {sorted.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${selected === r.id ? "bg-azcon-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{r.assetName}</p>
                  <p className="text-xs text-gray-500">{r.locationName}</p>
                </div>
                <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: riskColor(r.riskScore) + "20", color: riskColor(r.riskScore) }}>
                  {r.riskScore}
                </span>
              </div>
              {selected === r.id && (
                <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
                  <p><span className="text-gray-400">Issue:</span> {r.issueType}</p>
                  <p><span className="text-gray-400">Severity:</span> {r.severity}</p>
                  <p><span className="text-gray-400">Status:</span> {r.status}</p>
                  <p><span className="text-gray-400">Action:</span> {r.recommendedAction}</p>
                  <p className="flex items-center gap-1 text-gray-400"><MapPin size={10} />{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
