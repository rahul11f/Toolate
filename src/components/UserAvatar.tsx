'use client';

import { useState, useEffect } from 'react';

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
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  // Reset error state if image URL changes
  useEffect(() => {
    setHasError(false);
  }, [image]);

  if (image && !hasError) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClassName} rounded-full object-cover border border-slate-200 shadow-xs shrink-0 ${className}`}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} rounded-full flex items-center justify-center shrink-0 ${fallbackClassName} ${className}`}
    >
      {initial}
    </div>
  );
}
