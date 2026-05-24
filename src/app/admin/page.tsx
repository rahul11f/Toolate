import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role, ListingStatus } from '@/lib/types';
import { Users, Building, ShieldAlert, CheckCircle, FileText, ClipboardList, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import UserModerationList from './UserModerationList';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== Role.ADMIN) {
    redirect('/');
  }

  const currentAdminId = (session.user as any).id;

  // Run admin aggregation queries
  let userCount = 0;
  let listingCount = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let usersList: any[] = [];
  let recentLogs: any[] = [];

  try {
    const [
      uCount,
      lCount,
      pCount,
      aCount,
      allUsers,
      logs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: ListingStatus.PENDING } }),
      prisma.listing.count({ where: { status: ListingStatus.APPROVED } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { listings: true },
          },
        },
      }),
      prisma.adminLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    userCount = uCount;
    listingCount = lCount;
    pendingCount = pCount;
    approvedCount = aCount;
    usersList = allUsers;
    recentLogs = logs;
  } catch (error) {
    console.error('Failed to load admin stats:', error);
  }

  const stats = [
    { label: 'Platform Users', value: userCount, icon: Users, color: 'bg-indigo-50 text-indigo-650' },
    { label: 'Total Ads', value: listingCount, icon: Building, color: 'bg-slate-50 text-slate-600' },
    { label: 'Pending Approval', value: pendingCount, icon: ShieldAlert, color: pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400' },
    { label: 'Approved Live', value: approvedCount, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-650' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Administration</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure global platform listings and account structures.</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/feedback"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-5 py-3 rounded-xl shadow-xs transition select-none cursor-pointer text-sm flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Feedback Inbox</span>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-5 py-3 rounded-xl shadow-xs transition select-none cursor-pointer text-sm flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Site Settings CMS</span>
          </Link>
          <Link
            href="/admin/listings"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer text-sm"
          >
            Moderate Listings ({pendingCount} pending)
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
              <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{stat.label}</span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users moderation section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">User Moderation</h2>
        <UserModerationList initialUsers={usersList} currentAdminId={currentAdminId} />
      </div>

      {/* Recent Audit Logs */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-indigo-500 stroke-[2.5]" />
          <span>Recent Administration Actions</span>
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No admin actions have been logged yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-55 text-indigo-700 uppercase tracking-wider">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        by {log.admin.name || log.admin.email}
                      </span>
                    </div>
                    <p className="text-sm text-slate-650 font-medium">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
