import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import DashboardTabs from './DashboardTabs';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Automatically redirect Admin users to the Admin Portal
  if ((session.user as any).role === 'ADMIN') {
    redirect('/admin');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Welcome back, <span className="text-slate-700 font-semibold">{session.user.name || 'User'}</span>! Manage your property listings and profile here.
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

      {/* Tabs containing stats, listings and profile settings */}
      <DashboardTabs initialListings={listings} userName={session.user.name || 'User'} />
    </div>
  );
}
