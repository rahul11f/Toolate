'use client';

import { useEffect } from 'react';

interface AdSensePlaceholderProps {
  format?: 'auto' | 'fluid' | 'rectangle';
  slot?: string;
  className?: string;
}

export default function AdSensePlaceholder({
  format = 'auto',
  slot,
  className = '',
}: AdSensePlaceholderProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    // Only load/push Ads in production environments
    if (process.env.NODE_ENV === 'production' && publisherId) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('Google AdSense loading error:', err);
      }
    }
  }, [publisherId]);

  // Display a styled layout preview box for local development
  if (process.env.NODE_ENV !== 'production' || !publisherId) {
    return (
      <div
        className={`bg-slate-50/50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center select-none min-h-[100px] ${className}`}
      >
        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Advertisement</span>
        <span className="text-xs font-semibold text-slate-500 mt-1">AdSense Banner Placeholder</span>
        <span className="text-[10px] text-slate-400 mt-0.5">
          Publisher: {publisherId || 'demo'} | Slot: {slot || 'default'} | Format: {format}
        </span>
      </div>
    );
  }

  return (
    <div className={`adsense-container w-full overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot || 'default'}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
