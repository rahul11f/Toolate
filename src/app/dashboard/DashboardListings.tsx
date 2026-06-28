'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, ExternalLink, Building, IndianRupee, EyeOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { ListingStatus } from '@/lib/types';

interface ListingItem {
  id: string;
  title: string;
  category: string;
  price: number;
  area: string;
  status: ListingStatus;
  createdAt: Date | string;
  expiresAt?: Date | string | null;
}

interface DashboardListingsProps {
  initialListings: ListingItem[];
}

export default function DashboardListings({ initialListings }: DashboardListingsProps) {
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [freezingId, setFreezingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete listing "${title}"?`)) return;

    setDeletingId(id);
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
      setDeletingId(null);
    }
  };

  const handleRenew = async (id: string) => {
    setRenewingId(id);
    try {
      const res = await fetch(`/api/listings/${id}/renew`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to renew listing.');
      } else {
        toast.success('Listing renewed! It is now pending admin re-approval.');
        // Update local status to PENDING and extend expiresAt by 60 days
        const newExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        setListings(prev =>
          prev.map((l) =>
            l.id === id
              ? { ...l, status: ListingStatus.PENDING, expiresAt: newExpiresAt }
              : l
          )
        );
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setRenewingId(null);
    }
  };

  const handleFreezeToggle = async (id: string, currentStatus: ListingStatus) => {
    setFreezingId(id);
    const newStatus = currentStatus === ListingStatus.FROZEN ? ListingStatus.APPROVED : ListingStatus.FROZEN;
    try {
      const res = await fetch(`/api/listings/${id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(newStatus === ListingStatus.FROZEN ? 'Listing is now hidden' : 'Listing is now active');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setFreezingId(null);
    }
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Approved
          </span>
        );
      case ListingStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            Pending Approval
          </span>
        );
      case ListingStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            Rejected
          </span>
        );
      case ListingStatus.FROZEN:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Hidden / Frozen
          </span>
        );
      case 'EXPIRED' as any:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-650 border border-slate-200">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-4">
        <Building className="w-12 h-12 mx-auto text-slate-300" />
        <p className="font-medium">You haven't posted any advertisements yet.</p>
        <Link
          href="/listings/create"
          className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer select-none"
        >
          Post Your First Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-55 border-b border-slate-100 text-slate-450 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Title / Category</th>
              <th className="px-6 py-4">Area</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date Posted</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-650">
            {listings.map((listing) => {
              const daysRemaining = listing.expiresAt
                ? Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 60;
              const isExpired = listing.status === ('EXPIRED' as any) || daysRemaining <= 0;
              const isCloseToExpiry = !isExpired && daysRemaining > 0 && daysRemaining <= 7;

              return (
                <tr key={listing.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 line-clamp-1">{listing.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                        {listing.category.toLowerCase()}
                      </span>
                      {isExpired && (
                        <span className="text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase">
                          Expired
                        </span>
                      )}
                      {isCloseToExpiry && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">
                          Expires in {daysRemaining}d
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[150px]">{listing.area}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-450" />
                      <span>{listing.price.toLocaleString('en-IN')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(isExpired ? ('EXPIRED' as any) : listing.status)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {(isExpired || isCloseToExpiry) && (
                        <button
                          onClick={() => handleRenew(listing.id)}
                          disabled={renewingId === listing.id}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 hover:text-indigo-850 font-bold text-xs rounded-lg border border-indigo-100 transition cursor-pointer select-none disabled:opacity-50"
                        >
                          {renewingId === listing.id ? 'Renewing...' : 'Renew'}
                        </button>
                      )}
                      {(listing.status === ListingStatus.APPROVED || listing.status === ListingStatus.FROZEN) && !isExpired && (
                        <button
                          onClick={() => handleFreezeToggle(listing.id, listing.status)}
                          disabled={freezingId === listing.id}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition"
                          title={listing.status === ListingStatus.FROZEN ? 'Unhide Listing' : 'Hide / Freeze Listing'}
                        >
                          {listing.status === ListingStatus.FROZEN ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      )}
                      {!isExpired && (
                        <Link
                          href={`/listings/${listing.id}`}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition"
                          title="Preview Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/listings/edit/${listing.id}`}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded-lg transition"
                        title="Edit Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id, listing.title)}
                        disabled={deletingId === listing.id}
                        className="p-2 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Remove Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
