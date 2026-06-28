import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role, ListingStatus } from '@/lib/types';
import { Users, Building, ShieldAlert, CheckCircle, ClipboardList, Settings, MessageSquare, ChevronRight } from 'lucide-react';
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
          isBanned: true,
          createdAt: true,
          listings: {
            select: {
              id: true,
              title: true,
              category: true,
              price: true,
              status: true,
              featured: true,
            },
            orderBy: { createdAt: 'desc' },
          },
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
    { label: 'Platform Users', value: userCount, icon: Users, color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-50', link: '#user-moderation' },
    { label: 'Total Ads', value: listingCount, icon: Building, color: 'from-slate-700 to-slate-800', text: 'text-slate-100', link: '/admin/listings' },
    { label: 'Pending Approval', value: pendingCount, icon: ShieldAlert, color: pendingCount > 0 ? 'from-amber-500 to-amber-600' : 'from-slate-400 to-slate-500', text: 'text-amber-50', link: '/admin/listings' },
    { label: 'Approved Live', value: approvedCount, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-50', link: '/admin/listings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Hero Header */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-indigo-500/10 blur-[120px] rounded-full rotate-12"></div>
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[100%] bg-violet-500/10 blur-[100px] rounded-full -rotate-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">
                <ShieldAlert className="w-3.5 h-3.5" /> Core Administration
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xs">
                Platform <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">Control Center</span>
              </h1>
              <p className="text-indigo-200/80 mt-2 font-medium max-w-xl text-lg">
                Manage global listings, monitor user activity, and configure application parameters.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/feedback"
                className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm shadow-xl"
              >
                <MessageSquare className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                <span>Feedback Inbox</span>
              </Link>
              <Link
                href="/admin/settings"
                className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm shadow-xl"
              >
                <Settings className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                <span>Settings</span>
              </Link>
              <Link
                href="/admin/listings"
                className="relative group bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center gap-2 text-sm overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                <span className="relative z-10">Moderate Listings</span>
                {pendingCount > 0 && (
                  <span className="relative z-10 bg-white text-indigo-700 px-2 py-0.5 rounded-md text-xs font-black shadow-xs">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link href={stat.link} key={i} className="block group">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  {/* Decorative background glow */}
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-linear-to-br ${stat.color} opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500 blur-2xl`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</span>
                      <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tight group-hover:text-indigo-600 transition-colors">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-linear-to-br ${stat.color} shadow-lg shadow-black/5`}>
                      <Icon className={`w-5 h-5 ${stat.text}`} />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                    View Details <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Users moderation section */}
        <div id="user-moderation" className="scroll-mt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Moderation & Access</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Manage user accounts, privileges, and their associated listings.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden backdrop-blur-xl">
            <UserModerationList initialUsers={usersList} currentAdminId={currentAdminId} />
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shadow-inner">
              <ClipboardList className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recent Activity Logs</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Audit trail of recent administrative actions.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-lg shadow-slate-200/50">
            {recentLogs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="bg-slate-50 p-4 rounded-full">
                  <ClipboardList className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No administrative actions have been logged yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest shadow-xs">
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          Executed by <strong className="text-slate-600">{log.admin.name || log.admin.email}</strong>
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{log.details}</p>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-slate-200 group-hover:shadow-xs transition-all">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
