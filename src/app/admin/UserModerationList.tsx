'use client';

import { useState } from 'react';
import { UserMinus, User, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date | string;
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
              <tr key={user.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 flex items-center space-x-3">
                  <div className="bg-slate-100 p-2 rounded-full text-slate-400">
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
                <td className="px-6 py-4 font-semibold text-slate-700">{user._count.listings} ads</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
