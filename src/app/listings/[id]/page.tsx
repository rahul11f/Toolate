import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingStatus, Role, ListingCategory } from '@/lib/types';
import { Building, MapPin, IndianRupee, Clock, ClipboardList, Calendar, ArrowLeft, Lock, LogIn, Globe, Users, Sparkles, Star, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import ContactDetails from './ContactDetails';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import MapWrapper from '@/components/MapWrapper';
import ReviewForm from './ReviewForm';

export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Get session for auth checking
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;
  const userRole = session?.user ? (session.user as any).role : null;
  const isAuthenticated = !!session?.user;
  const isOwner = userId === listing.userId;
  const isAdmin = userRole === Role.ADMIN;

  // Auth checking for pending or rejected listings
  if (listing.status !== ListingStatus.APPROVED) {
    if (!isOwner && !isAdmin) {
      redirect('/listings');
    }
  }

  const parsedImages = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images;
  const isRoommate = listing.category === ListingCategory.ROOMMATE;

  // Parse facilities JSON
  let facilities: Record<string, any> = {};
  try {
    facilities = listing.facilities ? JSON.parse(listing.facilities) : {};
  } catch (err) {
    console.error('Failed to parse listing facilities:', err);
  }

  // Calculate review stats
  const reviews = listing.reviews || [];
  const averageRating = reviews.length > 0
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Helper to format facilities names
  const getFurnishingLabel = (val: string) => {
    if (val === 'FURNISHED') return 'Fully Furnished';
    if (val === 'SEMI_FURNISHED') return 'Semi-Furnished';
    return 'Unfurnished';
  };

  const getParkingLabel = (val: string) => {
    if (val === 'BIKE') return 'Bike Parking Only';
    if (val === 'CAR') return 'Car Parking Only';
    if (val === 'BOTH') return 'Car & Bike Parking';
    return 'No Parking';
  };

  const getElectricityLabel = (val: string) => {
    if (val === 'INCLUDED') return 'Bills Included in Cost';
    if (val === 'SPLIT_EQUALLY') return 'Split Utility Bills Equally';
    return 'Separate Meter / Bills';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-655 transition gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Media and Core Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images Slide */}
          <ImageCarousel images={parsedImages} title={listing.title} />

          {/* Roommate highlight banner */}
          {isRoommate && (
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border border-violet-100 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-violet-600 text-white p-3.5 rounded-2xl shadow-md">
                  <Users className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-violet-900 text-base flex items-center gap-1.5">
                    <span>Roommate Finder Profile</span>
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  </h4>
                  <p className="text-xs text-indigo-700 font-semibold mt-1 uppercase tracking-wide">
                    {listing.roommateType === 'HAVE_ROOM' ? 'Has Room / Looking for Flatmate' : 'Needs Room / Looking for Flat'}
                  </p>
                </div>
              </div>
              <div className="bg-white/80 border border-violet-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold self-start md:self-auto shadow-xs">
                Pref. Gender: <span className="text-violet-700">{
                  listing.roommateGender === 'MALE' ? 'Male Preferred' : listing.roommateGender === 'FEMALE' ? 'Female Preferred' : 'Any Gender'
                }</span>
              </div>
            </div>
          )}

          {/* Listing Core Title and Price */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {listing.featured && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider animate-pulse select-none">
                    ⭐ Featured
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
                  isRoommate ? 'bg-violet-50 text-violet-650' : 'bg-indigo-50 text-indigo-650'
                }`}>
                  {isRoommate ? 'Roommate' : listing.category.toLowerCase()}
                </span>
                {listing.status !== ListingStatus.APPROVED && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
                    listing.status === ListingStatus.PENDING ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {listing.status.toLowerCase()} approval
                  </span>
                )}
              </div>

              {/* Star Rating summary */}
              {averageRating > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-800">{averageRating}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">({reviews.length} reviews)</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-start flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                {listing.title}
              </h1>
              <div className={`flex items-center ${isRoommate ? 'text-violet-650' : 'text-indigo-650'} text-2xl font-black shrink-0`}>
                <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                <span>{listing.price.toLocaleString('en-IN')}</span>
                <span className="text-sm text-slate-400 font-normal ml-1">
                  {isRoommate
                    ? '/ share'
                    : listing.category === ListingCategory.HOURLY_ROOM
                    ? '/ hour'
                    : listing.category === ListingCategory.DORMITORY
                    ? '/ bed'
                    : '/ month'}
                </span>
              </div>
            </div>

            {/* Location info - always show area, full address only for auth users */}
            <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
              <div className="flex items-center text-sm text-slate-500 gap-1.5">
                <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                {isAuthenticated ? (
                  <span>{listing.address}</span>
                ) : (
                  <span>{listing.area}{listing.city ? `, ${listing.city}` : ''}{listing.state ? `, ${listing.state}` : ''}</span>
                )}
              </div>
              {(listing.state || listing.city) && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>
                    {[listing.city, listing.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Facilities Display Card */}
          {Object.keys(facilities).length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-50 pb-2">
                <ClipboardList className="w-5 h-5 text-indigo-555" />
                <span>Amenities & Facilities</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold text-slate-650">
                {/* Select/Value parameters */}
                {facilities.furnishedStatus && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">Furnishing</span>
                    <span className="text-indigo-650 bg-indigo-50/50 px-3 py-1 rounded-md text-xs font-bold uppercase">{getFurnishingLabel(facilities.furnishedStatus)}</span>
                  </div>
                )}
                {facilities.electricityCharges && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">{isRoommate ? 'Utilities split' : 'Electricity charges'}</span>
                    <span className="text-indigo-655 bg-indigo-50/55 px-3 py-1 rounded-md text-xs font-bold">{getElectricityLabel(facilities.electricityCharges)}</span>
                  </div>
                )}
                {facilities.parking && facilities.parking !== 'NONE' && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">Parking Available</span>
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md text-xs font-bold uppercase">{getParkingLabel(facilities.parking)}</span>
                  </div>
                )}

                {/* Yes/No Checkboxes Grid */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3 pt-2">
                  {facilities.roWater !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.roWater ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>RO Drinking Water</span>
                    </div>
                  )}
                  {facilities.powerBackup !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.powerBackup ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Power Backup / 24/7 Power</span>
                    </div>
                  )}
                  {facilities.internet !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.internet ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>High-Speed Wi-Fi Internet</span>
                    </div>
                  )}
                  {facilities.messService !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.messService ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Meals / Mess Service</span>
                    </div>
                  )}
                  {facilities.laundry !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.laundry ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Laundry Facility</span>
                    </div>
                  )}
                  {facilities.acAvailable !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.acAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Air Conditioning</span>
                    </div>
                  )}
                  {facilities.meetingRoom !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.meetingRoom ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Conference Meeting Rooms</span>
                    </div>
                  )}
                  {facilities.security !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.security ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>24/7 Security Guards & CCTV</span>
                    </div>
                  )}
                  {facilities.heavyVehicleAccess !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.heavyVehicleAccess ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Heavy Vehicle Shutter Access</span>
                    </div>
                  )}
                  {facilities.fireSafety !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.fireSafety ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Fire Hydrants & Safety Systems</span>
                    </div>
                  )}
                  {facilities.cookAvailable !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.cookAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Cook / Maid services</span>
                    </div>
                  )}
                  {facilities.smokingAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.smokingAllowed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Smoking Allowed</span>
                    </div>
                  )}
                  {facilities.bunkBeds !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.bunkBeds ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Bunk Beds Type</span>
                    </div>
                  )}
                  {facilities.lockers !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.lockers ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Personal Lockers</span>
                    </div>
                  )}
                  {facilities.sharedBathrooms !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.sharedBathrooms ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Shared Bathrooms</span>
                    </div>
                  )}
                  {facilities.roomService !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.roomService ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Room Service</span>
                    </div>
                  )}
                  {facilities.tvAvailable !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.tvAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Smart TV in Room</span>
                    </div>
                  )}
                  {facilities.attachedBathroom !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.attachedBathroom ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Attached Bathroom</span>
                    </div>
                  )}
                  {facilities.breakfastIncluded !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.breakfastIncluded ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Complimentary Breakfast</span>
                    </div>
                  )}
                  {facilities.commonKitchen !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.commonKitchen ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Common Kitchen Access</span>
                    </div>
                  )}
                  {facilities.hotWater !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.hotWater ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Hot Water Facility</span>
                    </div>
                  )}
                  {facilities.lockerFacility !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.lockerFacility ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Locker Room Facility</span>
                    </div>
                  )}
                  {facilities.pureVegOnly !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.pureVegOnly ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Strict Pure Vegetarian Rules</span>
                    </div>
                  )}
                  {facilities.flexibleCheckIn !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.flexibleCheckIn ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Flexible 24/7 Check-in</span>
                    </div>
                  )}
                  {facilities.workspace !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.workspace ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Desk / Dedicated Workspace</span>
                    </div>
                  )}
                  {facilities.privacyLock !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.privacyLock ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Privacy Smart-card Lock</span>
                    </div>
                  )}

                  {/* Render Custom Checklist Items */}
                  {facilities.custom && Array.isArray(facilities.custom) && facilities.custom.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 fill-indigo-50/10" />
                      <span className="font-semibold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-lg">
              {isRoommate ? 'Roommate & Lifestyle Profile' : 'Property Description'}
            </h3>
            {isAuthenticated ? (
              <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-655 text-sm leading-relaxed">
                  {listing.description.substring(0, 120)}...
                </p>
                <div className="flex items-center gap-2 text-xs text-indigo-650 font-semibold bg-indigo-50 px-3 py-2 rounded-lg">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign in to read the full description details</span>
                </div>
              </div>
            )}
          </div>

          {/* Terms and Timing metadata - only for authenticated users */}
          {isAuthenticated ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opening / Closing hours */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <Clock className="w-5 h-5 stroke-[2]" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    {isRoommate ? 'Preferred Calling Hours' : 'Visiting Hours'}
                  </h4>
                </div>
                <p className="text-slate-650 text-sm font-medium">
                  {listing.openingHours} &mdash; {listing.closingHours}
                </p>
              </div>

              {/* Landlord/Roommate rules */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <ClipboardList className="w-5 h-5 stroke-[2]" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    {isRoommate ? 'Roommate Rules & Habits' : 'Landlord Terms'}
                  </h4>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line">
                  {listing.landlordTerms}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-650" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Detailed Info Locked</h3>
                <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {isRoommate
                    ? 'Calling hours, roommate rules, exact location, and contact options are available to registered users only.'
                    : 'Visiting hours, landlord terms, exact address, and map location are available to registered users only.'
                  }
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition text-sm active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to View Full Details</span>
              </Link>
            </div>
          )}

          {/* Map Location - only for authenticated users */}
          {isAuthenticated && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Mapped Coordinates</h3>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  Lat: {listing.lat.toFixed(5)}, Lng: {listing.lng.toFixed(5)}
                </span>
              </div>
              <div className="h-80 w-full rounded-xl overflow-hidden">
                <MapWrapper lat={listing.lat} lng={listing.lng} zoom={15} />
              </div>
            </div>
          )}

          {/* Reviews List & Submission section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-50 pb-2">
              <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
              <span>Reviews & Tenant Feedback</span>
            </h3>

            {/* Review Submission Form (Only if authenticated, and not the owner) */}
            {isAuthenticated ? (
              !isOwner ? (
                <ReviewForm listingId={listing.id} />
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-450 text-xs font-semibold text-center select-none">
                  * You cannot write reviews for your own listing property.
                </div>
              )
            ) : (
              <div className="p-5 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-450">
                <span>Want to review this listing? Login now.</span>
                <Link href="/login" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition">Login</Link>
              </div>
            )}

            {/* Reviews Timeline list */}
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
                No reviews posted for this property yet. Be the first to share your experience!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-6 pt-2">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 uppercase shrink-0 text-sm border border-indigo-100">
                      {rev.user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{rev.user.name || 'Anonymous User'}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Contact Sidebar and Ads */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 sticky top-20">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {isRoommate ? 'Expected Cost Share' : 'Estimated Cost'}
              </span>
              <div className="flex items-baseline text-slate-800">
                <span className="text-3xl font-extrabold flex items-center">
                  <IndianRupee className="w-6 h-6 stroke-[2.5] text-indigo-600 shrink-0" />
                  {listing.price.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-450 ml-1 text-sm font-medium">
                  {isRoommate ? '/ share' : '/ month'}
                </span>
              </div>
            </div>

            {/* Contact details - auth-aware */}
            <ContactDetails
              contactNumber={listing.contactNumber}
              whatsappNumber={listing.whatsappNumber}
              isAuthenticated={isAuthenticated}
            />

            <div className="border-t border-slate-50 pt-4 space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Posted on {new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="leading-relaxed">
                * Please inspect the property before transferring advance money. Toolate does not collect deposits.
              </p>
            </div>
          </div>

          {/* Sidebar Advertisement placeholder */}
          <AdSensePlaceholder slot="sidebar-rect" format="rectangle" className="w-full min-h-[250px]" />
        </div>
      </div>
    </div>
  );
}
