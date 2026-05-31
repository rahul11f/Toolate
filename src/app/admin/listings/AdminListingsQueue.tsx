'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Trash2, ExternalLink, Building, IndianRupee, MessageSquare, AlertCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { ListingStatus } from '@/lib/types';

interface ListingItem {
  id: string;
  title: string;
  category: string;
  price: number;
  area: string;
  status: ListingStatus;
  featured: boolean;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string | null;
  };
  aiFraudScore?: number | null;
  aiFraudFlags?: string | null;
}

interface AdminListingsQueueProps {
  initialListings: ListingItem[];
}

export default function AdminListingsQueue({ initialListings }: AdminListingsQueueProps) {
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<string>('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'

  const handleToggleFeature = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/feature`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to toggle featured status.');
      } else {
        const isFeaturedNow = data.listing.featured;
        toast.success(isFeaturedNow ? 'Listing is now featured.' : 'Listing is no longer featured.');
        setListings(
          listings.map((l) => (l.id === id ? { ...l, featured: isFeaturedNow } : l))
        );
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to approve listing.');
      } else {
        toast.success('Listing approved successfully.');
        setListings(
          listings.map((l) => (l.id === id ? { ...l, status: ListingStatus.APPROVED } : l))
        );
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    setActionId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reject listing.');
      } else {
        toast.success('Listing rejected successfully.');
        setListings(
          listings.map((l) => (l.id === id ? { ...l, status: ListingStatus.REJECTED } : l))
        );
        setRejectId(null);
        setRejectReason('');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete listing "${title}"?`)) return;

    setActionId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete listing.');
      } else {
        toast.success('Listing deleted successfully.');
        setListings(listings.filter((l) => l.id !== id));
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setActionId(null);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  const getStatusColor = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.APPROVED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case ListingStatus.PENDING:
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case ListingStatus.REJECTED:
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setRejectId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm'
                : 'bg-white text-slate-550 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()} Listings ({listings.filter(l => f === 'ALL' || l.status === f).length})
          </button>
        ))}
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          No listings matched this status filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
                      {listing.category.toLowerCase()}
                    </span>
                    {listing.featured && (
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 select-none animate-pulse">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base line-clamp-1">{listing.title}</h3>
                  <div className="flex items-center text-sm font-extrabold text-slate-800">
                    <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-450" />
                    <span>{listing.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {listing.aiFraudScore !== undefined && listing.aiFraudScore !== null && listing.aiFraudScore >= 40 && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">AI Flagged Scam Risk: {listing.aiFraudScore}%</div>
                      {listing.aiFraudFlags && (() => {
                        try {
                          const flags: string[] = typeof listing.aiFraudFlags === 'string' 
                            ? JSON.parse(listing.aiFraudFlags) 
                            : listing.aiFraudFlags;
                          if (flags && flags.length > 0) {
                            return (
                              <ul className="list-disc list-inside mt-1 font-semibold text-rose-600 text-[10px] space-y-0.5">
                                {flags.map((flag, idx) => (
                                  <li key={idx}>{flag}</li>
                                ))}
                              </ul>
                            );
                          }
                        } catch {}
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Area: {listing.area} | Mapped by: {listing.user.name || 'Anonymous'} ({listing.user.email})
                </p>
              </div>

              {/* Action buttons drawer */}
              <div className="border-t border-slate-50 pt-4 space-y-4">
                {/* Rejection input card */}
                {rejectId === listing.id ? (
                  <form onSubmit={(e) => handleRejectSubmit(e, listing.id)} className="space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (e.g. invalid contact)..."
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden focus:bg-white"
                      disabled={actionId === listing.id}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectId(null)}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionId === listing.id}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Submit Reject
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleFeature(listing.id)}
                        disabled={actionId !== null}
                        className={`inline-flex items-center space-x-1 border px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                          listing.featured
                            ? 'bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-100'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                        title={listing.featured ? 'Remove featured badge' : 'Make listing featured'}
                      >
                        <Star className={`w-3.5 h-3.5 ${listing.featured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                        <span>{listing.featured ? 'Featured' : 'Feature'}</span>
                      </button>

                      {listing.status === ListingStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleApprove(listing.id)}
                            disabled={actionId !== null}
                            className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none shadow-xs disabled:bg-slate-250"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectId(listing.id);
                              setRejectReason('');
                            }}
                            disabled={actionId !== null}
                            className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none disabled:text-slate-350"
                          >
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      
                      {listing.status === ListingStatus.REJECTED && (
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={actionId !== null}
                          className="inline-flex items-center space-x-1 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Re-approve</span>
                        </button>
                      )}

                      {listing.status === ListingStatus.APPROVED && (
                        <button
                          onClick={() => {
                            setRejectId(listing.id);
                            setRejectReason('');
                          }}
                          disabled={actionId !== null}
                          className="inline-flex items-center space-x-1 border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject/Revoke</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition"
                        title="View details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/listings/edit/${listing.id}`}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 text-indigo-650 rounded-lg transition"
                        title="Edit details"
                      >
                        <Building className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id, listing.title)}
                        disabled={actionId !== null}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
