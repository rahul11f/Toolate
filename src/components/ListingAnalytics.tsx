'use client';

import { useState, useEffect } from 'react';
import { Eye, MessageSquare, Heart, Share2, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ListingItem {
  id: string;
  title: string;
  category: string;
  price: number;
  area: string;
}

interface ListingAnalyticsProps {
  listings: ListingItem[];
}

export default function ListingAnalytics({ listings }: ListingAnalyticsProps) {
  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-450 space-y-3">
        <BarChart2 className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
        <h4 className="font-bold text-slate-700">No Analytics Available</h4>
        <p className="text-xs max-w-xs mx-auto">Create and get approved listings to start tracking visitor and inquiry analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Advertisements Performance</h2>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Track real-time page views, roommate inquiries, and listing shares.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {listings.map((listing) => (
          <ListingAnalyticsCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingAnalyticsCard({ listing }: { listing: ListingItem }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ VIEW: 0, INQUIRY: 0, SAVE: 0, SHARE: 0 });
  const [sparkline, setSparkline] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/listings/${listing.id}/events`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setSparkline(data.sparkline);
        }
      } catch (err) {
        console.error('Failed to load stats for listing:', listing.id, err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [listing.id]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-[180px]">
        <Loader2 className="w-6 h-6 text-indigo-650 animate-spin" />
      </div>
    );
  }

  // Find max count for height calculations
  const maxCount = Math.max(...sparkline.map((d) => d.count), 1);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 hover:shadow-md transition duration-200">
      {/* Listing Info & Stats Block (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[9px] bg-indigo-55 text-indigo-650 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            {listing.category.toLowerCase()}
          </span>
          <h4 className="font-extrabold text-slate-800 text-base mt-1 line-clamp-1">{listing.title}</h4>
          <p className="text-[11px] text-slate-450 font-bold mt-0.5">{listing.area}</p>
        </div>

        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Views */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center space-y-1">
            <Eye className="w-4 h-4 text-indigo-500 mx-auto" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Views</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{stats.VIEW.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Inquiries */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center space-y-1">
            <MessageSquare className="w-4 h-4 text-emerald-500 mx-auto" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Inquiries</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{stats.INQUIRY.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Saves */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center space-y-1">
            <Heart className="w-4 h-4 text-rose-500 mx-auto" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Saves</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{stats.SAVE.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Shares */}
          <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center space-y-1">
            <Share2 className="w-4 h-4 text-violet-500 mx-auto" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400">Shares</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{stats.SHARE.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sparkline views graph (5 cols) */}
      <div className="lg:col-span-5 bg-slate-50 border border-slate-100/70 rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
          <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> 14-Day View Traffic
          </span>
          <span className="text-[10px] text-indigo-650 font-extrabold font-mono">
            {sparkline.reduce((sum, d) => sum + d.count, 0)} total
          </span>
        </div>

        {/* CSS Sparkline Chart container */}
        <div className="flex items-end justify-between h-20 pt-4 relative group">
          {sparkline.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">
              No traffic recorded yet
            </div>
          ) : (
            sparkline.map((day, idx) => {
              const pct = (day.count / maxCount) * 100;
              const formattedDate = new Date(day.date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group/bar cursor-pointer relative"
                  style={{ height: '100%' }}
                >
                  {/* Bar */}
                  <div
                    className="w-2.5 bg-indigo-500/80 hover:bg-indigo-600 rounded-t-sm transition-all duration-300 self-end"
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  ></div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-md opacity-0 group-hover/bar:opacity-100 transition pointer-events-none whitespace-nowrap z-30 font-bold">
                    {formattedDate}: {day.count} views
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase pt-2 border-t border-slate-200/40">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
