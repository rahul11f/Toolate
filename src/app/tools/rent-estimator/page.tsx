'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, ArrowLeft, Calculator, IndianRupee, MapPin, ClipboardList, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { ListingCategory } from '@/lib/types';

interface EstimateResult {
  price: number;
  min: number;
  max: number;
  avg: number;
  sampleSize: number;
  verdict: 'BELOW_MARKET' | 'FAIR_PRICE' | 'ABOVE_MARKET';
  aiRange: string;
  explanation: string;
}

export default function RentEstimatorToolPage() {
  const [city, setCity] = useState('Bangalore');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState<ListingCategory>(ListingCategory.HOUSE);
  const [furnishing, setFurnishing] = useState('UNFURNISHED');
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area.trim()) {
      toast.error('Please enter an area/locality.');
      return;
    }
    if (price <= 0) {
      toast.error('Please enter a valid monthly rent price.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/rent-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          city,
          area,
          category,
          furnishing,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to compute rent estimate');
      }

      const json = await res.json();
      setResult(json);
      toast.success('Rent analysis computed!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const verdictStyles = {
    BELOW_MARKET: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      label: 'Good Deal / Below Market Price',
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
      label: 'Premium / Above Market Price',
      colorCode: '#ef4444',
      barColor: 'bg-rose-500',
    },
  };

  const currentStyle = result ? (verdictStyles[result.verdict] || verdictStyles.FAIR_PRICE) : null;
  const positionPct = result ? Math.min(Math.max(((result.price - result.min) / Math.max(result.max - result.min, 1)) * 100, 0), 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back & Header */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-655 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Rent Price Estimator
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Analyze monthly rent against local market historical averages
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Form panel */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit space-y-5">
          <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-2">Enter Property Details</h3>
          
          <form onSubmit={handleEstimate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl outline-hidden transition font-medium"
              >
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Area / Locality</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Indiranagar, HSR Layout"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-3.5 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl outline-hidden transition font-medium"
              >
                {Object.values(ListingCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Furnished Status</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-3.5 py-2.5 rounded-xl outline-hidden transition font-medium"
              >
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="FURNISHED">Fully Furnished</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Rent (INR)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 18500"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-3.5 py-2.5 rounded-xl outline-hidden transition font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm py-3 rounded-xl transition shadow-md cursor-pointer select-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Estimate...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Rent</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="md:col-span-3 space-y-6">
          {!result ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-450 h-full flex flex-col justify-center items-center">
              <ClipboardList className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3 animate-bounce" />
              <h4 className="font-bold text-slate-700">No Assessment Computed Yet</h4>
              <p className="text-xs max-w-xs mt-1">Enter property details on the left and click "Evaluate Rent" to run the assessment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI Estimation Results
                </h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-md border uppercase ${currentStyle?.color}`}>
                  {currentStyle?.label}
                </span>
              </div>

              {/* Price gauge */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Locality Valuation Gauge</h4>
                <div className="relative h-3 bg-slate-100 rounded-full">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-500/10 rounded-l-full"></div>
                  <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-500/10"></div>
                  <div className="absolute inset-y-0 left-2/3 w-1/3 bg-rose-500/10 rounded-r-full"></div>

                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full border-2 border-white shadow-md transition-all duration-700 ${currentStyle?.barColor}`}
                    style={{ left: `${positionPct}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-bold font-mono pt-1">
                  <span>Min: ₹{result.min.toLocaleString('en-IN')}</span>
                  <span className="text-slate-500">Avg: ₹{result.avg.toLocaleString('en-IN')}</span>
                  <span>Max: ₹{result.max.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Analysis Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Price</span>
                  <p className="font-extrabold text-xl text-slate-800 flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {result.price.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Market Avg (Indicated)</span>
                  <p className="font-extrabold text-xl text-indigo-700 flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {result.avg.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Explanation box */}
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>AI Analyst Opinion</span>
                </h4>
                <div className="text-sm font-semibold text-indigo-950 flex justify-between items-center pb-1.5 border-b border-indigo-100/40">
                  <span>Locality Market Range:</span>
                  <span className="text-indigo-650 bg-white px-3 py-0.5 rounded-lg border border-indigo-100 text-xs font-bold">{result.aiRange}</span>
                </div>
                <p className="text-xs text-indigo-850 leading-relaxed font-medium">
                  {result.explanation}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed">
                * Estimates are calculated dynamically from matching platform listings within the last 90 days. Always inspect properties in person before making deposits.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
