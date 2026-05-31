'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GitCompareArrows, X } from 'lucide-react';

export default function CompareBar() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const syncFromStorage = () => {
    const stored = JSON.parse(localStorage.getItem('toolate_compare') || '[]');
    setCompareIds(stored);
  };

  useEffect(() => {
    syncFromStorage();

    const handleUpdate = () => syncFromStorage();
    window.addEventListener('compare-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('compare-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleClearAll = () => {
    localStorage.setItem('toolate_compare', '[]');
    setCompareIds([]);
    window.dispatchEvent(new CustomEvent('compare-updated'));
  };

  if (compareIds.length < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <GitCompareArrows className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Comparing {compareIds.length} listings
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Select up to 3 listings to compare side-by-side
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-semibold transition cursor-pointer select-none"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <Link
            href={`/compare?ids=${compareIds.join(',')}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition select-none"
          >
            View Comparison ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
