import prisma from '@/lib/prisma';
import { ListingStatus, ListingCategory } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Building, MapPin, IndianRupee, ChevronLeft, ChevronRight, Users, Sparkles, Lock } from 'lucide-react';
import ListingFilters from './ListingFilters';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ListingsPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    area?: string;
    state?: string;
    city?: string;
    roommateType?: string;
    roommateGender?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>;
}

export const dynamic = 'force-dynamic';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  const resolvedParams = await searchParams;
  // Parse search parameters
  const query = resolvedParams.query || undefined;
  const category = resolvedParams.category as ListingCategory || undefined;
  const area = resolvedParams.area || undefined;
  const state = resolvedParams.state || undefined;
  const city = resolvedParams.city || undefined;
  const roommateType = resolvedParams.roommateType || undefined;
  const roommateGender = resolvedParams.roommateGender || undefined;
  const minPrice = resolvedParams.minPrice ? parseFloat(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined;
  const sortBy = resolvedParams.sortBy || 'createdAt';
  const lat = resolvedParams.lat ? parseFloat(resolvedParams.lat) : undefined;
  const lng = resolvedParams.lng ? parseFloat(resolvedParams.lng) : undefined;
  const radius = resolvedParams.radius ? parseFloat(resolvedParams.radius) : 10; // Default 10km
  
  const page = Math.max(1, parseInt(resolvedParams.page || '1'));
  const limit = 6; // 6 listings per page
  const skip = (page - 1) * limit;

  // Build prisma filters
  const where: any = {
    status: ListingStatus.APPROVED,
  };

  if (category && Object.values(ListingCategory).includes(category)) {
    where.category = category;
  }

  if (state) {
    where.state = state;
  }

  if (city) {
    where.city = city;
  }

  if (category === ListingCategory.ROOMMATE) {
    if (roommateType) where.roommateType = roommateType;
    if (roommateGender) where.roommateGender = roommateGender;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (area) {
    where.area = {
      contains: area,
      mode: 'insensitive',
    };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { address: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Build sorting object
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  } else if (sortBy === 'createdAt_asc') {
    orderBy = { createdAt: 'asc' };
  }

  let listings: any[] = [];
  let total = 0;

  try {
    if (lat !== undefined && lng !== undefined) {
      // Geospatial search: load all matching listings, filter/sort by distance in memory
      const dbListings = await prisma.listing.findMany({
        where,
        orderBy,
      });

      const parsedWithDistance = dbListings.map(l => {
        const parsedImages = typeof l.images === 'string' ? JSON.parse(l.images) : l.images;
        const distance = calculateDistance(lat, lng, l.lat, l.lng);
        return {
          ...l,
          images: parsedImages,
          distance,
        };
      }).filter(l => l.distance <= radius);

      // Sort by distance if sorting isn't explicitly set to price
      if (sortBy !== 'price_asc' && sortBy !== 'price_desc') {
        parsedWithDistance.sort((a, b) => a.distance - b.distance);
      }

      total = parsedWithDistance.length;
      listings = parsedWithDistance.slice(skip, skip + limit);
    } else {
      // Standard search: paginate directly in DB
      const [dbListings, dbTotal] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.listing.count({ where }),
      ]);
      listings = dbListings.map(l => ({
        ...l,
        images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images
      }));
      total = dbTotal;
    }
  } catch (error) {
    console.error('Failed to load catalog listings:', error);
  }

  const totalPages = Math.ceil(total / limit);

  // Helper to construct paginated URLs
  const getPaginationUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (area) params.set('area', area);
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (roommateType) params.set('roommateType', roommateType);
    if (roommateGender) params.set('roommateGender', roommateGender);
    if (lat !== undefined) params.set('lat', lat.toString());
    if (lng !== undefined) params.set('lng', lng.toString());
    if (radius !== undefined) params.set('radius', radius.toString());
    if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());
    if (sortBy) params.set('sortBy', sortBy);
    params.set('page', pageNumber.toString());
    return `/listings?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vetted Listings Directory</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Browse verified houses, flats, PGs, roommates, and commercial spaces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <ListingFilters />
          
          {/* AdSense Sidebar Placeholder */}
          <AdSensePlaceholder slot="sidebar-rect" format="rectangle" className="hidden lg:block h-[250px] w-[300px]" />
        </div>

        {/* Listings Grid / Results */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex justify-between items-center text-sm text-slate-500 font-medium bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-xs">
            <span>Showing {listings.length} of {total} listings</span>
            {totalPages > 1 && (
              <span>Page {page} of {totalPages}</span>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400">
              No matching listings were found. Adjust your filters or reset search parameters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => {
                const isRoommate = listing.category === ListingCategory.ROOMMATE;
                const displayCategory = isRoommate ? 'roommate' : listing.category.toLowerCase();
                
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className={`bg-white rounded-2xl overflow-hidden border ${
                      isRoommate ? 'border-violet-100 shadow-violet-50/20 hover:border-violet-300' : 'border-slate-100 hover:border-slate-200'
                    } shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-200 flex flex-col h-full group`}
                  >
                    {/* Header Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
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

                      {/* Category Badge */}
                      <span className={`absolute top-4 left-4 ${
                        isRoommate ? 'bg-violet-600' : 'bg-indigo-650'
                      } text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md uppercase select-none`}>
                        {displayCategory}
                      </span>

                      {/* Featured Badge */}
                      {listing.featured && (
                        <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-550 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider animate-pulse select-none">
                          ⭐ Featured
                        </span>
                      )}

                      {/* Roommate Sub-badges */}
                      {isRoommate && (
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                          <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                            {listing.roommateType === 'HAVE_ROOM' ? 'Has Room' : 'Needs Room'}
                          </span>
                          <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase">
                            {listing.roommateGender === 'MALE' ? 'Male Pref.' : listing.roommateGender === 'FEMALE' ? 'Female Pref.' : 'Any Gender'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className={`flex items-center ${isRoommate ? 'text-violet-650' : 'text-indigo-600'} text-lg font-extrabold`}>
                          <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{listing.price.toLocaleString('en-IN')}</span>
                          <span className="text-xs text-slate-400 font-normal ml-1">
                            {isRoommate ? '/ roommate share' : '/ month'}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">
                          {listing.title}
                        </h3>

                        {/* Description Preview: Locked for guests */}
                        {isAuthenticated ? (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {listing.description}
                          </p>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 select-none">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-semibold tracking-wide uppercase">Login to view details</span>
                          </div>
                        )}
                      </div>

                      {/* Location Badge */}
                      {/* Location Badge */}
                      <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-50 gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {listing.area}
                            {listing.city ? `, ${listing.city}` : ''}
                          </span>
                        </div>
                        {listing.distance !== undefined && listing.distance !== null && (
                          <span className="shrink-0 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            📍 {listing.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              {page > 1 ? (
                <Link
                  href={getPaginationUrl(page - 1)}
                  className="flex items-center space-x-1 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-1 px-4 py-2 border border-slate-100 rounded-xl bg-slate-50 text-sm font-semibold text-slate-300 select-none">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </div>
              )}

              <div className="flex items-center space-x-1 text-sm font-semibold">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isCurrent = p === page;
                  return isCurrent ? (
                    <span
                      key={p}
                      className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl select-none"
                    >
                      {p}
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={getPaginationUrl(p)}
                      className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-650 transition"
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>

              {page < totalPages ? (
                <Link
                  href={getPaginationUrl(page + 1)}
                  className="flex items-center space-x-1 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center space-x-1 px-4 py-2 border border-slate-100 rounded-xl bg-slate-50 text-sm font-semibold text-slate-300 select-none">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
