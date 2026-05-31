'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Star,
  Wifi,
  Volume2,
  Truck,
  ShoppingBag,
  Zap,
  Droplet,
  MessageSquare,
  Loader2,
  User,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AreaReviewsClientProps {
  city: string;
  area: string;
  initialReviews: any[];
  isAuthenticated: boolean;
  currentUserReview: any | null;
}

export default function AreaReviewsClient({
  city,
  area,
  initialReviews,
  isAuthenticated,
  currentUserReview,
}: AreaReviewsClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [safety, setSafety] = useState(currentUserReview?.safety || 5);
  const [waterSupply, setWaterSupply] = useState(currentUserReview?.waterSupply || '24_7');
  const [powerCuts, setPowerCuts] = useState(currentUserReview?.powerCuts || 'RARE');
  const [transport, setTransport] = useState(currentUserReview?.transport || 'EXCELLENT');
  const [market, setMarket] = useState(currentUserReview?.market || 'WALKING');
  const [noise, setNoise] = useState(currentUserReview?.noise || 'QUIET');
  
  // Internet providers
  const initialProviders = currentUserReview?.internetProviders
    ? JSON.parse(currentUserReview.internetProviders)
    : [];
  const [providers, setProviders] = useState<string[]>(initialProviders);
  const [comment, setComment] = useState(currentUserReview?.comment || '');

  const availableProviders = [
    'JioFiber',
    'Airtel Xstream',
    'ACT Fibernet',
    'BSNL FTTH',
    'Hathway',
    'Local Cable',
  ];

  const handleProviderToggle = (provider: string) => {
    if (providers.includes(provider)) {
      setProviders(providers.filter((p) => p !== provider));
    } else {
      setProviders([...providers, provider]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/areas/${encodeURIComponent(city)}/${encodeURIComponent(area)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safety,
          waterSupply,
          powerCuts,
          transport,
          market,
          noise,
          internetProviders: providers,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          currentUserReview
            ? 'Your locality review has been updated!'
            : 'Locality review posted successfully!'
        );
        // Refresh page data
        router.refresh();
        
        // Optimistic update
        const updatedReviews = [...reviews];
        const existingIdx = updatedReviews.findIndex((r) => r.userId === data.userId);
        if (existingIdx > -1) {
          updatedReviews[existingIdx] = { ...updatedReviews[existingIdx], ...data };
        } else {
          updatedReviews.unshift(data);
        }
        setReviews(updatedReviews);
      } else {
        toast.error(data.error || 'Failed to submit locality review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute stats client side based on reviews array state
  const total = reviews.length;
  const avgSafety = total > 0 ? parseFloat((reviews.reduce((sum, r) => sum + r.safety, 0) / total).toFixed(1)) : 0;

  const waterCounts: Record<string, number> = { '24_7': 0, 'TANKER': 0, 'LIMITED': 0 };
  const powerCounts: Record<string, number> = { 'RARE': 0, 'OCCASIONAL': 0, 'FREQUENT': 0 };
  const transportCounts: Record<string, number> = { 'EXCELLENT': 0, 'GOOD': 0, 'POOR': 0 };
  const marketCounts: Record<string, number> = { 'WALKING': 0, '10_MIN': 0, 'FAR': 0 };
  const noiseCounts: Record<string, number> = { 'QUIET': 0, 'MODERATE': 0, 'LOUD': 0 };
  const providerCounts: Record<string, number> = {};

  reviews.forEach((r) => {
    if (waterCounts[r.waterSupply] !== undefined) waterCounts[r.waterSupply]++;
    if (powerCounts[r.powerCuts] !== undefined) powerCounts[r.powerCuts]++;
    if (transportCounts[r.transport] !== undefined) transportCounts[r.transport]++;
    if (marketCounts[r.market] !== undefined) marketCounts[r.market]++;
    if (noiseCounts[r.noise] !== undefined) noiseCounts[r.noise]++;
    
    if (r.internetProviders) {
      try {
        const ps = JSON.parse(r.internetProviders);
        if (Array.isArray(ps)) {
          ps.forEach((p: string) => {
            providerCounts[p] = (providerCounts[p] || 0) + 1;
          });
        }
      } catch {}
    }
  });

  const getDominant = (counts: Record<string, number>, type: 'water' | 'power' | 'transport' | 'market' | 'noise') => {
    if (total === 0) return 'No reviews yet';
    const key = Object.entries(counts).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
    
    if (type === 'water') {
      if (key === '24_7') return '💧 24/7 Supply';
      if (key === 'TANKER') return '🚜 Tanker Dependent';
      return '🚰 Limited Hours';
    }
    if (type === 'power') {
      if (key === 'RARE') return '⚡ Rare Power Cuts';
      if (key === 'OCCASIONAL') return '🔌 Occasional Power Cuts';
      return '🕯️ Frequent Power Cuts';
    }
    if (type === 'transport') {
      if (key === 'EXCELLENT') return '🚇 Excellent Metro/Bus';
      if (key === 'GOOD') return '🚌 Good Cabs/Autos';
      return '🚶 Poor Public Transport';
    }
    if (type === 'market') {
      if (key === 'WALKING') return '🛍️ Walking Distance';
      if (key === '10_MIN') return '🛵 10 Min Ride';
      return '🚗 Far / Drive Needed';
    }
    if (type === 'noise') {
      if (key === 'QUIET') return '🤫 Quiet & Peaceful';
      if (key === 'MODERATE') return '🔉 Moderate Noise';
      return '🔊 Loud & Busy Road';
    }
    return key;
  };

  const getWaterBadgeClass = (val: string) => {
    if (val.includes('24/7')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (val.includes('Tanker')) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-orange-50 text-orange-800 border-orange-100';
  };

  const getPowerBadgeClass = (val: string) => {
    if (val.includes('Rare')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (val.includes('Occasional')) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-rose-50 text-rose-800 border-rose-100';
  };

  const getTransportBadgeClass = (val: string) => {
    if (val.includes('Excellent')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (val.includes('Good')) return 'bg-indigo-50 text-indigo-800 border-indigo-100';
    return 'bg-slate-50 text-slate-800 border-slate-150';
  };

  const getMarketBadgeClass = (val: string) => {
    if (val.includes('Walking')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (val.includes('10 Min')) return 'bg-indigo-50 text-indigo-800 border-indigo-100';
    return 'bg-slate-50 text-slate-800 border-slate-150';
  };

  const getNoiseBadgeClass = (val: string) => {
    if (val.includes('Quiet')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (val.includes('Moderate')) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-rose-50 text-rose-800 border-rose-100';
  };

  return (
    <div className="space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <div className="flex items-center gap-2 mt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <MapPin className="w-7 h-7 text-indigo-600" />
              <span>{area} Reviews</span>
            </h1>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">
              {city}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Tenant-sourced reviews on safety, water supply, power cuts, noise, transport, and internet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Stats & Reviews timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Locality score highlights cards */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-50 pb-2">
              🏘️ Locality Summary Insights ({total} {total === 1 ? 'review' : 'reviews'})
            </h3>
            
            {total === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm font-semibold">
                No summaries available. Be the first to share details!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Safety */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Safety Score</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{avgSafety}</span>
                    <span className="text-xs text-slate-400 font-bold">/ 5</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(avgSafety) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Water supply */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Water Quality</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border ${getWaterBadgeClass(getDominant(waterCounts, 'water'))}`}>
                      {getDominant(waterCounts, 'water')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-2 uppercase tracking-wider">Most reported status</p>
                </div>

                {/* Power cuts */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Power Stability</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border ${getPowerBadgeClass(getDominant(powerCounts, 'power'))}`}>
                      {getDominant(powerCounts, 'power')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-2 uppercase tracking-wider">Most reported status</p>
                </div>

                {/* Public Transport */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Transport Connectivity</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border ${getTransportBadgeClass(getDominant(transportCounts, 'transport'))}`}>
                      {getDominant(transportCounts, 'transport')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-2 uppercase tracking-wider">Most reported status</p>
                </div>

                {/* Market access */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Market Access</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border ${getMarketBadgeClass(getDominant(marketCounts, 'market'))}`}>
                      {getDominant(marketCounts, 'market')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-2 uppercase tracking-wider">Most reported status</p>
                </div>

                {/* Noise */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-violet-500" />
                    <span>Noise Levels</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border ${getNoiseBadgeClass(getDominant(noiseCounts, 'noise'))}`}>
                      {getDominant(noiseCounts, 'noise')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-2 uppercase tracking-wider">Most reported status</p>
                </div>
              </div>
            )}

            {/* Providers aggregates list */}
            {Object.keys(providerCounts).length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Available Internet Providers (Vouched count)</span>
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(providerCounts).map(([provider, count]) => (
                    <span key={provider} className="text-xs bg-indigo-50/80 text-indigo-800 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                      <span>📶 {provider}</span>
                      <strong className="bg-indigo-200/60 text-indigo-900 rounded-full px-1.5 py-0.5 text-[10px] font-black">{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Reviews List */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-50 pb-2">
              <MessageSquare className="w-5 h-5 text-indigo-650" />
              <span>Locality Comments & Safety Review</span>
            </h3>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
                No locality reviews have been submitted for {area} yet. Be the first to share your experience!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-5 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-750 uppercase shrink-0 text-sm border border-indigo-150">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{rev.user?.name || 'Anonymous Tenant'}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-55 text-amber-900 border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-extrabold shadow-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Safety: {rev.safety}/5</span>
                        </div>
                      </div>

                      {/* Ratings categories tags */}
                      <div className="flex flex-wrap gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                        <span className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          Water: {rev.waterSupply === '24_7' ? '24/7' : rev.waterSupply === 'TANKER' ? 'Tanker' : 'Limited'}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          Power: {rev.powerCuts === 'RARE' ? 'Rare' : rev.powerCuts === 'OCCASIONAL' ? 'Occasional' : 'Frequent'}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          Transport: {rev.transport.toLowerCase()}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          Market: {rev.market === 'WALKING' ? 'walking' : rev.market === '10_MIN' ? '10 min' : 'far'}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          Noise: {rev.noise.toLowerCase()}
                        </span>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50/30 p-2.5 border border-slate-100/50 rounded-xl">
                          {rev.comment}
                        </p>
                      )}

                      {/* Internet providers reported */}
                      {rev.internetProviders && (
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400 font-semibold">
                          <span>🌐 Vouched ISP:</span>
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(rev.internetProviders).map((p: string) => (
                              <span key={p} className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right review form or auth block */}
        <div className="space-y-6">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  <span>{currentUserReview ? 'Update Your Review' : 'Write Locality Review'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wide">
                  Reviewing {area}, {city}
                </p>
              </div>

              {/* Safety Star Rating slider */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between">
                  <span>Safety Rating</span>
                  <span className="text-indigo-650 font-black">{safety} / 5</span>
                </label>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSafety(star)}
                      className="cursor-pointer transition hover:scale-110 focus:outline-hidden"
                    >
                      <Star className={`w-7.5 h-7.5 ${star <= safety ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorical Dropdowns */}
              <div className="space-y-3.5 border-t border-slate-50 pt-3">
                {/* Water supply */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Water Supply Status</label>
                  <select
                    value={waterSupply}
                    onChange={(e) => setWaterSupply(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    <option value="24_7">💧 24/7 Running Water</option>
                    <option value="TANKER">🚜 Tanker Dependent / No Municipal Water</option>
                    <option value="LIMITED">🚰 Limited / Scheduled Hours</option>
                  </select>
                </div>

                {/* Power cuts */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Power Cut Frequency</label>
                  <select
                    value={powerCuts}
                    onChange={(e) => setPowerCuts(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    <option value="RARE">⚡ Rare / Backup Unnecessary</option>
                    <option value="OCCASIONAL">🔌 Occasional (1-2 hrs weekly)</option>
                    <option value="FREQUENT">🕯️ Frequent (Daily / Heavy cuts)</option>
                  </select>
                </div>

                {/* Transport */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transport & Connectivity</label>
                  <select
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    <option value="EXCELLENT">🚇 Excellent (Metro station / major stops nearby)</option>
                    <option value="GOOD">🚌 Good (Auto stand / active cab booking)</option>
                    <option value="POOR">🚶 Poor (Remote area / long wait times)</option>
                  </select>
                </div>

                {/* Market */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Grocery Market</label>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    <option value="WALKING">🛍️ Walking Distance (&lt; 5 mins)</option>
                    <option value="10_MIN">🛵 Short Ride (within 10 mins)</option>
                    <option value="FAR">🚗 Far Away (delivery only / drive needed)</option>
                  </select>
                </div>

                {/* Noise */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ambient Noise Level</label>
                  <select
                    value={noise}
                    onChange={(e) => setNoise(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    <option value="QUIET">🤫 Quiet & Residential</option>
                    <option value="MODERATE">🔉 Moderate (Some traffic / daily chaos)</option>
                    <option value="LOUD">🔊 Loud & Busy (Main road / construction / markets)</option>
                  </select>
                </div>
              </div>

              {/* Internet Providers Multiselect */}
              <div className="space-y-2 border-t border-slate-50 pt-3">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reliable Internet Providers (Select multiple)</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {availableProviders.map((provider) => {
                    const active = providers.includes(provider);
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => handleProviderToggle(provider)}
                        className={`text-left text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer ${
                          active
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {active ? '✅ ' : '📶 '}
                        {provider}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text area */}
              <div className="space-y-1 border-t border-slate-50 pt-3">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Additional Locality Details</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about safety at night, neighborhood vibes, water logging, garbage disposal..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden transition resize-none text-slate-650"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-350"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Locality Review</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50 to-indigo-50/20 border border-indigo-100 rounded-2xl p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-indigo-650" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Write a Locality Review</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] mx-auto leading-relaxed font-semibold">
                  Sign in now to tell others about safety, electricity stability, water supply, and local fiber connectivity in {area}!
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition active:scale-[0.98]"
              >
                Sign In to Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
