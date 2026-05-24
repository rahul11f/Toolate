import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ListingForm from '@/components/ListingForm';
import { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface EditListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/login?callbackUrl=/listings/edit/${id}`);
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Fetch the existing listing
  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    notFound();
  }

  // Ensure current user is the owner or an administrator
  const isOwner = listing.userId === userId;
  const isAdmin = userRole === Role.ADMIN;

  if (!isOwner && !isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Property Details</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Revise property parameters below. {isAdmin ? 'Admin edits preserve approval states.' : 'User updates trigger moderation re-approval.'}
        </p>
      </div>

      <ListingForm initialData={listing} isEditMode={true} />
    </div>
  );
}
