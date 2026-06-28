'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icon paths in Next.js/Webpack
const customMarkerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Internal: smoothly pans map to new coords whenever they change
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef<[number, number]>(center);

  useEffect(() => {
    // Only pan if coordinates actually changed meaningfully (> 0.0001 deg = ~11m)
    const latDiff = Math.abs(center[0] - prevCenter.current[0]);
    const lngDiff = Math.abs(center[1] - prevCenter.current[1]);
    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

// Internal: keeps marker in sync when coordinates change externally (e.g. address search)
function SyncMarker({
  position,
  draggable,
  onChange,
}: {
  position: [number, number];
  draggable: boolean;
  onChange?: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<any>(null);

  // When position prop changes (from parent), move the marker
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onChange) {
          const latLng = marker.getLatLng();
          onChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onChange]
  );

  return (
    <Marker
      position={position}
      icon={customMarkerIcon}
      draggable={draggable}
      eventHandlers={draggable ? eventHandlers : undefined}
      ref={markerRef}
    />
  );
}

interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  draggable?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

export default function LeafletMap({
  lat,
  lng,
  zoom = 15,
  draggable = false,
  onChange,
}: LeafletMapProps) {
  // Use a stable initial center — MapContainer only reads `center` once on mount
  // The RecenterMap component handles all subsequent panning
  const initialCenter = useRef<[number, number]>([lat, lng]);
  const currentPosition: [number, number] = useMemo(() => [lat, lng], [lat, lng]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer
        center={initialCenter.current}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SyncMarker
          position={currentPosition}
          draggable={draggable}
          onChange={onChange}
        />
        <RecenterMap center={currentPosition} />
      </MapContainer>
    </div>
  );
}
