'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { getRiskDotColor } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  reports: any[];
  onSelect: (r: any) => void;
  focusReport?: any;
}

function FlyToReport({ report }: { report: any }) {
  const map = useMap();
  useEffect(() => {
    if (report?.latitude && report?.longitude) {
      map.flyTo([report.latitude, report.longitude], 16, { duration: 1.2 });
    }
  }, [report, map]);
  return null;
}

export default function MapView({ reports, onSelect, focusReport }: MapViewProps) {
  const center: [number, number] = [40.4093, 49.8671];

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full rounded-lg" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToReport report={focusReport} />
      {reports.map((r: any) => (
        <CircleMarker
          key={r.id}
          center={[r.latitude, r.longitude]}
          radius={8}
          fillColor={getRiskDotColor(r.risk_level)}
          color={getRiskDotColor(r.risk_level)}
          fillOpacity={0.8}
          weight={2}
          eventHandlers={{ click: () => onSelect(r) }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-bold">{r.asset_name}</p>
              <p>{r.issue_type} — {r.risk_level}</p>
              <p className="text-gray-500">{r.location_name}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {reports.filter((r: any) => r.hazard_radius_meters > 0).map((r: any) => (
        <Circle
          key={`hz-${r.id}`}
          center={[r.latitude, r.longitude]}
          radius={r.hazard_radius_meters}
          fillColor={getRiskDotColor(r.risk_level)}
          color={getRiskDotColor(r.risk_level)}
          fillOpacity={0.1}
          weight={1}
          dashArray="4"
        />
      ))}
    </MapContainer>
  );
}
