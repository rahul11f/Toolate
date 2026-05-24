import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ListingForm from '@/components/ListingForm';

export const dynamic = 'force-dynamic';

export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/listings/create');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Post Ad Listing</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Fill in details below to publish your property listing or roommate profile for admin review.
        </p>
      </div>

      <ListingForm />
    </div>
  );
}
