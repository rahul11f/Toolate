'use client';

import { useEffect, useRef, useMemo } from 'react';
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

// Component to dynamically pan the map to a new center when coordinates change
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
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
  zoom = 13,
  draggable = false,
  onChange,
}: LeafletMapProps) {
  const markerRef = useRef<any>(null);
  const centerPosition: [number, number] = useMemo(() => [lat, lng], [lat, lng]);

  const markerEventHandlers = useMemo(
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
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer
        center={centerPosition}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={centerPosition}
          icon={customMarkerIcon}
          draggable={draggable}
          eventHandlers={draggable ? markerEventHandlers : undefined}
          ref={markerRef}
        />
        <RecenterMap center={centerPosition} />
      </MapContainer>
    </div>
  );
}
