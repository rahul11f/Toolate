import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ListingStatus, ListingCategory } from '@/lib/types';
import { Building, MapPin, IndianRupee, ArrowRight, Home, Compass, Store, Sparkles, Briefcase, Laptop, Package, BedDouble as Bed, Users, Hotel, Landmark, Clock } from 'lucide-react';
import HomeSearchForm from '@/components/HomeSearchForm';

export const revalidate = 60; // Revalidate home page cache every minute

export default async function HomePage() {
  // Fetch latest 3 approved listings
  let latestListings: any[] = [];
  try {
    const dbListings = await prisma.listing.findMany({
      where: { status: ListingStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    latestListings = dbListings.map(l => ({
      ...l,
      images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images
    }));
  } catch (error) {
    console.error('Failed to fetch home page listings:', error);
  }

  // Fetch admin SiteSettings
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  const heroTitle = settings?.heroTitle || 'Find Your Next Home, Flat or Shop Without Brokerage';
  const heroSubtitle = settings?.heroSubtitle || 'Search vetted listings for houses, flats, PGs, roommates and commercial spaces. Zero fees.';

  const categories = [
    { name: 'House', key: ListingCategory.HOUSE, count: 'Individual homes', icon: Home, bg: 'bg-indigo-50 text-indigo-600' },
    { name: 'Flat', key: ListingCategory.FLAT, count: 'Modern apartments', icon: Building, bg: 'bg-emerald-50 text-emerald-600' },
    { name: 'PG', key: ListingCategory.PG, count: 'Paying guests', icon: Compass, bg: 'bg-amber-50 text-amber-600' },
    { name: 'Roommate', key: ListingCategory.ROOMMATE, count: 'Find nearby roommates', icon: Users, bg: 'bg-purple-50 text-purple-600' },
    { name: 'Shop', key: ListingCategory.SHOP, count: 'Commercial spaces', icon: Store, bg: 'bg-rose-50 text-rose-600' },
    { name: 'Villa', key: ListingCategory.VILLA, count: 'Luxury estates', icon: Sparkles, bg: 'bg-teal-50 text-teal-650' },
    { name: 'Office', key: ListingCategory.OFFICE, count: 'Workspaces', icon: Briefcase, bg: 'bg-cyan-50 text-cyan-600' },
    { name: 'Hostel', key: ListingCategory.HOSTEL, count: 'Student housing', icon: Bed, bg: 'bg-violet-50 text-violet-650' },
    { name: 'Coworking', key: ListingCategory.COWORKING, count: 'Shared desks', icon: Laptop, bg: 'bg-orange-50 text-orange-655' },
    { name: 'Warehouse', key: ListingCategory.WAREHOUSE, count: 'Storage spaces', icon: Package, bg: 'bg-sky-50 text-sky-600' },
    { name: 'Dormitory', key: ListingCategory.DORMITORY, count: 'Shared hostel beds', icon: Bed, bg: 'bg-teal-50 text-teal-600' },
    { name: 'Hotel', key: ListingCategory.HOTEL, count: 'Rooms & suites', icon: Hotel, bg: 'bg-indigo-50 text-indigo-650' },
    { name: 'Dharamshala', key: ListingCategory.DHARAMSHALA, count: 'Pilgrim lodgings', icon: Landmark, bg: 'bg-amber-50 text-amber-600' },
    { name: 'Hourly Room', key: ListingCategory.HOURLY_ROOM, count: 'Flexible micro-stays', icon: Clock, bg: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 backdrop-blur-sm">
            🚀 100% Free Property & Roommate Directory
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight whitespace-pre-line">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>

          {/* Geolocation Enabled Search Form */}
          <HomeSearchForm />
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse by Category</h2>
          <p className="text-slate-500 mt-1.5 font-medium">Explore specific niches of verified properties</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                href={`/listings?category=${cat.key}`}
                className="group p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left space-y-4"
              >
                <div className={`p-4 rounded-xl transition-all duration-300 ${cat.bg} group-hover:scale-110`}>
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Browse by Location Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse by Location</h2>
          <p className="text-slate-500 mt-1.5 font-medium">Find properties and roommates in popular cities</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { city: 'Bangalore', state: 'Karnataka' },
            { city: 'Mumbai', state: 'Maharashtra' },
            { city: 'Noida', state: 'Uttar Pradesh' },
            { city: 'New Delhi', state: 'Delhi' }
          ].map((loc) => (
            <Link
              key={loc.city}
              href={`/listings?city=${loc.city}`}
              className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-150 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-slate-850 group-hover:text-indigo-600 transition">{loc.city}</h4>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{loc.state}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Newly Approved Properties</h2>
            <p className="text-slate-500 mt-1.5 font-medium">Freshly vetted listings, available right now</p>
          </div>
          <Link
            href="/listings"
            className="hidden sm:inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span>View All Listings</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {latestListings.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
            No properties have been listed yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestListings.map((listing) => {
              const isRoommate = listing.category === ListingCategory.ROOMMATE;
              const displayCategory = isRoommate ? 'roommate' : listing.category.toLowerCase();
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className={`group bg-white rounded-2xl overflow-hidden border ${
                    isRoommate ? 'border-violet-100 hover:border-violet-300' : 'border-slate-100 hover:border-slate-200'
                  } shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-50">
                        {isRoommate ? (
                          <Users className="w-12 h-12 text-violet-400 stroke-[1.5]" />
                        ) : (
                          <Building className="w-12 h-12 text-slate-400 stroke-[1.5]" />
                        )}
                      </div>
                    )}
                    <span className={`absolute top-4 left-4 ${
                      isRoommate ? 'bg-violet-650' : 'bg-indigo-650'
                    } text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider`}>
                      {displayCategory}
                    </span>
                    {listing.featured && (
                      <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-550 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className={`flex items-center ${isRoommate ? 'text-violet-650' : 'text-indigo-600'} text-lg font-extrabold`}>
                        <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{listing.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          {isRoommate ? '/ share' : '/ month'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>
                    </div>

                    <div className="flex items-center text-xs text-slate-400 pt-3 border-t border-slate-50 gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">
                        {listing.area}{listing.city ? `, ${listing.city}` : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
