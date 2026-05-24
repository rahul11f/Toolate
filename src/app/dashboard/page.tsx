import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import DashboardListings from './DashboardListings';
import { CheckCircle, Clock, Building, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  // Fetch listings for current user
  let listings: any[] = [];
  try {
    listings = await prisma.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to load user dashboard listings:', error);
  }

  // Calculate statistics
  const totalListings = listings.length;
  const approvedListings = listings.filter((l) => l.status === 'APPROVED').length;
  const pendingListings = listings.filter((l) => l.status === 'PENDING').length;

  const stats = [
    { label: 'Total Listings', value: totalListings, icon: Building, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Approved Live', value: approvedListings, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Moderation', value: pendingListings, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Welcome back, <span className="text-slate-700 font-semibold">{session.user.name || 'User'}</span>! Manage your property listings here.
          </p>
        </div>
        <Link
          href="/listings/create"
          className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post New Listing</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
              <div className={`p-4 rounded-xl shrink-0 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">{stat.label}</span>
                <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Listings List Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your Advertisements</h2>
        <DashboardListings initialListings={listings} />
      </div>
    </div>
  );
}
