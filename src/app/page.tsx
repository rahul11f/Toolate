import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ListingStatus, ListingCategory } from '@/lib/types';
import { Building, MapPin, IndianRupee, ArrowRight, Home, Compass, Store, Sparkles, Briefcase, Laptop, Package, BedDouble as Bed, Users, Hotel, Landmark, Clock, Calendar, Plus, CheckCircle2, Handshake } from 'lucide-react';
import HomeSearchForm from '@/components/HomeSearchForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ListingConnectTrigger from '@/components/ListingConnectTrigger';

export const revalidate = 60; // Revalidate home page cache every minute

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  let currentUserVerified = false;
  if (session?.user) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { documentVerified: true },
      });
      currentUserVerified = dbUser?.documentVerified || false;
    } catch (error) {
      console.error('Failed to fetch home page user verification status:', error);
    }
  }

  // Fetch latest 3 approved listings
  let latestListings: any[] = [];
  try {
    const dbListings = await prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            documentVerified: true,
            legalName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    latestListings = dbListings.map(l => {
      let parsedFacilities = {};
      try {
        parsedFacilities = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
      } catch (err) {}
      return {
        ...l,
        images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images,
        parsedFacilities
      };
    });
  } catch (error) {
    console.error('Failed to fetch home page listings:', error);
  }

  // Fetch active shared hotel rooms
  let sharedHotels: any[] = [];
  try {
    const dbSharedHotels = await prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        category: ListingCategory.HOTEL,
        isSharedHotelRoom: true,
        hotelSplitStatus: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            documentVerified: true,
            legalName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
    sharedHotels = dbSharedHotels.map(l => {
      let parsedFacilities = {};
      try {
        parsedFacilities = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
      } catch (err) {}
      return {
        ...l,
        images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images,
        parsedFacilities
      };
    });
  } catch (error) {
    console.error('Failed to fetch home page shared hotels:', error);
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
    { name: 'Homestay', key: ListingCategory.HOUSE_GUEST, count: 'Guest stays & hosting', icon: Calendar, bg: 'bg-lime-50 text-lime-600' },
    { name: 'Share & Stay', key: ListingCategory.SHARE_STAY, count: 'Room/hotel/travel sharing', icon: Handshake, bg: 'bg-fuchsia-50 text-fuchsia-600' },
  ];

  const currentMonth = new Date().getMonth();
  const isPeakMovingSeason = currentMonth === 9 || currentMonth === 0 || currentMonth === 4 || currentMonth === 5; // October, January, May, June

  return (
    <div className="space-y-16 pb-12">
      {isPeakMovingSeason && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-3 px-4 text-center font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4 animate-fade-in border border-amber-300/20">
          <span className="animate-bounce">🚨</span>
          <span>Peak Moving Season Alert: Demand is currently extremely high. Listings are filling up 3x faster. Secure your rental early!</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white py-20 px-4 overflow-hidden rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4">
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
        <div className="flex overflow-x-auto pb-4 scrollbar-none snap-x gap-4 md:grid md:grid-cols-5 md:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                href={`/listings?category=${cat.key}`}
                className="flex-shrink-0 w-36 snap-start md:w-auto group p-6 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left space-y-4"
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
        <div className="flex overflow-x-auto pb-4 scrollbar-none snap-x gap-4 md:grid md:grid-cols-4 md:gap-6">
          {[
            { city: 'Bangalore', state: 'Karnataka' },
            { city: 'Mumbai', state: 'Maharashtra' },
            { city: 'Noida', state: 'Uttar Pradesh' },
            { city: 'New Delhi', state: 'Delhi' }
          ].map((loc) => (
            <Link
              key={loc.city}
              href={`/listings?city=${loc.city}`}
              className="flex-shrink-0 w-44 snap-start md:w-auto group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-150 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-between"
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
          <div className="flex overflow-x-auto pb-4 scrollbar-none snap-x gap-6 md:grid md:grid-cols-3 md:gap-8">
            {latestListings.map((listing) => {
              const isRoommate = listing.category === ListingCategory.ROOMMATE;
              const displayCategory = isRoommate ? 'roommate' : listing.category.toLowerCase();
              return (
                <div
                  key={listing.id}
                  className={`relative flex-shrink-0 w-72 snap-start md:w-auto group bg-white rounded-2xl overflow-hidden border ${
                    isRoommate ? 'border-violet-100 hover:border-violet-300' : 'border-slate-100 hover:border-slate-200'
                  } shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
                >
                  {/* Stretched Link covering the entire card click area */}
                  <Link
                    href={`/listings/${listing.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={listing.title}
                  />
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
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

                    {/* Shared Accommodation Badges */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 z-25">
                      {listing.category === 'ROOMMATE' && (
                        <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                          {listing.roommateType === 'HAVE_ROOM' ? 'Has Room' : 'Needs Room'}
                        </span>
                      )}
                      {listing.roommateGender && (
                        <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                          {listing.roommateGender === 'MALE' ? '♂ Male Pref.' :
                           listing.roommateGender === 'FEMALE' ? '♀ Female Pref.' :
                           '🚻 Any Gender'}
                        </span>
                      )}
                      {listing.category === 'HOTEL' && listing.isSharedHotelRoom && (
                        <span className="bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                          {listing.parsedFacilities?.isAlreadyBooked === false ? '🔍 Co-Stay Query' : '🏨 Hotel Share'}
                        </span>
                      )}
                    </div>
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

                    {/* Host Profile & Connect */}
                    {listing.user && (
                      <div className="pt-3.5 border-t border-slate-100 relative z-20">
                        <ListingConnectTrigger
                          lister={listing.user}
                          listing={listing}
                          isAuthenticated={isAuthenticated}
                          currentUserVerified={currentUserVerified}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Hotel Cost-Sharing & Co-stay Coordinates Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🤝 Hotel Cost-Sharing & Co-stay Coordinates</span>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                New
              </span>
            </h2>
            <p className="text-slate-500 mt-1.5 font-medium">
              Save up to 50% on luxury stays by coordinating with identity-verified travelers.
            </p>
          </div>
          <Link
            href="/listings?category=HOTEL"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span>Browse All Hotels</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Grid for Hotel Listings */}
          <div className="lg:col-span-2 space-y-6">
            {sharedHotels.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Hotel className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                <p className="font-semibold text-slate-550">No active hotel room sharing coordinates yet</p>
                <p className="text-xs text-slate-400 max-w-sm">Be the first to list your booking and find a trusted companion to split stay costs!</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-4 scrollbar-none snap-x gap-6 md:grid md:grid-cols-2 md:gap-6">
                {sharedHotels.map((hotel) => {
                  const splitPrice = hotel.price / 2;
                  
                  return (
                    <div
                      key={hotel.id}
                      className="relative flex-shrink-0 w-72 snap-start md:w-auto group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-150 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full animate-fade-in"
                    >
                      {/* Stretched Link covering the entire card click area */}
                      <Link
                        href={`/listings/${hotel.id}`}
                        className="absolute inset-0 z-10"
                        aria-label={hotel.hotelName || hotel.title}
                      />
                      <div className="relative h-40 bg-slate-100 overflow-hidden">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.hotelName || hotel.title}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-50">
                            <Hotel className="w-10 h-10 text-indigo-450 stroke-[1.5]" />
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1 ${
                          hotel.parsedFacilities?.isAlreadyBooked === false ? 'bg-violet-600' : 'bg-indigo-650'
                        }`}>
                          {hotel.parsedFacilities?.isAlreadyBooked === false ? (
                            <>
                              <Compass className="w-3 h-3" /> Co-Stay Query
                            </>
                          ) : (
                            <>
                              <Hotel className="w-3 h-3" /> Hotel Splitting
                            </>
                          )}
                        </span>

                        {/* Shared Accommodation Badges */}
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 z-25">
                          {hotel.roommateGender && (
                            <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                              {hotel.roommateGender === 'MALE' ? '♂ Male Pref.' :
                               hotel.roommateGender === 'FEMALE' ? '♀ Female Pref.' :
                               '🚻 Any Gender'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                        {/* Hotel Name & Header */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition flex-grow">
                              {hotel.hotelName || hotel.title}
                            </h3>
                            {hotel.roommateGender && (
                              <span className={`shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase select-none ${
                                hotel.roommateGender === 'MALE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                hotel.roommateGender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                'bg-slate-50 text-slate-650 border-slate-205'
                              }`}>
                                {hotel.roommateGender === 'MALE' ? 'Male Only' :
                                 hotel.roommateGender === 'FEMALE' ? 'Female Only' :
                                 'Any Gender'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-slate-400 gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{hotel.area}, {hotel.city}</span>
                          </div>
                        </div>

                        {/* Stay Dates */}
                        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-xs text-slate-655 font-semibold border border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>Stay Period:</span>
                          </div>
                          <span className="text-slate-800 font-bold">
                            {formatDate(hotel.checkInDate)} - {formatDate(hotel.checkOutDate)}
                          </span>
                        </div>

                        {/* Price Breakdown */}
                        <div className="flex items-center justify-between pt-2">
                          {hotel.parsedFacilities?.isAlreadyBooked === false ? (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Budget</span>
                                <span className="text-xs text-slate-500 font-semibold">
                                  ₹{hotel.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-655 uppercase font-black block">Est. Split Share</span>
                                <span className="text-lg font-black text-emerald-650 flex items-center justify-end">
                                  <IndianRupee className="w-4 h-4 stroke-[3]" />
                                  <span>{splitPrice.toLocaleString('en-IN')}</span>
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Price</span>
                                <span className="text-xs text-slate-500 font-semibold line-through">
                                  ₹{hotel.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-emerald-650 uppercase font-black block">Your 50% Share</span>
                                <span className="text-lg font-black text-emerald-650 flex items-center justify-end">
                                  <IndianRupee className="w-4 h-4 stroke-[3]" />
                                  <span>{splitPrice.toLocaleString('en-IN')}</span>
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Host Profile & Connect */}
                      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 relative z-20">
                        <ListingConnectTrigger
                          lister={hotel.user}
                          listing={hotel}
                          isAuthenticated={isAuthenticated}
                          currentUserVerified={currentUserVerified}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Premium CTA Side Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-8 flex flex-col justify-between border border-indigo-500/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_60%)]" />
            <div className="space-y-6 relative z-10 text-left">
              <div className="bg-indigo-500/10 border border-indigo-500/25 p-3 rounded-xl inline-block">
                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold tracking-tight">Have a hotel room booked already?</h3>
                <p className="text-xs text-slate-350 leading-relaxed font-light">
                  Don&apos;t pay the full bill alone! List your booking details securely, verify your profile, and find a verified traveler to share the room and split the cost 50/50.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full text-[10px]">✓</span>
                  <span>100% Secure & Vetted Coordination</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full text-[10px]">✓</span>
                  <span>In-App Splits & Real-time Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full text-[10px]">✓</span>
                  <span>Direct Chat & Stay Agreement</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 relative z-10">
              <Link
                href="/listings/create"
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/10 group"
              >
                <Plus className="w-4 h-4" />
                <span>List Hotel Room to Split</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
