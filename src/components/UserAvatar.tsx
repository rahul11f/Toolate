'use client';

import { useState, useEffect, useRef } from 'react';

interface UserAvatarProps {
  image?: string | null;
  name: string;
  className?: string;
  sizeClassName?: string; // e.g. "w-6 h-6" or "w-8 h-8"
  fallbackClassName?: string;
}

export default function UserAvatar({
  image,
  name,
  className = '',
  sizeClassName = 'w-6 h-6',
  fallbackClassName = 'bg-indigo-100 text-indigo-600 font-bold text-[10px]'
}: UserAvatarProps) {
  const [prevImage, setPrevImage] = useState(image);
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset error state if image URL changes during render (standard React 19 pattern)
  if (image !== prevImage) {
    setPrevImage(image);
    setHasError(false);
  }

  // Hydration-safe image load error detection
  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      // Check if image already failed to load before hydration completes
      if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
        setTimeout(() => {
          setHasError(true);
        }, 0);
      }

      const handleError = () => setHasError(true);
      img.addEventListener('error', handleError);

      return () => {
        img.removeEventListener('error', handleError);
      };
    }
  }, [image]);

  const isValidImage = image &&
    typeof image === 'string' &&
    image.trim() !== '' &&
    image !== 'null' &&
    image !== 'undefined';

  if (isValidImage && !hasError) {
    return (
      <img
        ref={imgRef}
        src={image}
        alt={name}
        crossOrigin="anonymous"
        className={`${sizeClassName} rounded-full object-cover border border-slate-200 shadow-xs shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} rounded-full flex items-center justify-center shrink-0 uppercase ${fallbackClassName} ${className}`}
    >
      {initial}
    </div>
  );
}
