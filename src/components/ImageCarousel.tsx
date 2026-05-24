'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  title: string;
}

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-100 flex items-center justify-center text-slate-400 rounded-xl border border-dashed border-slate-200">
        No images available
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

  return (
    <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg border border-slate-100 group">
      <div className="relative w-full h-full bg-slate-950">
        <Image
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          priority={currentIndex === 0}
          className="object-contain transition-all duration-350"
        />
      </div>

      {images.length > 1 && (
        <>
          {/* Nav buttons */}
          <button
            onClick={prevSlide}
            type="button"
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/60 text-white p-2 rounded-full transition cursor-pointer z-10 shadow-md group-hover:scale-105"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            type="button"
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/60 text-white p-2 rounded-full transition cursor-pointer z-10 shadow-md group-hover:scale-105"
            aria-label="Next Image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10 bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-indigo-400 scale-125' : 'bg-slate-400 hover:bg-slate-200'
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
