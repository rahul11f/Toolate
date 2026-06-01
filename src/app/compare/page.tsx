'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, IndianRupee, MapPin, CheckCircle2, XCircle, Trash2, Phone, MessageCircle, Building, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompareListing {
  id: string;
  title: string;
  category: string;
  price: number;
  area: string;
  city: string;
  state: string;
  address: string;
  images: string[];
  facilities: Record<string, any>;
  contactNumber: string;
  whatsappNumber: string;
  foodType: string | null;
  createdAt: string;
  featured: boolean;
}

const FACILITY_LABELS: Record<string, string> = {
  furnishedStatus: 'Furnishing',
  parking: 'Parking',
  electricityCharges: 'Electricity',
  roWater: 'RO Water',
  powerBackup: 'Power Backup',
  internet: 'Wi-Fi',
  messService: 'Meals/Mess',
  laundry: 'Laundry',
  acAvailable: 'AC',
  security: 'Security/CCTV',
  meetingRoom: 'Meeting Room',
  cookAvailable: 'Cook/Maid',
  smokingAllowed: 'Smoking OK',
  attachedBathroom: 'Attached Bath',
  hotWater: 'Hot Water',
};

export default function ComparePage() {
  const [listings, setListings] = useState<CompareListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get('ids') || '';
    const ids = idsParam.split(',').filter(Boolean);

    if (ids.length < 2) {
      setLoading(false);
      return;
    }

    // Fetch each listing
    const fetchListings = async () => {
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/listings/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            const listing = data.listing || data;
            return {
              ...listing,
              images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
              facilities: typeof listing.facilities === 'string' ? JSON.parse(listing.facilities) : (listing.facilities || {}),
            };
          })
        );
        setListings(results.filter(Boolean) as CompareListing[]);
      } catch (err) {
        console.error('Failed to fetch comparison listings:', err);
        toast.error('Failed to load some listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleRemove = (id: string) => {
    const stored: string[] = JSON.parse(localStorage.getItem('toolate_compare') || '[]');
    const updated = stored.filter((i) => i !== id);
    localStorage.setItem('toolate_compare', JSON.stringify(updated));
    setListings(listings.filter((l) => l.id !== id));
    window.dispatchEvent(new CustomEvent('compare-updated'));

    if (listings.length <= 2) {
      // Update URL
      const remaining = listings.filter((l) => l.id !== id);
      if (remaining.length >= 2) {
        window.history.replaceState(null, '', `/compare?ids=${remaining.map((l) => l.id).join(',')}`);
      }
    }
  };

  // Collect all unique facility keys across listings
  const allFacilityKeys = Array.from(
    new Set(listings.flatMap((l) => Object.keys(l.facilities)))
  ).filter((key) => key !== 'custom' && key !== 'foodType');

  // Find the lowest price for highlighting
  const prices = listings.map((l) => l.price);
  const lowestPrice = Math.min(...prices);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        <p className="text-slate-400 mt-4 font-medium">Loading comparison...</p>
      </div>
    );
  }

  if (listings.length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-6">
        <Building className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-700">Not enough listings to compare</h2>
        <p className="text-slate-400">Go back to listings and select 2–3 listings using the compare button.</p>
        <Link
          href="/listings"
          className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const formatValue = (key: string, value: any): string => {
    if (typeof value === 'boolean') return value ? '✅' : '❌';
    if (key === 'furnishedStatus') {
      if (value === 'FURNISHED') return 'Fully Furnished';
      if (value === 'SEMI_FURNISHED') return 'Semi-Furnished';
      return 'Unfurnished';
    }
    if (key === 'parking') {
      if (value === 'BIKE') return 'Bike Only';
      if (value === 'CAR') return 'Car Only';
      if (value === 'BOTH') return 'Car & Bike';
      return 'None';
    }
    if (key === 'electricityCharges') {
      if (value === 'INCLUDED') return 'Included';
      if (value === 'SPLIT_EQUALLY') return 'Split';
      return 'Separate';
    }
    return String(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Side-by-Side Comparison
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Comparing {listings.length} listings — see all differences at a glance
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Image Header */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-4 bg-slate-50 font-bold text-slate-400 text-xs uppercase tracking-wider w-36">
                  Property
                </th>
                {listings.map((listing) => (
                  <th key={listing.id} className="px-4 py-4 text-center min-w-[200px]">
                    <div className="space-y-3">
                      <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Building className="w-8 h-8" />
                          </div>
                        )}
                        <button
                          onClick={() => handleRemove(listing.id)}
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="block font-bold text-slate-800 text-sm hover:text-indigo-600 transition line-clamp-2"
                      >
                        {listing.title}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {/* Category */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Category</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center">
                    <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold uppercase">
                      {l.category}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Rent / Month</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center">
                    <div className={`flex items-center justify-center font-extrabold text-base ${
                      l.price === lowestPrice ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                      <span>{l.price.toLocaleString('en-IN')}</span>
                    </div>
                    {l.price === lowestPrice && listings.length > 1 && (
                      <span className="text-[9px] text-emerald-600 font-bold uppercase">Best Price</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Location */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Location</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{l.area}{l.city ? `, ${l.city}` : ''}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Food Type */}
              {listings.some((l) => l.foodType) && (
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Food Type</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-4 py-3 text-center text-xs font-semibold">
                      {l.foodType === 'VEG_ONLY' ? '🌿 Veg Only' :
                       l.foodType === 'JAIN' ? '🙏 Jain' :
                       l.foodType === 'NON_VEG' ? '🍗 Non-Veg' :
                       l.foodType === 'NO_MEALS' ? '🚫 No Meals' :
                       '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* Photos Count */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Photos</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                    {l.images?.length || 0} photos
                  </td>
                ))}
              </tr>

              {/* Date Posted */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Posted</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Featured */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Featured</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center">
                    {l.featured ? (
                      <span className="text-amber-500 text-xs font-bold">⭐ Yes</span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Amenities Section Header */}
              {allFacilityKeys.length > 0 && (
                <tr>
                  <td
                    colSpan={listings.length + 1}
                    className="px-5 py-3 bg-indigo-50/50 font-bold text-indigo-700 text-xs uppercase tracking-wider border-y border-indigo-100"
                  >
                    Amenities & Facilities
                  </td>
                </tr>
              )}

              {/* Amenity rows */}
              {allFacilityKeys.map((key) => (
                <tr key={key} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">
                    {FACILITY_LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                  </td>
                  {listings.map((l) => {
                    const value = l.facilities[key];
                    const display = value !== undefined ? formatValue(key, value) : '—';
                    const isMissing = value === undefined || value === false || value === 'NONE';

                    return (
                      <td key={l.id} className="px-4 py-3 text-center">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-300 mx-auto" />
                          )
                        ) : (
                          <span className={`text-xs font-semibold ${isMissing ? 'text-slate-300' : 'text-slate-700'}`}>
                            {display}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Contact Section Header */}
              <tr>
                <td
                  colSpan={listings.length + 1}
                  className="px-5 py-3 bg-emerald-50/50 font-bold text-emerald-700 text-xs uppercase tracking-wider border-y border-emerald-100"
                >
                  Contact Landlord
                </td>
              </tr>

              {/* Contact Actions */}
              <tr>
                <td className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase bg-slate-50/50">Actions</td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:+91${l.contactNumber}`}
                        className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/91${l.whatsappNumber}?text=Hi, I found your listing "${l.title}" on Toolate. Is it still available?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
