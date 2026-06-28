import prisma from '@/lib/prisma';
import { ListingStatus, ListingCategory } from '@/lib/types';
import Link from 'next/link';
import { Building, MapPin, IndianRupee, ChevronLeft, ChevronRight, Users, Lock, LayoutGrid, List } from 'lucide-react';
import ListingFilters from './ListingFilters';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CompareButton from '@/components/CompareButton';
import CompareBar from '@/components/CompareBar';
import { getNearbyTransit } from '@/lib/transit';
import { calculateCompatibility } from '@/lib/roommateMatcher';
import ListingConnectTrigger from '@/components/ListingConnectTrigger';
import SafeImage from '@/components/SafeImage';

interface ListingsPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    area?: string;
    state?: string;
    city?: string;
    roommateType?: string;
    roommateGender?: string;
    foodType?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    commuteLat?: string;
    commuteLng?: string;
    commuteAddress?: string;
    commuteMaxTime?: string;
    commuteMode?: string;
    nearMetro?: string;
    layout?: string;
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
  const sessionUserId = session?.user ? (session.user as any).id : null;
  
  let currentUserProfile: any = null;
  let currentUserVerified = false;
  if (isAuthenticated && sessionUserId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { lifestyleProfile: true, documentVerified: true },
      });
      if (dbUser) {
        currentUserVerified = dbUser.documentVerified;
        if (dbUser.lifestyleProfile) {
          currentUserProfile = JSON.parse(dbUser.lifestyleProfile);
        }
      }
    } catch (err) {
      console.error('Failed to load current user profile details:', err);
    }
  }

  const resolvedParams = await searchParams;
  // Parse search parameters
  const query = resolvedParams.query || undefined;
  const category = resolvedParams.category as ListingCategory || undefined;
  const area = resolvedParams.area || undefined;
  const state = resolvedParams.state || undefined;
  const city = resolvedParams.city || undefined;
  const roommateType = resolvedParams.roommateType || undefined;
  const roommateGender = resolvedParams.roommateGender || undefined;
  const foodType = resolvedParams.foodType || undefined;
  const minPrice = resolvedParams.minPrice ? parseFloat(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined;
  const sortBy = resolvedParams.sortBy || 'createdAt';
  const lat = resolvedParams.lat ? parseFloat(resolvedParams.lat) : undefined;
  const lng = resolvedParams.lng ? parseFloat(resolvedParams.lng) : undefined;
  const radius = resolvedParams.radius ? parseFloat(resolvedParams.radius) : 10;
  
  const commuteLat = resolvedParams.commuteLat ? parseFloat(resolvedParams.commuteLat) : undefined;
  const commuteLng = resolvedParams.commuteLng ? parseFloat(resolvedParams.commuteLng) : undefined;
  const commuteAddress = resolvedParams.commuteAddress || undefined;
  const commuteMaxTime = resolvedParams.commuteMaxTime ? parseInt(resolvedParams.commuteMaxTime) : 30;
  const commuteMode = resolvedParams.commuteMode || 'driving';
  const nearMetro = resolvedParams.nearMetro === 'true';
  const layout = resolvedParams.layout || 'grid';

  const page = Math.max(1, parseInt(resolvedParams.page || '1'));
  const limit = 6; // 6 listings per page
  const skip = (page - 1) * limit;

  // Build prisma filters
  const where: any = {
    status: ListingStatus.APPROVED,
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
    ]
  };

  if (category && Object.values(ListingCategory).includes(category)) {
    where.category = category;
  }

  if (state) {
    where.state = {
      contains: state,
      mode: 'insensitive'
    };
  }

  if (city) {
    where.city = {
      contains: city,
      mode: 'insensitive'
    };
  }

  if (category === ListingCategory.ROOMMATE || category === ListingCategory.HOTEL || category === ListingCategory.SHARE_STAY) {
    if (roommateType && category === ListingCategory.ROOMMATE) where.roommateType = roommateType;
    if (roommateGender) where.roommateGender = roommateGender;
  }

  if (foodType) {
    where.foodType = foodType;
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
    if ((commuteLat !== undefined && commuteLng !== undefined) || nearMetro) {
      // 1. Fetch matching listings in memory
      const dbListings = await prisma.listing.findMany({
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              lifestyleProfile: true,
              documentVerified: true,
              legalName: true,
              email: true,
              whatsappEnabled: true,
            }
          }
        }
      });

      // 2. Query OSRM routing table if commute search is requested
      const commuteResults: Record<string, { durationMinutes: number; distanceKm: number }> = {};
      if (commuteLat !== undefined && commuteLng !== undefined && dbListings.length > 0) {
        try {
          const coordsString = [
            `${commuteLng},${commuteLat}`,
            ...dbListings.map(l => `${l.lng},${l.lat}`),
          ].join(';');

          const url = `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0&annotations=duration`;
          const res = await fetch(url, { headers: { 'User-Agent': 'ToolateServer/1.0' } });
          if (res.ok) {
            const data = await res.json();
            if (data.durations && data.durations[0]) {
              const durationsSeconds = data.durations[0].slice(1);
              let factor = 1.0;
              if (commuteMode === 'walking') factor = 6.0;
              else if (commuteMode === 'bike') factor = 0.85;

              dbListings.forEach((l, idx) => {
                const originalSeconds = durationsSeconds[idx];
                let seconds = originalSeconds !== null && originalSeconds !== undefined ? originalSeconds * factor : null;
                if (seconds === null) {
                  const dist = calculateDistance(commuteLat, commuteLng, l.lat, l.lng);
                  const speed = commuteMode === 'walking' ? 5 : commuteMode === 'bike' ? 25 : 35;
                  seconds = (dist / speed) * 3600 * 1.3;
                }
                commuteResults[l.id] = {
                  durationMinutes: Math.round(seconds / 60),
                  distanceKm: Number(((seconds / 3600) * (commuteMode === 'walking' ? 5 : commuteMode === 'bike' ? 25 : 35)).toFixed(1))
                };
              });
            }
          }
        } catch (err) {
          console.error('Server commute calculation failed:', err);
        }
      }

      // 3. Query transit stations if nearMetro is requested
      const transitResults: Record<string, boolean> = {};
      if (nearMetro && dbListings.length > 0) {
        await Promise.all(dbListings.map(async (l) => {
          try {
            const facs = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
            if (facs.disableAutoMetro) {
              transitResults[l.id] = false;
            } else {
              const stations = await getNearbyTransit(l.lat, l.lng);
              transitResults[l.id] = stations.some(s => s.type === 'METRO');
            }
          } catch {
            transitResults[l.id] = false;
          }
        }));
      }

      // 4. Map & Filter
      const parsedWithFilters = dbListings.map(l => {
        const parsedImages = typeof l.images === 'string' ? JSON.parse(l.images) : l.images;
        const commute = commuteResults[l.id] || null;
        const hasMetro = transitResults[l.id] !== undefined ? transitResults[l.id] : null;
        const ownerProfile = (l as any).user?.lifestyleProfile ? JSON.parse((l as any).user.lifestyleProfile) : null;
        const matchScore = calculateCompatibility(currentUserProfile, ownerProfile);
        let parsedFacilities = {};
        try {
          parsedFacilities = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
        } catch (err) {}
        
        return {
          ...l,
          images: parsedImages,
          commuteDuration: commute ? commute.durationMinutes : null,
          commuteDistance: commute ? commute.distanceKm : null,
          hasMetro,
          matchScore,
          parsedFacilities,
        };
      }).filter(l => {
        if (commuteLat !== undefined && commuteLng !== undefined && (l.commuteDuration === null || l.commuteDuration > commuteMaxTime)) {
          return false;
        }
        if (nearMetro && !l.hasMetro) {
          return false;
        }
        return true;
      });

      // 5. Sort by duration
      if (sortBy !== 'price_asc' && sortBy !== 'price_desc') {
        if (commuteLat !== undefined && commuteLng !== undefined) {
          parsedWithFilters.sort((a, b) => (a.commuteDuration || 999) - (b.commuteDuration || 999));
        }
      }

      total = parsedWithFilters.length;
      listings = parsedWithFilters.slice(skip, skip + limit);
    } else if (lat !== undefined && lng !== undefined) {
      // Geospatial search: load all matching listings, filter/sort by distance in memory
      const dbListings = await prisma.listing.findMany({
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              lifestyleProfile: true,
              documentVerified: true,
              legalName: true,
              email: true,
            }
          }
        }
      });

      const parsedWithDistance = dbListings.map(l => {
        const parsedImages = typeof l.images === 'string' ? JSON.parse(l.images) : l.images;
        const distance = calculateDistance(lat, lng, l.lat, l.lng);
        const ownerProfile = (l as any).user?.lifestyleProfile ? JSON.parse((l as any).user.lifestyleProfile) : null;
        const matchScore = calculateCompatibility(currentUserProfile, ownerProfile);
        let parsedFacilities = {};
        try {
          parsedFacilities = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
        } catch (err) {}
        return {
          ...l,
          images: parsedImages,
          distance,
          matchScore,
          parsedFacilities,
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                lifestyleProfile: true,
                documentVerified: true,
                legalName: true,
                email: true,
                whatsappEnabled: true,
              }
            }
          }
        }),
        prisma.listing.count({ where }),
      ]);
      listings = dbListings.map(l => {
        const ownerProfile = (l as any).user?.lifestyleProfile ? JSON.parse((l as any).user.lifestyleProfile) : null;
        const matchScore = calculateCompatibility(currentUserProfile, ownerProfile);
        let parsedFacilities = {};
        try {
          parsedFacilities = typeof l.facilities === 'string' ? JSON.parse(l.facilities) : (l.facilities || {});
        } catch (err) {}
        return {
          ...l,
          images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images,
          matchScore,
          parsedFacilities,
        };
      });
      total = dbTotal;
    }

      // Fetch metro proximity for the paginated page items (max 6) to show visual badges
      if (listings.length > 0) {
        await Promise.all(listings.map(async (l) => {
          if (l.hasMetro !== null && l.hasMetro !== undefined) return;
          try {
            if (l.parsedFacilities?.disableAutoMetro) {
              l.hasMetro = false;
            } else {
              const stations = await getNearbyTransit(l.lat, l.lng);
              l.hasMetro = stations.some(s => s.type === 'METRO');
            }
          } catch {
            l.hasMetro = false;
          }
        }));
      }
  } catch (error) {
    console.error('Failed to load catalog listings:', error);
  }

  const totalPages = Math.ceil(total / limit);

  // Active Filter Chips Logic
  const activeFiltersList: { label: string; paramKey: string; removeUrl: string }[] = [];

  const createRemoveFilterUrl = (keyToRemove: string) => {
    const params = new URLSearchParams();
    if (query && keyToRemove !== 'query') params.set('query', query);
    if (category && keyToRemove !== 'category') params.set('category', category);
    if (area && keyToRemove !== 'area') params.set('area', area);
    if (state && keyToRemove !== 'state') params.set('state', state);
    if (city && keyToRemove !== 'city') params.set('city', city);
    if (roommateType && keyToRemove !== 'roommateType') params.set('roommateType', roommateType);
    if (roommateGender && keyToRemove !== 'roommateGender') params.set('roommateGender', roommateGender);
    if (foodType && keyToRemove !== 'foodType') params.set('foodType', foodType);
    if (minPrice !== undefined && keyToRemove !== 'minPrice') params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined && keyToRemove !== 'maxPrice') params.set('maxPrice', maxPrice.toString());
    if (nearMetro && keyToRemove !== 'nearMetro') params.set('nearMetro', 'true');
    if (commuteLat !== undefined && commuteLng !== undefined && keyToRemove !== 'commute') {
      params.set('commuteLat', commuteLat.toString());
      params.set('commuteLng', commuteLng.toString());
      params.set('commuteAddress', commuteAddress || '');
      params.set('commuteMaxTime', commuteMaxTime.toString());
      params.set('commuteMode', commuteMode);
    }
    if (lat !== undefined && lng !== undefined && keyToRemove !== 'gps') {
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
      params.set('radius', radius.toString());
    }
    if (sortBy) params.set('sortBy', sortBy);
    if (layout) params.set('layout', layout);
    params.set('page', '1');
    return `/listings?${params.toString()}`;
  };

  if (query) activeFiltersList.push({ label: `"${query}"`, paramKey: 'query', removeUrl: createRemoveFilterUrl('query') });
  if (category) activeFiltersList.push({ label: `Category: ${category}`, paramKey: 'category', removeUrl: createRemoveFilterUrl('category') });
  if (city) activeFiltersList.push({ label: `City: ${city}`, paramKey: 'city', removeUrl: createRemoveFilterUrl('city') });
  if (area) activeFiltersList.push({ label: `Area: ${area}`, paramKey: 'area', removeUrl: createRemoveFilterUrl('area') });
  if (roommateGender) activeFiltersList.push({ label: `Gender: ${roommateGender}`, paramKey: 'roommateGender', removeUrl: createRemoveFilterUrl('roommateGender') });
  if (foodType) activeFiltersList.push({ label: `Food: ${foodType}`, paramKey: 'foodType', removeUrl: createRemoveFilterUrl('foodType') });
  if (minPrice !== undefined) activeFiltersList.push({ label: `Min: ₹${minPrice}`, paramKey: 'minPrice', removeUrl: createRemoveFilterUrl('minPrice') });
  if (maxPrice !== undefined) activeFiltersList.push({ label: `Max: ₹${maxPrice}`, paramKey: 'maxPrice', removeUrl: createRemoveFilterUrl('maxPrice') });
  if (nearMetro) activeFiltersList.push({ label: '🚇 Near Metro', paramKey: 'nearMetro', removeUrl: createRemoveFilterUrl('nearMetro') });
  if (commuteLat !== undefined) activeFiltersList.push({ label: `🚗 Near ${commuteAddress ? commuteAddress.split(',')[0] : 'Work'}`, paramKey: 'commute', removeUrl: createRemoveFilterUrl('commute') });
  if (lat !== undefined) activeFiltersList.push({ label: '📍 GPS', paramKey: 'gps', removeUrl: createRemoveFilterUrl('gps') });

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
    if (commuteLat !== undefined) params.set('commuteLat', commuteLat.toString());
    if (commuteLng !== undefined) params.set('commuteLng', commuteLng.toString());
    if (commuteAddress) params.set('commuteAddress', commuteAddress);
    if (commuteMaxTime !== undefined) params.set('commuteMaxTime', commuteMaxTime.toString());
    if (commuteMode) params.set('commuteMode', commuteMode);
    if (nearMetro) params.set('nearMetro', 'true');
    if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());
    if (foodType) params.set('foodType', foodType);
    if (sortBy) params.set('sortBy', sortBy);
    if (layout) params.set('layout', layout);
    params.set('page', pageNumber.toString());
    return `/listings?${params.toString()}`;
  };

  // Helper to construct URLs for toggling layout
  const getLayoutUrl = (newLayout: string) => {
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
    if (commuteLat !== undefined) params.set('commuteLat', commuteLat.toString());
    if (commuteLng !== undefined) params.set('commuteLng', commuteLng.toString());
    if (commuteAddress) params.set('commuteAddress', commuteAddress);
    if (commuteMaxTime !== undefined) params.set('commuteMaxTime', commuteMaxTime.toString());
    if (commuteMode) params.set('commuteMode', commuteMode);
    if (nearMetro) params.set('nearMetro', 'true');
    if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());
    if (foodType) params.set('foodType', foodType);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('layout', newLayout);
    params.set('page', page.toString());
    return `/listings?${params.toString()}`;
  };

  // Helper to construct list of page numbers to display with ellipses
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (page <= 3) {
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
      }
      if (start > 2) {
        pages.push('...');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };
  const visiblePages = getVisiblePages();

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-slate-500 font-medium bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-xs gap-3">
            <div>
              Showing <span className="font-extrabold text-slate-800">{listings.length}</span> of <span className="font-extrabold text-slate-800">{total}</span> listings
              {totalPages > 1 && (
                <span className="text-slate-400 ml-2 font-normal">| Page {page} of {totalPages}</span>
              )}
            </div>

            {/* Layout Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <Link
                href={getLayoutUrl('grid')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition select-none ${
                  layout === 'grid'
                    ? 'bg-white text-indigo-650 shadow-xs border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </Link>
              <Link
                href={getLayoutUrl('compact')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition select-none ${
                  layout === 'compact'
                    ? 'bg-white text-indigo-650 shadow-xs border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Compact View (Dense Mobile List)"
              >
                <List className="w-3.5 h-3.5" />
                <span>Compact</span>
              </Link>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-white/70 backdrop-blur-md border border-slate-100 p-3 rounded-xl shadow-2xs animate-fade-in select-none">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider pl-1 mr-1">
                Filters:
              </span>
              {activeFiltersList.map((chip, idx) => (
                <Link
                  key={idx}
                  href={chip.removeUrl}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-100 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs transition active:scale-95 group shrink-0"
                >
                  <span>{chip.label}</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center text-[9px] font-black text-slate-400 group-hover:text-rose-500 leading-none">
                    ✕
                  </span>
                </Link>
              ))}
              <Link
                href="/listings"
                className="text-xs font-bold text-indigo-650 hover:text-indigo-700 pl-2 select-none hover:underline"
              >
                Clear All
              </Link>
            </div>
          )}

          {listings.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400">
              No matching listings were found. Adjust your filters or reset search parameters.
            </div>
          ) : (
            <div className={layout === 'compact' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
              {listings.map((listing) => {
                const isRoommate = listing.category === ListingCategory.ROOMMATE;
                const displayCategory = isRoommate ? 'roommate' : listing.category.toLowerCase();
                
                if (layout === 'compact') {
                  return (
                    <div key={listing.id} className="relative">
                      <CompareButton listingId={listing.id} className="top-2 right-2 scale-90" />
                      <div
                        className={`relative bg-white rounded-xl overflow-hidden border ${
                          isRoommate ? 'border-violet-100 hover:border-violet-300' : 'border-slate-100 hover:border-slate-200'
                        } shadow-xs hover:shadow-md transition-all duration-150 flex items-center p-2.5 gap-3 group`}
                      >
                        {/* Stretched Link covering the entire card click area */}
                        <Link
                          href={`/listings/${listing.id}`}
                          className="absolute inset-0 z-10"
                          aria-label={listing.title}
                        />
                        {/* Compact Thumbnail (80x80px) */}
                        <div className="relative w-20 h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                          <SafeImage
                            src={listing.images && listing.images.length > 0 ? listing.images[0] : null}
                            alt={listing.title}
                            category={listing.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                          
                          {/* Small Category Indicator */}
                          <span className={`absolute bottom-0 left-0 right-0 ${
                            isRoommate ? 'bg-violet-650/90' : 'bg-indigo-650/90'
                          } text-white text-[7px] font-bold py-0.5 text-center uppercase tracking-wide select-none z-20`}>
                            {listing.category === 'HOTEL' && listing.isSharedHotelRoom
                              ? (listing.parsedFacilities?.isAlreadyBooked === false ? 'Co-Stay' : 'Hotel Share')
                              : displayCategory}
                          </span>
                        </div>

                        {/* Dense Content Details */}
                        <div className="flex-grow min-w-0 flex flex-col justify-between min-h-20 h-auto py-1 space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-extrabold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition">
                                {listing.title}
                              </h3>
                              <div className={`flex items-center shrink-0 ${isRoommate ? 'text-violet-600' : 'text-indigo-600'} text-sm font-extrabold`}>
                                <IndianRupee className="w-3 h-3 stroke-[2.5]" />
                                <span>{listing.price.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-slate-455 font-normal ml-0.5">
                                  {isRoommate ? '/sh' : '/mo'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-455 gap-2">
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate">{listing.area}{listing.city ? `, ${listing.city}` : ''}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {listing.roommateGender && (
                                  <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">
                                    {listing.roommateGender === 'MALE' ? '♂ Male' :
                                     listing.roommateGender === 'FEMALE' ? '♀ Female' :
                                     '🚻 Any'}
                                  </span>
                                )}
                                {isRoommate && isAuthenticated && listing.matchScore !== undefined && listing.matchScore !== null && (
                                  <span className="bg-violet-50 text-violet-755 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase">
                                    🧩 {listing.matchScore}%
                                  </span>
                                )}
                                {listing.distance !== undefined && listing.distance !== null && (
                                  <span className="bg-emerald-50 text-emerald-755 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">
                                    📍 {listing.distance.toFixed(1)}km
                                  </span>
                                )}
                                {listing.commuteDuration !== undefined && listing.commuteDuration !== null && (
                                  <span className="bg-violet-50 text-violet-755 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase flex items-center gap-0.5">
                                    🕐 {listing.commuteDuration}m
                                  </span>
                                )}
                                {listing.hasMetro && (
                                  <span className="bg-indigo-50 text-indigo-755 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">
                                    🚇 Metro
                                  </span>
                                )}
                              </div>
                            </div>

                            {isAuthenticated ? (
                              <p className="text-[10px] text-slate-400 line-clamp-1 truncate font-medium leading-normal">
                                {listing.description}
                              </p>
                            ) : (
                              <p className="text-[9px] text-slate-350 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-slate-300" />
                                <span>Login to view description</span>
                              </p>
                            )}
                          </div>

                          {/* Host info & Connect compact trigger */}
                          <div className="pt-2 border-t border-slate-100 relative z-20">
                            <ListingConnectTrigger
                              lister={listing.user}
                              listing={listing}
                              isAuthenticated={isAuthenticated}
                              currentUserVerified={currentUserVerified}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={listing.id} className="relative">
                    {/* Compare Button Overlay */}
                    <CompareButton listingId={listing.id} />
                    <div
                      className={`relative bg-white rounded-2xl overflow-hidden border ${
                        isRoommate ? 'border-violet-100 shadow-violet-50/20 hover:border-violet-300' : 'border-slate-100 hover:border-slate-200'
                      } shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-200 flex flex-col h-full group`}
                    >
                      {/* Stretched Link covering the entire card click area */}
                      <Link
                        href={`/listings/${listing.id}`}
                        className="absolute inset-0 z-10"
                        aria-label={listing.title}
                      />
                    {/* Header Image */}
                    <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden rounded-t-2xl">
                      <SafeImage
                        src={listing.images && listing.images.length > 0 ? listing.images[0] : null}
                        alt={listing.title}
                        category={listing.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-800 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-wider z-20">
                        {listing.category === 'HOTEL' && listing.isSharedHotelRoom
                          ? (listing.parsedFacilities?.isAlreadyBooked === false ? '🔍 Co-Stay Query' : '🏨 Hotel Share')
                          : displayCategory}
                      </span>

                      {/* Featured Badge */}
                      {listing.featured && (
                        <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-550 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-wider z-20">
                          ⭐ Featured
                        </span>
                      )}

                      {/* Shared Accommodation Badges */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 z-20">
                        {listing.category === 'ROOMMATE' && (
                          <span className="bg-slate-950/70 backdrop-blur-xs text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                            {listing.roommateType === 'HAVE_ROOM' ? 'Has Room' : 'Needs Room'}
                          </span>
                        )}
                        {listing.roommateGender && (
                          <span className="bg-slate-950/70 backdrop-blur-xs text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                            {listing.roommateGender === 'MALE' ? '♂ Male Pref.' :
                             listing.roommateGender === 'FEMALE' ? '♀ Female Pref.' :
                             '🚻 Any Gender'}
                          </span>
                        )}
                        {listing.category === 'HOTEL' && listing.isSharedHotelRoom && (
                          <span className="bg-indigo-600/90 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                            {listing.parsedFacilities?.isAlreadyBooked === false ? '🔍 Co-Stay' : '🏨 Hotel Split'}
                          </span>
                        )}
                      </div>

                      {/* Food Type Badge for PG/Hostel/Dormitory */}
                      {listing.foodType && (listing.category === 'PG' || listing.category === 'HOSTEL' || listing.category === 'DORMITORY') && (
                        <div className="absolute bottom-3 right-3 z-20">
                          <span className={`text-[8.5px] font-black px-2 py-1 rounded-md uppercase backdrop-blur-xs border border-white/10 shadow-sm ${
                            listing.foodType === 'VEG_ONLY' ? 'bg-emerald-600/95 text-white' :
                            listing.foodType === 'JAIN' ? 'bg-amber-500/95 text-white' :
                            listing.foodType === 'NON_VEG' ? 'bg-orange-500/95 text-white' :
                            'bg-slate-950/70 text-white'
                          }`}>
                            {listing.foodType === 'VEG_ONLY' ? '🌿 Veg' :
                             listing.foodType === 'JAIN' ? '🙏 Jain' :
                             listing.foodType === 'NON_VEG' ? '🍗 Non-Veg' :
                             '🚫 No Meals'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center ${isRoommate ? 'text-violet-600' : 'text-indigo-600'} text-lg font-extrabold`}>
                            <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{listing.price.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-slate-400 font-normal ml-1">
                              {isRoommate ? '/ share' : (listing.category === 'HOTEL' && listing.isSharedHotelRoom && listing.parsedFacilities?.isAlreadyBooked === false ? '/ split budget' : '/ month')}
                            </span>
                          </div>

                          {isRoommate && isAuthenticated && (
                            listing.matchScore !== undefined && listing.matchScore !== null ? (
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                listing.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-xs' :
                                listing.matchScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                              }`} title="Roommate compatibility match percentage">
                                🧩 {listing.matchScore}% Match
                              </span>
                            ) : (
                              <Link 
                                href="/roommate-quiz" 
                                className="relative z-20 text-[10px] text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-100 font-bold transition select-none"
                              >
                                Match %
                              </Link>
                            )
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition flex-grow">
                            {listing.title}
                          </h3>
                          {listing.category === 'HOTEL' && listing.isSharedHotelRoom && listing.roommateGender && (
                            <span className={`shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase select-none ${
                              listing.roommateGender === 'MALE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              listing.roommateGender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                              'bg-slate-50 text-slate-650 border-slate-205'
                            }`}>
                              {listing.roommateGender === 'MALE' ? 'Male Only' :
                               listing.roommateGender === 'FEMALE' ? 'Female Only' :
                               'Any Gender'}
                            </span>
                          )}
                        </div>

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
                        {listing.commuteDuration !== undefined && listing.commuteDuration !== null && (
                          <span className="shrink-0 bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-0.5">
                            🕐 {listing.commuteDuration}m {commuteMode === 'walking' ? '🚶' : commuteMode === 'bike' ? '🏍️' : '🚗'}
                          </span>
                        )}
                        {listing.hasMetro && (
                          <span className="shrink-0 bg-indigo-50 text-indigo-755 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            🚇 Near Metro
                          </span>
                        )}
                      </div>

                      {/* Host Profile & Connect */}
                      <div className="pt-3.5 border-t border-slate-100 relative z-20">
                        <ListingConnectTrigger
                          lister={listing.user}
                          listing={listing}
                          isAuthenticated={isAuthenticated}
                          currentUserVerified={currentUserVerified}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-3 pt-8 pb-16">
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

              <div className="flex flex-wrap justify-center items-center gap-1.5 text-sm font-semibold">
                {visiblePages.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-3 py-2 text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }

                  const pageNum = p as number;
                  const isCurrent = pageNum === page;
                  return isCurrent ? (
                    <span
                      key={pageNum}
                      className="px-3.5 py-2 bg-indigo-650 text-white rounded-xl select-none"
                    >
                      {pageNum}
                    </span>
                  ) : (
                    <Link
                      key={pageNum}
                      href={getPaginationUrl(pageNum)}
                      className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-650 transition"
                    >
                      {pageNum}
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
      {/* Compare Bar */}
      <CompareBar />
    </div>
  );
}
