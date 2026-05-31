import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { calculateCompatibility } from '@/lib/roommateMatcher';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingStatus, Role, ListingCategory } from '@/lib/types';
import { Building, MapPin, IndianRupee, Clock, ClipboardList, Calendar, ArrowLeft, Lock, LogIn, Globe, Users, Sparkles, Star, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import ContactDetails from './ContactDetails';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import MapWrapper from '@/components/MapWrapper';
import ReviewForm from './ReviewForm';
import MoveInCostCalculator from '@/components/MoveInCostCalculator';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import RentEstimatorWidget from '@/components/RentEstimatorWidget';
import ViewingScheduler from '@/components/ViewingScheduler';
import LanguageTranslator from '@/components/LanguageTranslator';
import TranslatedText from '@/components/TranslatedText';
import MoveInChecklist from '@/components/MoveInChecklist';
import ListingViewTracker from '@/components/ListingViewTracker';
import ListingQA from '@/components/ListingQA';
import SharePanel from '@/components/SharePanel';

export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    commuteLat?: string;
    commuteLng?: string;
    commuteAddress?: string;
    commuteMode?: string;
  }>;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function ListingDetailPage({ params, searchParams }: ListingDetailPageProps) {
  const { id } = await params;

  const listing = (await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          lifestyleProfile: true,
          documentVerified: true,
        } as any,
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
  })) as any;

  if (!listing) {
    notFound();
  }

  // Fetch requesting traveler's details if there is an active split request
  let requesterName = '';
  if (listing.hotelSplitUserId) {
    try {
      const requester = await prisma.user.findUnique({
        where: { id: listing.hotelSplitUserId },
        select: { name: true },
      });
      requesterName = requester?.name || 'Anonymous traveler';
    } catch (err) {
      console.error('Failed to load split requester info:', err);
    }
  }

  // Get session for auth checking
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;
  const userRole = session?.user ? (session.user as any).role : null;
  const isAuthenticated = !!session?.user;
  const isOwner = userId === listing.userId;
  const isAdmin = userRole === Role.ADMIN;

  let userVerified = false;
  let currentUserProfile: any = null;
  if (isAuthenticated && userId) {
    try {
      const dbUser: any = await prisma.user.findUnique({
        where: { id: userId },
        select: { lifestyleProfile: true, documentVerified: true } as any,
      });
      if (dbUser) {
        userVerified = !!dbUser.documentVerified;
        if (dbUser.lifestyleProfile) {
          currentUserProfile = JSON.parse(dbUser.lifestyleProfile);
        }
      }
    } catch (err) {
      console.error('Failed to load current user roommate profile:', err);
    }
  }

  const isRestricted = listing.requireVerification && !userVerified && !isOwner && !isAdmin;

  const ownerProfile = listing.user?.lifestyleProfile ? JSON.parse(listing.user.lifestyleProfile) : null;
  const matchScore = calculateCompatibility(currentUserProfile, ownerProfile);

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

  // Parse commute params and fetch duration
  const resolvedSearchParams = await searchParams;
  const commuteLat = resolvedSearchParams.commuteLat ? parseFloat(resolvedSearchParams.commuteLat) : undefined;
  const commuteLng = resolvedSearchParams.commuteLng ? parseFloat(resolvedSearchParams.commuteLng) : undefined;
  const commuteAddress = resolvedSearchParams.commuteAddress || '';
  const commuteMode = resolvedSearchParams.commuteMode || 'driving';

  let commuteDuration: number | null = null;
  if (commuteLat !== undefined && commuteLng !== undefined) {
    try {
      const url = `https://router.project-osrm.org/table/v1/driving/${commuteLng},${commuteLat};${listing.lng},${listing.lat}?sources=0&annotations=duration`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ToolateServer/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data.durations && data.durations[0]) {
          const originalSeconds = data.durations[0][1];
          if (originalSeconds !== null && originalSeconds !== undefined) {
            let factor = 1.0;
            if (commuteMode === 'walking') factor = 6.0;
            else if (commuteMode === 'bike') factor = 0.85;
            commuteDuration = Math.round((originalSeconds * factor) / 60);
          }
        }
      }
    } catch {}

    if (commuteDuration === null) {
      const dist = calculateDistance(commuteLat, commuteLng, listing.lat, listing.lng);
      const speed = commuteMode === 'walking' ? 5 : commuteMode === 'bike' ? 25 : 35;
      commuteDuration = Math.round((dist / speed) * 60 * 1.3);
    }
  }

  // Calculate review stats
  const reviews = listing.reviews || [];
  const averageRating = reviews.length > 0
    ? parseFloat((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1))
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
      <ListingViewTracker listingId={listing.id} />
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

          {/* Verification Restriction Warning Banner */}
          {isRestricted && (
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-250/70 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-xs animate-pulse">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shrink-0">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="flex-grow space-y-1 text-center sm:text-left">
                <h4 className="font-extrabold text-amber-900 text-sm">🔒 Government ID Verification Required</h4>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                  This listing is ID-locked by the host. You must upload and verify your Aadhaar or Passport in your profile settings to view contact info, map location, or schedule a visit.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition whitespace-nowrap active:scale-95 shrink-0"
              >
                Verify ID Now
              </Link>
            </div>
          )}

          {/* Homestay Stay Details Banner */}
          {listing.category === ListingCategory.HOUSE_GUEST && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/30 border border-emerald-100 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md">
                  <Building className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-900 text-base flex items-center gap-1.5">
                    <span>Homestay / Guest Program</span>
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold mt-1 uppercase tracking-wide">
                    Stay arrangement: {listing.priceType === 'FREE' ? '🎁 100% Free Stay' : listing.priceType === 'OTHER' ? '🤝 Exchange Stay' : '💰 Paid Stay (Daily rate)'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 self-start md:self-auto">
                {listing.requireVerification ? (
                  <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-black flex items-center gap-1.5 shadow-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-650" />
                    <span>Government ID Verification Required</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-950 border border-emerald-250/70 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs">
                    No special ID requirement
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared Hotel Room Details Banner */}
          {listing.category === ListingCategory.HOTEL && listing.isSharedHotelRoom && (
            <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-indigo-150/30 border border-indigo-100/80 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md">
                    <Building className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-950 text-base flex items-center gap-1.5">
                      <span>Hotel Room Share & Cost Split</span>
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 fill-emerald-50" />
                    </h4>
                    <p className="text-xs text-indigo-700 font-semibold mt-1 uppercase tracking-wide">
                      🤝 Split stay program (50/50 cost split)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-xl border border-emerald-150 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hotel Vetted</span>
                  </span>
                  <span className="bg-indigo-50 text-indigo-755 text-xs font-bold px-3 py-1 rounded-xl border border-indigo-100">
                    ID Locked
                  </span>
                </div>
              </div>

              {/* Booking metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-semibold text-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Hotel Name</span>
                    <span className="text-indigo-950 font-bold">{listing.hotelName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Booking Ref ID</span>
                    {userVerified || isOwner || isAdmin ? (
                      <span className="text-indigo-950 font-bold font-mono">{listing.hotelBookingRef}</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Split Cost / Party</span>
                    <span className="text-emerald-700 font-extrabold flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      {(listing.price / 2).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Check-In Date</span>
                    <span className="text-indigo-950 font-bold">
                      {listing.checkInDate ? new Date(listing.checkInDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Check-Out Date</span>
                    <span className="text-indigo-950 font-bold">
                      {listing.checkOutDate ? new Date(listing.checkOutDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-medium">Booking Proof</span>
                    {userVerified || isOwner || isAdmin ? (
                      listing.hotelBookingProofUrl ? (
                        <a
                          href={listing.hotelBookingProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-650 hover:text-indigo-755 hover:underline font-bold"
                        >
                          View Receipt Link
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium">None</span>
                      )
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Verify ID to View
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification & Split CTA Controls */}
              <div className="pt-4 border-t border-indigo-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium max-w-md">
                  💡 **Security Warning**: Booking proof matches coordinates and stay dates. To prevent financial fraud, never pay outside Toolate or before verifying host details.
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {isOwner ? (
                    /* Owner controls: show split request */
                    listing.hotelSplitStatus === 'REQUESTED' ? (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                        <p className="text-xs font-bold text-slate-700">
                          Incoming Cost-Split Request from <strong className="text-indigo-650">{requesterName}</strong>
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            data-split-action="ACCEPT"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            Approve & Finalize
                          </button>
                          <button
                            type="button"
                            data-split-action="REJECT"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    ) : listing.hotelSplitStatus === 'COMPLETED' ? (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-650" />
                        <span>Cost split finalized! Shared stay active.</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-205 text-slate-500 font-semibold text-xs px-4 py-2.5 rounded-xl">
                        Awaiting requests to split...
                      </div>
                    )
                  ) : (
                    /* Traveler controls */
                    listing.hotelSplitStatus === 'AVAILABLE' ? (
                      userVerified ? (
                        <button
                          type="button"
                          id="btn-request-split"
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition active:scale-95 shadow-md cursor-pointer"
                        >
                          Request Co-stay & Split Cost (50/50)
                        </button>
                      ) : (
                        <div className="text-amber-800 bg-amber-50 border border-amber-100 text-[11px] font-bold p-3 rounded-xl flex items-center gap-1.5">
                          <Lock className="w-4 h-4 shrink-0" />
                          <span>Verify your Government ID to request split!</span>
                        </div>
                      )
                    ) : listing.hotelSplitStatus === 'REQUESTED' ? (
                      <div className="bg-amber-50 border border-amber-100 text-amber-955 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-650" />
                        <span>Co-stay request pending host approval...</span>
                      </div>
                    ) : (
                      <div className="bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs px-4 py-2.5 rounded-xl">
                        Split completed (Stay shared)
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Client Component Actions Hydration script */}
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function() {
                      // Request Split Action
                      var btn = document.getElementById("btn-request-split");
                      if (btn) {
                        btn.addEventListener("click", function() {
                          btn.disabled = true;
                          btn.innerText = "Submitting request...";
                          fetch("/api/listings/${listing.id}/split", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" }
                          }).then(function(res) {
                            return res.json();
                          }).then(function(data) {
                            if (data.success) {
                              alert("Co-stay split request submitted! Reloading page...");
                              window.location.reload();
                            } else {
                              alert(data.error || "Failed to submit request.");
                              btn.disabled = false;
                              btn.innerText = "Request Co-stay & Split Cost (50/50)";
                            }
                          }).catch(function() {
                            alert("Failed to submit request.");
                            btn.disabled = false;
                            btn.innerText = "Request Co-stay & Split Cost (50/50)";
                          });
                        });
                      }

                      // Lister Accept / Reject Actions
                      document.querySelectorAll("[data-split-action]").forEach(function(el) {
                        el.addEventListener("click", function() {
                          var action = el.getAttribute("data-split-action");
                          el.disabled = true;
                          fetch("/api/listings/${listing.id}/split", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: action })
                          }).then(function(res) {
                            return res.json();
                          }).then(function(data) {
                            if (data.success) {
                              alert("Request " + action.toLowerCase() + "ed! Reloading...");
                              window.location.reload();
                            } else {
                              alert(data.error || "Failed to submit action.");
                              el.disabled = false;
                            }
                          }).catch(function() {
                            alert("Failed to submit action.");
                            el.disabled = false;
                          });
                        });
                      });
                    })();
                  `
                }}
              />
            </div>
          )}

          {/* Roommate highlight banner */}
          {isRoommate && (
            <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 border border-violet-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-violet-600 text-white p-3.5 rounded-2xl shadow-md">
                    <Users className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-violet-900 text-base flex items-center gap-1.5">
                      <span>Room Sharing / Roommate Partner</span>
                      <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    </h4>
                    <p className="text-xs text-indigo-700 font-semibold mt-1 uppercase tracking-wide">
                      {listing.roommateType === 'HAVE_ROOM' ? 'Has Room / Looking for Flatmate' : 'Needs Room / Looking for Flat'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 self-start md:self-auto">
                  <div className="bg-white/80 border border-violet-100 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold shadow-sm">
                    Pref. Gender: <span className="text-violet-700">{
                      listing.roommateGender === 'MALE' ? 'Male Preferred' : listing.roommateGender === 'FEMALE' ? 'Female Preferred' : 'Any Gender'
                    }</span>
                  </div>
                  {isAuthenticated ? (
                    currentUserProfile ? (
                      matchScore !== null ? (
                        <div className="bg-violet-100 text-violet-900 border border-violet-200 rounded-xl px-4 py-2 text-xs font-black flex items-center gap-1.5 shadow-sm">
                          <span>🧩</span>
                          <span>{matchScore}% Compatibility Match</span>
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-2 text-xs font-bold shadow-sm">
                          No owner profile to compare
                        </div>
                      )
                    ) : (
                      <Link
                        href="/roommate-quiz"
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <span>🧩</span>
                        <span>Check Compatibility (Take Quiz)</span>
                      </Link>
                    )
                  ) : (
                    <Link
                      href="/login"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <span>🧩</span>
                      <span>Sign in to check compatibility match</span>
                    </Link>
                  )}
                </div>
              </div>

              {listing.checkInDate && listing.checkOutDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 pt-4 border-t border-violet-100/55">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 uppercase tracking-wider">Desired Check-In</span>
                    <span className="text-violet-950">{new Date(listing.checkInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 uppercase tracking-wider">Desired Check-Out (Expires)</span>
                    <span className="text-violet-950">{new Date(listing.checkOutDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Listing Core Title and Price */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {listing.featured && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider animate-pulse select-none">
                    ⭐ Featured
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
                  isRoommate ? 'bg-violet-50 text-violet-600' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {isRoommate ? 'Roommate' : listing.category.toLowerCase()}
                </span>
                {listing.foodType && (listing.category === ListingCategory.PG || listing.category === ListingCategory.HOSTEL || listing.category === ListingCategory.DORMITORY) && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
                    listing.foodType === 'VEG_ONLY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    listing.foodType === 'JAIN' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    listing.foodType === 'NON_VEG' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                    'bg-slate-50 text-slate-700 border border-slate-100'
                  }`}>
                    {listing.foodType === 'VEG_ONLY' ? '🌿 Veg Only' :
                     listing.foodType === 'JAIN' ? '🙏 Jain Food' :
                     listing.foodType === 'NON_VEG' ? '🍗 Non-Veg' :
                     '🚫 No Meals'}
                  </span>
                )}
                {commuteDuration !== null && (
                  <span className="text-xs font-bold px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span>{commuteMode === 'walking' ? '🚶' : commuteMode === 'bike' ? '🏍️' : '🚗'}</span>
                    <span>{commuteDuration} Mins to Work ({commuteAddress.split(',')[0]})</span>
                  </span>
                )}
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
              <div className="space-y-2">
                <TranslatedText
                  originalText={listing.title}
                  as="h1"
                  className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight"
                />
                <div className="pt-0.5">
                  <SharePanel title={listing.title} />
                </div>
              </div>
              <div className={`flex items-center ${isRoommate ? 'text-violet-600' : 'text-indigo-600'} text-2xl font-black shrink-0`}>
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

            <div className="border-t border-slate-100 pt-3">
              <LanguageTranslator />
            </div>

            {/* Location info - always show area, full address only for auth users */}
            <div className="flex flex-col gap-2 border-t border-slate-50 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center text-sm text-slate-500 gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  {isAuthenticated ? (
                    <span>{listing.address}</span>
                  ) : (
                    <span>{listing.area}{listing.city ? `, ${listing.city}` : ''}{listing.state ? `, ${listing.state}` : ''}</span>
                  )}
                </div>
                {listing.city && listing.area && (
                  <Link
                    href={`/areas/${encodeURIComponent(listing.city)}/${encodeURIComponent(listing.area)}`}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                  >
                    🏘️ Area Reviews
                  </Link>
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
                {facilities.accommodationType && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">Accommodation</span>
                    <span className="text-indigo-650 bg-indigo-50/50 px-3 py-1 rounded-md text-xs font-bold uppercase">
                      {facilities.accommodationType === 'ROOM_ONLY' ? 'Private Room' :
                       facilities.accommodationType === 'SHARED_ROOM' ? 'Shared Room' :
                       facilities.accommodationType === 'COUCH_SPACE' ? 'Couch Space' :
                       'Full House'}
                    </span>
                  </div>
                )}
                {facilities.hostSetup && (
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-400 font-medium">Host Setup</span>
                    <span className="text-indigo-655 bg-indigo-50/55 px-3 py-1 rounded-md text-xs font-bold uppercase text-right">
                      {facilities.hostSetup === 'LIVES_WITH_HOST' ? 'Lives with Host' : 'Independent'}
                    </span>
                  </div>
                )}
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
                  {facilities.kitchenAccess !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.kitchenAccess ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Kitchen Access Allowed</span>
                    </div>
                  )}
                  {facilities.sharedMeals !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.sharedMeals ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Shared Meals Offered</span>
                    </div>
                  )}
                  {facilities.petsAllowed !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.petsAllowed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Pets Allowed</span>
                    </div>
                  )}
                  {facilities.localGuiding !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.localGuiding ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Local Tips & Guiding</span>
                    </div>
                  )}
                  {facilities.washingMachine !== undefined && (
                    <div className="flex items-center gap-2">
                      {facilities.washingMachine ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-300" />}
                      <span>Washing Machine Access</span>
                    </div>
                  )}
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

                  {/* WFH & Employee Stays Details */}
                  {facilities.wfhFriendly && (
                    <div className="md:col-span-2 mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs uppercase tracking-wider">
                        <span>💻 Optimized for WFH / Remote Employees</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-slate-700 text-left">
                        <div className="flex items-center justify-between border-b border-indigo-100/30 pb-1.5">
                          <span className="text-slate-400 font-medium">Rent/Stay Cycle Basis</span>
                          <span className="text-indigo-900 font-bold uppercase">
                            {facilities.bookingBasis === 'MONTHLY' ? 'Monthly' :
                             facilities.bookingBasis === 'WEEKLY' ? 'Weekly' :
                             facilities.bookingBasis === 'DAILY' ? 'Daily' :
                             'Flexible/Negotiable'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {facilities.wfhWifi ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-350" />}
                          <span>High-Speed Wi-Fi (100+ Mbps)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {facilities.wfhDesk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-350" />}
                          <span>Dedicated Work Desk & Ergonomic Chair</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {facilities.wfhPower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-350" />}
                          <span>24/7 Power Backup / UPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {facilities.wfhQuiet ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-350" />}
                          <span>Quiet Working Environment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {facilities.wfhTea ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-350" />}
                          <span>Coffee/Tea Station Access</span>
                        </div>
                      </div>
                      {facilities.wfhTerms && (
                        <div className="pt-2 border-t border-indigo-100/30 text-xs text-left">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Employee Terms & Conditions</span>
                          <p className="text-slate-600 font-medium italic">"{facilities.wfhTerms}"</p>
                        </div>
                      )}
                    </div>
                  )}
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
              <TranslatedText
                originalText={listing.description}
                as="p"
                className="text-slate-650 text-sm leading-relaxed whitespace-pre-line"
              />
            ) : (
              <div className="space-y-3">
                <TranslatedText
                  originalText={listing.description.substring(0, 120) + '...'}
                  as="p"
                  className="text-slate-655 text-sm leading-relaxed"
                />
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

          {/* Map Location - only for authenticated and non-restricted users */}
          {isAuthenticated && !isRestricted && (
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
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="pt-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 uppercase shrink-0 text-sm border border-indigo-100">
                      {rev.user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-800">{rev.user.name || 'Anonymous User'}</h4>
                            {rev.verifiedTenant && (
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider flex items-center gap-0.5 select-none shrink-0">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Verified Tenant</span>
                              </span>
                            )}
                          </div>
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
                      
                      {/* Sub-ratings visualization */}
                      {(rev.responsiveness || rev.honesty || rev.maintenance || rev.depositReturn) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {rev.responsiveness && (
                            <span className="text-[8px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-slate-500">
                              Responsiveness: <strong className="text-indigo-650 font-extrabold">{rev.responsiveness}/5</strong>
                            </span>
                          )}
                          {rev.honesty && (
                            <span className="text-[8px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-slate-500">
                              Honesty: <strong className="text-indigo-650 font-extrabold">{rev.honesty}/5</strong>
                            </span>
                          )}
                          {rev.maintenance && (
                            <span className="text-[8px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-slate-500">
                              Maintenance: <strong className="text-indigo-650 font-extrabold">{rev.maintenance}/5</strong>
                            </span>
                          )}
                          {rev.depositReturn && (
                            <span className="text-[8px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider text-slate-500">
                              Deposit Return: <strong className="text-indigo-650 font-extrabold">{rev.depositReturn}/5</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Q&A section */}
          <ListingQA
            listingId={listing.id}
            isOwner={isOwner}
            isAuthenticated={isAuthenticated}
          />
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
              isRestricted={isRestricted}
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

          {/* Rent Estimator Widget */}
          <RentEstimatorWidget
            listingId={listing.id}
            price={listing.price}
            city={listing.city}
            area={listing.area}
            category={listing.category}
            furnishing={facilities.furnishedStatus}
          />

          {/* Viewing Scheduler */}
          {isAuthenticated && !isRestricted && (
            <ViewingScheduler listingId={listing.id} />
          )}

          {/* Move-in Cost Calculator */}
          {!isRoommate && (
            <MoveInCostCalculator monthlyRent={listing.price} />
          )}

          {/* Move-in Checklist */}
          <MoveInChecklist
            listingTitle={listing.title}
            listingAddress={isAuthenticated ? listing.address : `${listing.area}, ${listing.city || ''}`}
            category={listing.category}
          />

          {/* QR Code Generator - Owner only */}
          {isOwner && (
            <QRCodeGenerator
              listingId={listing.id}
              listingTitle={listing.title}
              listingPrice={listing.price}
              listingArea={listing.area}
              listingCity={listing.city}
            />
          )}

          {/* Sidebar Advertisement placeholder */}
          <AdSensePlaceholder slot="sidebar-rect" format="rectangle" className="w-full min-h-[250px]" />
        </div>
      </div>
    </div>
  );
}
