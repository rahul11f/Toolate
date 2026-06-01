'use client';

import { useState } from 'react';
import { UserMinus, User, ChevronDown, ChevronUp, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ListingSummary {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date | string;
  listings: ListingSummary[];
  _count: {
    listings: number;
  };
}

interface UserModerationListProps {
  initialUsers: UserItem[];
  currentAdminId: string;
}

export default function UserModerationList({ initialUsers, currentAdminId }: UserModerationListProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loadingListingId, setLoadingListingId] = useState<string | null>(null);

  const handleBanUser = async (id: string, email: string) => {
    if (id === currentAdminId) {
      toast.error('You cannot delete or ban yourself.');
      return;
    }

    if (!confirm(`WARNING: Banning user "${email}" will permanently DELETE their account and CASCADE delete all their listings, logs, and sessions. Are you sure you want to proceed?`)) {
      return;
    }

    setBanningId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/ban`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to ban/delete user.');
      } else {
        toast.success(`User "${email}" successfully banned and purged.`);
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setBanningId(null);
    }
  };

  const handleApproveListing = async (userId: string, listingId: string) => {
    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to approve listing.');
      } else {
        toast.success('Listing approved & published.');
        setUsers(
          users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              listings: u.listings.map((l) =>
                l.id === listingId ? { ...l, status: 'APPROVED' } : l
              ),
            };
          })
        );
      }
    } catch (err) {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleRejectListing = async (userId: string, listingId: string) => {
    const reason = prompt('Please enter the reason for hiding/rejecting this listing:', 'Inappropriate content or violates terms.');
    if (reason === null) return; // cancelled

    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reject listing.');
      } else {
        toast.success('Listing rejected & hidden.');
        setUsers(
          users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              listings: u.listings.map((l) =>
                l.id === listingId ? { ...l, status: 'REJECTED' } : l
              ),
            };
          })
        );
      }
    } catch (err) {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleDeleteListing = async (userId: string, listingId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete listing "${title}"?`)) return;

    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete listing.');
      } else {
        toast.success('Listing permanently deleted.');
        setUsers(
          users.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              listings: u.listings.filter((l) => l.id !== listingId),
              _count: {
                ...u._count,
                listings: u._count.listings - 1,
              },
            };
          })
        );
      }
    } catch (err) {
      toast.error('Failed to delete listing.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const toggleExpandUser = (id: string) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-55 border-b border-slate-100 text-slate-450 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Listings Posted</th>
              <th className="px-6 py-4">Registration Date</th>
              <th className="px-6 py-4 text-right">Moderation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-650">
            {users.map((user) => (
              <>
                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <button
                      onClick={() => toggleExpandUser(user.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title="View user listings"
                    >
                      {expandedUserId === user.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className="bg-slate-100 p-2 rounded-full text-slate-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{user.name || 'Anonymous User'}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-150'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleExpandUser(user.id)}
                      className="text-indigo-600 hover:underline font-semibold text-left transition select-none cursor-pointer"
                    >
                      {user._count.listings} ads
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentAdminId ? (
                      <button
                        onClick={() => handleBanUser(user.id, user.email || '')}
                        disabled={banningId === user.id}
                        className="inline-flex items-center space-x-1 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Ban Account</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-350 italic pr-4">You (Owner)</span>
                    )}
                  </td>
                </tr>
                
                {/* Accordion expand list for user properties */}
                {expandedUserId === user.id && (
                  <tr className="bg-slate-50/40">
                    <td colSpan={5} className="px-8 py-5 border-y border-slate-100/60">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">
                            Listings published by {user.name || user.email}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            Total: {user.listings.length} properties
                          </span>
                        </div>

                        {user.listings.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">
                            This user has not posted any property coordinates.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                            {user.listings.map((listing) => (
                              <div key={listing.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800">{listing.title}</span>
                                    <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-bold uppercase px-1.5 py-0.5 rounded">
                                      {listing.category.toLowerCase()}
                                    </span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                      listing.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                                      listing.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                                      'bg-rose-50 text-rose-700 border-rose-150'
                                    }`}>
                                      {listing.status}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-slate-500">
                                    Expected Rent: ₹{listing.price.toLocaleString('en-IN')}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {listing.status !== 'APPROVED' ? (
                                    <button
                                      onClick={() => handleApproveListing(user.id, listing.id)}
                                      disabled={loadingListingId === listing.id}
                                      className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none disabled:bg-slate-200"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Publish</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRejectListing(user.id, listing.id)}
                                      disabled={loadingListingId === listing.id}
                                      className="inline-flex items-center space-x-1 border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none disabled:bg-slate-200"
                                    >
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Hide Ad</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteListing(user.id, listing.id, listing.title)}
                                    disabled={loadingListingId === listing.id}
                                    className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 hover:border-rose-250 rounded-lg transition cursor-pointer disabled:opacity-50"
                                    title="Delete Listing permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
