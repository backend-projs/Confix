'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  onSelect: (lat: number, lng: number) => void;
  lat?: number;
  lng?: number;
}

function ClickHandler({ onSelect, setPos }: { onSelect: (lat: number, lng: number) => void; setPos: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPos([lat, lng]);
      onSelect(lat, lng);
    },
  });
  return null;
}

export default function LocationPicker({ onSelect, lat, lng }: LocationPickerProps) {
  const defaultCenter: [number, number] = [40.4093, 49.8671];
  const initial = lat && lng ? [lat, lng] as [number, number] : null;
  const [pos, setPos] = useState<[number, number] | null>(initial);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={initial || defaultCenter} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} setPos={setPos} />
        {pos && <Marker position={pos} icon={markerIcon} />}
        <LocationControl onSelect={onSelect} setPos={setPos} />
      </MapContainer>
    </div>
  );
}

function LocationControl({ onSelect, setPos }: { onSelect: (lat: number, lng: number) => void; setPos: (p: [number, number]) => void }) {
  const map = useMapEvents({});

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const newPos: [number, number] = [latitude, longitude];
      setPos(newPos);
      onSelect(latitude, longitude);
      map.flyTo(newPos, 16);
    }, (err) => {
      console.error(err);
      alert('Could not get your location. Please check your browser permissions.');
    }, { enableHighAccuracy: true });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLocate(); }}
          title="Use my current location"
          className="bg-white dark:bg-[#1a1a2e] text-purple-600 dark:text-purple-400 p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
          style={{ width: '34px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M13 2v3"/><path d="M13 19v3"/><path d="M5 12H2"/><path d="M22 12h-3"/></svg>
        </button>
      </div>
    </div>
  );
}
