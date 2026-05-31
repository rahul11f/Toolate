'use client';

import { useState, useEffect } from 'react';
import { GitCompareArrows } from 'lucide-react';

interface CompareButtonProps {
  listingId: string;
  className?: string;
}

export default function CompareButton({ listingId, className }: CompareButtonProps) {
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('toolate_compare') || '[]');
    setIsSelected(stored.includes(listingId));
  }, [listingId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const stored: string[] = JSON.parse(localStorage.getItem('toolate_compare') || '[]');

    if (stored.includes(listingId)) {
      const updated = stored.filter((id) => id !== listingId);
      localStorage.setItem('toolate_compare', JSON.stringify(updated));
      setIsSelected(false);
    } else {
      if (stored.length >= 3) {
        // Silently ignore — max 3
        return;
      }
      stored.push(listingId);
      localStorage.setItem('toolate_compare', JSON.stringify(stored));
      setIsSelected(true);
    }

    // Dispatch a custom event so CompareBar can listen
    window.dispatchEvent(new CustomEvent('compare-updated'));
  };

  return (
    <button
      onClick={handleToggle}
      title={isSelected ? 'Remove from comparison' : 'Add to comparison (max 3)'}
      className={`${className || 'absolute top-4 right-4'} z-10 p-1.5 rounded-lg backdrop-blur-sm transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-indigo-600 text-white shadow-lg scale-105'
          : 'bg-white/85 text-slate-500 hover:bg-white hover:text-indigo-600 shadow-sm border border-slate-100/50'
      }`}
    >
      <GitCompareArrows className="w-4 h-4" />
    </button>
  );
}
