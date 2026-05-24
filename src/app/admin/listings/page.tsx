import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';
import AdminListingsQueue from './AdminListingsQueue';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminListingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== Role.ADMIN) {
    redirect('/');
  }

  // Fetch all listings across all states
  let listings: any[] = [];
  try {
    const dbListings = await prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    listings = dbListings.map(l => ({
      ...l,
      images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images
    }));
  } catch (error) {
    console.error('Failed to load listings for admin moderation:', error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with back navigation */}
      <div className="space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-650 transition gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Listing Moderation Queue</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Review submitted properties. Approve to publish, reject to notify, or edit/delete entries directly.
          </p>
        </div>
      </div>

      <AdminListingsQueue initialListings={listings} />
    </div>
  );
}
