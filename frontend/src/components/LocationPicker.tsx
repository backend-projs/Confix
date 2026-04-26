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
    <MapContainer center={initial || defaultCenter} zoom={12} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} setPos={setPos} />
      {pos && <Marker position={pos} icon={markerIcon} />}
    </MapContainer>
  );
}
