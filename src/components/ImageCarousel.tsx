'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, Building } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  category?: string;
}

export default function ImageCarousel({ images, title, category = 'RESIDENTIAL' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [hasError, setHasError] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Standard React pattern to reset state during rendering when index changes
  if (currentIndex !== prevIndex) {
    setPrevIndex(currentIndex);
    setLoading(true);
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 md:h-96 bg-gradient-to-br from-indigo-50/50 to-indigo-100/40 flex flex-col items-center justify-center text-slate-450 rounded-2xl border border-slate-100 shadow-sm p-6 text-center select-none">
        <Home className="w-12 h-12 text-indigo-500 mb-3 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">Toolate {category.toUpperCase()}</span>
        <span className="text-[10px] text-slate-400 mt-1">No images uploaded for this listing</span>
      </div>
    );
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = () => {
    setHasError((prev) => ({ ...prev, [currentIndex]: true }));
    setLoading(false);
  };

  const isCurrentIndexFailed = hasError[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-md border border-slate-100 group bg-slate-900 select-none">
      {/* Slide Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {loading && !isCurrentIndexFailed && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-20">
            <div className="flex flex-col items-center space-y-2">
              <Building className="w-8 h-8 text-indigo-400 animate-bounce" />
              <div className="w-16 h-1.5 bg-indigo-500/20 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-indigo-500 rounded-full animate-infinite-scroll" />
              </div>
            </div>
          </div>
        )}

        {isCurrentIndexFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/30 to-indigo-100/20 text-slate-450 p-6 text-center">
            <Building className="w-12 h-12 text-indigo-400 mb-3" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Toolate</span>
            <span className="text-[10px] text-slate-400 mt-1">Failed to load this image</span>
          </div>
        ) : (
          <img
            src={images[currentIndex]}
            alt={`${title} - Slide ${currentIndex + 1}`}
            crossOrigin="anonymous"
            onLoad={() => setLoading(false)}
            onError={handleImageError}
            className={`w-full h-full object-contain transition-all duration-500 ${
              loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          />
        )}
      </div>

      {images.length > 1 && (
        <>
          {/* Nav buttons */}
          <button
            onClick={prevSlide}
            type="button"
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/70 text-white p-2.5 rounded-xl transition cursor-pointer z-30 shadow-md hover:scale-105 active:scale-95"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            onClick={nextSlide}
            type="button"
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 backdrop-blur-md hover:bg-black/70 text-white p-2.5 rounded-xl transition cursor-pointer z-30 shadow-md hover:scale-105 active:scale-95"
            aria-label="Next Image"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-30 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-indigo-400 w-3 scale-110' : 'bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
