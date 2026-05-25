'use client';

import { useEffect, useState } from 'react';

interface AdSensePlaceholderProps {
  format?: 'auto' | 'fluid' | 'rectangle';
  slot?: string;
  className?: string;
  responsiveMinScreen?: 'xl' | 'lg' | 'md' | 'sm';
}

export default function AdSensePlaceholder({
  format = 'auto',
  slot,
  className = '',
  responsiveMinScreen,
}: AdSensePlaceholderProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!responsiveMinScreen) {
      setShouldRender(true);
      return;
    }

    const query = responsiveMinScreen === 'xl' ? '(min-width: 1280px)' : '(min-width: 768px)';
    const media = window.matchMedia(query);
    setShouldRender(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setShouldRender(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [responsiveMinScreen]);

  useEffect(() => {
    // Only load/push Ads in production environments when the component is marked to render on screen size
    if (process.env.NODE_ENV === 'production' && publisherId && shouldRender) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('Google AdSense loading error:', err);
      }
    }
  }, [publisherId, shouldRender]);

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

  if (!shouldRender) {
    return null; // Do not render script container or <ins> tag when hidden on this viewport size
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
