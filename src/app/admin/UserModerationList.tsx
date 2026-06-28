'use client';

import { useState, Fragment } from 'react';
import { UserMinus, UserCheck, User, ChevronDown, ChevronUp, Trash2, EyeOff, CheckCircle, ShieldBan, ShieldCheck, Edit2, ExternalLink, RotateCcw, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ListingSummary {
  id: string;
  title: string;
  category: string;
  price: number;
  status: string;
  featured?: boolean;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isBanned: boolean;
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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loadingListingId, setLoadingListingId] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // DELETE: permanently removes user from database
  // The email can be reused to create a new account
  // ──────────────────────────────────────────────
  const handleDeleteUser = async (id: string, email: string) => {
    if (id === currentAdminId) {
      toast.error('You cannot delete yourself.');
      return;
    }
    if (!confirm(`DELETE user "${email}"?\n\nThis permanently removes the account and ALL their data (listings, sessions, etc.).\nThe email will be FREE to re-register.\n\nAre you sure?`)) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user.');
      } else {
        toast.success(`User "${email}" permanently deleted. Email is free to re-use.`);
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────
  // BAN: blocks user from logging in forever
  // Email CANNOT be re-used (user stays in DB)
  // ──────────────────────────────────────────────
  const handleBanUser = async (id: string, email: string) => {
    if (id === currentAdminId) {
      toast.error('You cannot ban yourself.');
      return;
    }
    if (!confirm(`BAN user "${email}"?\n\nThey will be permanently blocked from logging in.\nTheir email CANNOT be re-used for a new account.\nYou can unban them later from this dashboard.\n\nAre you sure?`)) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/ban`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to ban user.');
      } else {
        toast.success(`User "${email}" banned. They cannot log in.`);
        setUsers(users.map((u) => u.id === id ? { ...u, isBanned: true } : u));
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────
  // UNBAN: restores login access
  // ──────────────────────────────────────────────
  const handleUnbanUser = async (id: string, email: string) => {
    if (!confirm(`UNBAN user "${email}"?\n\nThey will be able to log in again.`)) return;

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/unban`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to unban user.');
      } else {
        toast.success(`User "${email}" has been unbanned.`);
        setUsers(users.map((u) => u.id === id ? { ...u, isBanned: false } : u));
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveListing = async (userId: string, listingId: string) => {
    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to approve listing.');
      } else {
        toast.success('Listing approved & published.');
        setUsers(users.map((u) => {
          if (u.id !== userId) return u;
          return { ...u, listings: u.listings.map((l) => l.id === listingId ? { ...l, status: 'APPROVED' } : l) };
        }));
      }
    } catch {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleRejectListing = async (userId: string, listingId: string) => {
    const reason = prompt('Please enter the reason for hiding/rejecting this listing:', 'Inappropriate content or violates terms.');
    if (reason === null) return;

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
        setUsers(users.map((u) => {
          if (u.id !== userId) return u;
          return { ...u, listings: u.listings.map((l) => l.id === listingId ? { ...l, status: 'REJECTED' } : l) };
        }));
      }
    } catch {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleReviewAgain = async (userId: string, listingId: string) => {
    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/pending`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to re-queue listing.');
      } else {
        toast.success('Listing queued for review (PENDING).');
        setUsers(users.map((u) => {
          if (u.id !== userId) return u;
          return { ...u, listings: u.listings.map((l) => l.id === listingId ? { ...l, status: 'PENDING' } : l) };
        }));
      }
    } catch {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleToggleFeature = async (userId: string, listingId: string, currentFeatured: boolean) => {
    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/feature`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to toggle featured status.');
      } else {
        toast.success(data.featured ? 'Listing marked as Featured!' : 'Listing is no longer featured.');
        setUsers(users.map((u) => {
          if (u.id !== userId) return u;
          return { ...u, listings: u.listings.map((l) => l.id === listingId ? { ...l, featured: data.featured } : l) };
        }));
      }
    } catch {
      toast.error('Failed to communicate with API.');
    } finally {
      setLoadingListingId(null);
    }
  };

  const handleDeleteListing = async (userId: string, listingId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete listing "${title}"?`)) return;

    setLoadingListingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete listing.');
      } else {
        toast.success('Listing permanently deleted.');
        setUsers(users.map((u) => {
          if (u.id !== userId) return u;
          return { ...u, listings: u.listings.filter((l) => l.id !== listingId), _count: { ...u._count, listings: u._count.listings - 1 } };
        }));
      }
    } catch {
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
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role / Status</th>
              <th className="px-6 py-4">Listings Posted</th>
              <th className="px-6 py-4">Registered</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-650">
            {users.map((user) => (
              <Fragment key={user.id}>
                <tr className={`hover:bg-slate-50/50 transition ${user.isBanned ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <button
                      onClick={() => toggleExpandUser(user.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title="View user listings"
                    >
                      {expandedUserId === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className={`p-2 rounded-full shrink-0 ${user.isBanned ? 'bg-rose-100 text-rose-400' : 'bg-slate-100 text-slate-400'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{user.name || 'Anonymous User'}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-150'
                      }`}>
                        {user.role}
                      </span>
                      {user.isBanned && (
                        <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          <ShieldBan className="w-3 h-3" /> Banned
                        </span>
                      )}
                    </div>
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
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* UNBAN — only shown if user is currently banned */}
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user.id, user.email || '')}
                            disabled={loadingId === user.id}
                            title="Unban this user — restores their login access"
                            className="inline-flex items-center space-x-1 border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Unban</span>
                          </button>
                        ) : (
                          /* BAN — soft bans user, keeps email blocked forever until unbanned */
                          <button
                            onClick={() => handleBanUser(user.id, user.email || '')}
                            disabled={loadingId === user.id}
                            title="Ban this user — they cannot log in, email is blocked"
                            className="inline-flex items-center space-x-1 border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            <ShieldBan className="w-3.5 h-3.5" />
                            <span>Ban</span>
                          </button>
                        )}

                        {/* DELETE — hard deletes, email is freed up to re-register */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email || '')}
                          disabled={loadingId === user.id}
                          title="Delete user — permanently removes account. Email can be re-used."
                          className="inline-flex items-center space-x-1 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-350 italic pr-4">You (Admin Owner)</span>
                    )}
                  </td>
                </tr>

                {/* Listings accordion */}
                {expandedUserId === user.id && (
                  <tr className="bg-slate-50/40">
                    <td colSpan={5} className="px-8 py-5 border-y border-slate-100/60">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">
                            Listings by {user.name || user.email}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            Total: {user.listings.length} properties
                          </span>
                        </div>

                        {user.listings.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">
                            This user has not posted any listings.
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
                                    {listing.featured && (
                                      <span className="text-[8px] bg-amber-100 border border-amber-300 text-amber-700 font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Featured
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-semibold text-slate-500">
                                    ₹{listing.price.toLocaleString('en-IN')}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                  {/* Visit Button */}
                                  <Link
                                    href={`/listings/${listing.id}`}
                                    className="p-1.5 border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition"
                                    title="Visit / Preview Listing"
                                    target="_blank"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>

                                  {/* Edit Button */}
                                  <Link
                                    href={`/listings/edit/${listing.id}`}
                                    className="p-1.5 border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition"
                                    title="Edit Listing (Admin)"
                                    target="_blank"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Link>

                                  {/* Feature Toggle */}
                                  <button
                                    onClick={() => handleToggleFeature(user.id, listing.id, !!listing.featured)}
                                    disabled={loadingListingId === listing.id}
                                    className={`p-1.5 border rounded-lg transition disabled:opacity-50 cursor-pointer ${
                                      listing.featured 
                                        ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200'
                                    }`}
                                    title={listing.featured ? 'Unfeature Listing' : 'Mark as Featured'}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${listing.featured ? 'fill-amber-500' : ''}`} />
                                  </button>

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

                                  {/* Review Again (Only if rejected or frozen) */}
                                  {(listing.status === 'REJECTED' || listing.status === 'FROZEN') && (
                                    <button
                                      onClick={() => handleReviewAgain(user.id, listing.id)}
                                      disabled={loadingListingId === listing.id}
                                      className="inline-flex items-center space-x-1 border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none disabled:bg-slate-200"
                                      title="Set back to PENDING for re-review"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Review</span>
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
