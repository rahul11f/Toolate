'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Home, Users, Hotel, Store, Briefcase, Building, Sparkles } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  category?: string;
  priority?: boolean;
}

export default function SafeImage({
  src,
  alt,
  className = '',
  category = 'RESIDENTIAL',
  priority = false,
}: SafeImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Standard React pattern to reset state during rendering when props change
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
    setLoaded(false);
  }

  // Detect images that loaded from browser cache (onLoad may not fire for cached images)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setLoaded(false);
  }, []);

  const normalizedCategory = category ? category.toUpperCase() : 'RESIDENTIAL';

  const getFallbackDetails = () => {
    switch (normalizedCategory) {
      case 'ROOMMATE':
        return {
          icon: <Users className="w-10 h-10 text-violet-500 stroke-[1.5]" />,
          bg: 'from-violet-50 to-purple-100/60',
          text: 'Co-living Companion',
        };
      case 'HOTEL':
      case 'HOSTEL':
      case 'DORMITORY':
        return {
          icon: <Hotel className="w-10 h-10 text-indigo-500 stroke-[1.5]" />,
          bg: 'from-indigo-50 to-blue-100/60',
          text: 'Premium Stay',
        };
      case 'SHOP':
      case 'WAREHOUSE':
      case 'COMMERCIAL':
        return {
          icon: <Store className="w-10 h-10 text-amber-500 stroke-[1.5]" />,
          bg: 'from-amber-50 to-yellow-100/60',
          text: 'Commercial Space',
        };
      case 'OFFICE':
      case 'COWORKING':
        return {
          icon: <Briefcase className="w-10 h-10 text-slate-500 stroke-[1.5]" />,
          bg: 'from-slate-50 to-slate-200/60',
          text: 'Vetted Workspace',
        };
      case 'VILLA':
        return {
          icon: <Sparkles className="w-10 h-10 text-teal-600 stroke-[1.5]" />,
          bg: 'from-teal-50 to-emerald-100/60',
          text: 'Luxury Villa',
        };
      default:
        return {
          icon: <Home className="w-10 h-10 text-indigo-500 stroke-[1.5]" />,
          bg: 'from-indigo-50/50 to-indigo-100/40',
          text: 'Verified Property',
        };
    }
  };

  const details = getFallbackDetails();
  const isValidImage = src && typeof src === 'string' && src.trim() !== '' && src !== 'null' && src !== 'undefined';

  if (!isValidImage || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${details.bg} text-slate-400 select-none p-4 text-center`}
      >
        <div className="p-3 bg-white/80 rounded-2xl shadow-xs backdrop-blur-xs mb-2 transition-transform duration-300 hover:scale-105">
          {details.icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Toolate</span>
        <span className="text-[9px] font-bold text-slate-400 mt-0.5">{details.text}</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-50">
      {/* Themed Animated Skeleton Background */}
      <div 
        className={`absolute inset-0 z-0 bg-gradient-to-br from-indigo-50 via-violet-100/50 to-indigo-50 bg-[length:200%_200%] animate-[pulse_2s_ease-in-out_infinite] flex items-center justify-center transition-opacity duration-700 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin opacity-50"></div>
      </div>

      {/* Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        className={`${className} absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
