'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RentEstimatorWidgetProps {
  listingId?: string;
  price: number;
  city: string;
  area: string;
  category: string;
  furnishing?: string;
}

interface EstimateData {
  price: number;
  min: number;
  max: number;
  avg: number;
  sampleSize: number;
  verdict: 'BELOW_MARKET' | 'FAIR_PRICE' | 'ABOVE_MARKET';
  aiRange: string;
  explanation: string;
}

export default function RentEstimatorWidget({
  listingId,
  price,
  city,
  area,
  category,
  furnishing = 'UNFURNISHED',
}: RentEstimatorWidgetProps) {
  const [data, setData] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ai/rent-estimator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: listingId,
            price,
            city,
            area,
            category,
            furnishing,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to load rent analysis');
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to estimate');
      } finally {
        setLoading(false);
      }
    };

    if (price && city && area && category) {
      fetchEstimate();
    }
  }, [listingId, price, city, area, category, furnishing]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="h-8 bg-slate-100 rounded-xl w-full flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl text-xs text-rose-600 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        <div>
          <h5 className="font-bold">Estimator Offline</h5>
          <p className="mt-0.5 text-slate-500">Could not calculate market metrics at this time.</p>
        </div>
      </div>
    );
  }

  const { verdict, min, max, avg, aiRange, explanation } = data;

  // Compute indicator position (percentage from min to max, bounded)
  const rangeSpan = Math.max(max - min, 1);
  const positionPct = Math.min(Math.max(((price - min) / rangeSpan) * 100, 0), 100);

  const verdictStyles = {
    BELOW_MARKET: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      label: 'Good Deal / Below Market',
      colorCode: '#10b981',
      barColor: 'bg-emerald-500',
    },
    FAIR_PRICE: {
      color: 'text-amber-700 bg-amber-50 border-amber-100',
      label: 'Fair Market Value',
      colorCode: '#f59e0b',
      barColor: 'bg-amber-500',
    },
    ABOVE_MARKET: {
      color: 'text-rose-700 bg-rose-50 border-rose-100',
      label: 'Premium / Above Market',
      colorCode: '#ef4444',
      barColor: 'bg-rose-500',
    },
  };

  const currentStyle = verdictStyles[verdict] || verdictStyles.FAIR_PRICE;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>AI Price Analysis</span>
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${currentStyle.color}`}>
          {currentStyle.label}
        </span>
      </div>

      {/* Visual Gauge Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="relative h-2 bg-slate-100 rounded-full">
          {/* Gauge Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-500/10 rounded-l-full"></div>
          <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-500/10"></div>
          <div className="absolute inset-y-0 left-2/3 w-1/3 bg-rose-500/10 rounded-r-full"></div>

          {/* Indicator Dot */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-700 ${currentStyle.barColor}`}
            style={{ left: `${positionPct}%` }}
            title={`Current Rent: ₹${price.toLocaleString('en-IN')}`}
          ></div>
        </div>

        {/* Labels under the gauge */}
        <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
          <span>Min: ₹{min.toLocaleString('en-IN')}</span>
          <span className="text-slate-500">Avg: ₹{avg.toLocaleString('en-IN')}</span>
          <span>Max: ₹{max.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Pricing Range and Explanation */}
      <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3.5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            AI Fair Range:
          </span>
          <span className="font-extrabold text-indigo-650">{aiRange}</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          {explanation}
        </p>
      </div>

      {/* CTA helper */}
      <div className="pt-1 text-center">
        <Link
          href="/tools/rent-estimator"
          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider"
        >
          <span>Try Standalone Estimator</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
