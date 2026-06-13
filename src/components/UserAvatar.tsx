'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  // Reset error state if image URL changes during render (standard React 19 pattern)
  if (image !== prevImage) {
    setPrevImage(image);
    setHasError(false);
  }

  const isValidImage = image &&
    typeof image === 'string' &&
    image.trim() !== '' &&
    image !== 'null' &&
    image !== 'undefined';

  if (isValidImage && !hasError) {
    return (
      <div className={`relative ${sizeClassName} rounded-full overflow-hidden border border-slate-205 shadow-xs shrink-0 ${className}`}>
        <Image
          src={image}
          alt={name}
          fill
          sizes="48px"
          onError={() => setHasError(true)}
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
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
