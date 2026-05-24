'use client';

import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 rounded-lg animate-pulse min-h-[300px]">
      Loading interactive map...
    </div>
  ),
});

interface MapWrapperProps {
  lat: number;
  lng: number;
  zoom?: number;
  draggable?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <LeafletMap {...props} />;
}
