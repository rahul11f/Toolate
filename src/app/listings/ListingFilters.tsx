'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, MapPin, IndianRupee, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { ListingCategory } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local input state initialized from URL params
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [roommateType, setRoommateType] = useState(searchParams.get('roommateType') || '');
  const [roommateGender, setRoommateGender] = useState(searchParams.get('roommateGender') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams(searchParams.toString());
        params.set('lat', latitude.toString());
        params.set('lng', longitude.toString());
        params.set('radius', '10'); // Default 10km radius
        params.set('page', '1');
        router.push(`/listings?${params.toString()}`);
        setGpsLoading(false);
        toast.success('Nearby listings loaded successfully!');
      },
      (error) => {
        console.error(error);
        toast.error('Failed to get your location. Please check browser permissions.');
        setGpsLoading(false);
      }
    );
  };

  // Dynamically fetched states and cities lists
  const [statesList, setStatesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setStatesList(data.states || []);
          setCitiesList(data.cities || []);
        }
      } catch (err) {
        console.error('Error fetching locations for filters:', err);
      }
    }
    loadLocations();
  }, []);

  // Synchronize local state with URL parameter changes (e.g. back/forward nav)
  useEffect(() => {
    setQuery(searchParams.get('query') || '');
    setArea(searchParams.get('area') || '');
    setCategory(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setState(searchParams.get('state') || '');
    setCity(searchParams.get('city') || '');
    setRoommateType(searchParams.get('roommateType') || '');
    setRoommateGender(searchParams.get('roommateGender') || '');
    setSortBy(searchParams.get('sortBy') || 'createdAt');
  }, [searchParams]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (query) params.set('query', query);
    if (area) params.set('area', area);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (sortBy) params.set('sortBy', sortBy);

    if (category === 'ROOMMATE') {
      if (roommateType) params.set('roommateType', roommateType);
      if (roommateGender) params.set('roommateGender', roommateGender);
    }
    params.set('page', '1'); // Reset to page 1 on filter application

    router.push(`/listings?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setQuery('');
    setArea('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setState('');
    setCity('');
    setRoommateType('');
    setRoommateGender('');
    setSortBy('createdAt');
    router.push('/listings');
  };

  return (
    <form onSubmit={handleApplyFilters} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-150">
        <h3 className="font-bold text-slate-800 text-lg">Filter Searches</h3>
        <button
          type="button"
          onClick={handleResetFilters}
          className="flex items-center text-xs text-slate-400 hover:text-indigo-655 transition font-medium cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset All
        </button>
      </div>

      {/* GPS Nearby Search Button */}
      <button
        type="button"
        onClick={handleNearbySearch}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold py-3 rounded-xl transition shadow-xs text-xs cursor-pointer select-none disabled:bg-slate-100 disabled:text-slate-400"
      >
        {gpsLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Locating your device...</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-indigo-650" />
            <span>Find Rooms Nearby (My GPS)</span>
          </>
        )}
      </button>

      {/* Query Search */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Search Keyword</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Category</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            // Reset roommate specific filters if category switches off roommate
            if (e.target.value !== 'ROOMMATE') {
              setRoommateType('');
              setRoommateGender('');
            }
          }}
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition"
        >
          <option value="">All Categories</option>
          {Object.values(ListingCategory).map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'ROOMMATE' ? 'Roommates / Roomy' : cat.charAt(0) + cat.slice(1).toLowerCase() + 's'}
            </option>
          ))}
        </select>
      </div>

      {/* Roommate-specific Filters (Conditional) */}
      {category === 'ROOMMATE' && (
        <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 text-indigo-755 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Roommate Criteria</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type</label>
            <select
              value={roommateType}
              onChange={(e) => setRoommateType(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden transition font-medium"
            >
              <option value="">All Roommate Types</option>
              <option value="HAVE_ROOM">Has room (roommate wanted)</option>
              <option value="NEED_ROOM">Needs room (looking for flat)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
            <select
              value={roommateGender}
              onChange={(e) => setRoommateGender(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden transition font-medium"
            >
              <option value="">Any Preferred Gender</option>
              <option value="ANY">Any / Any Gender</option>
              <option value="MALE">Male Preferred</option>
              <option value="FEMALE">Female Preferred</option>
            </select>
          </div>
        </div>
      )}

      {/* State Filter */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">State</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition"
        >
          <option value="">All States</option>
          {statesList.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition"
        >
          <option value="">All Cities</option>
          {citiesList.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>

      {/* Location Area Search */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Area / Suburb</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Indiranagar"
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
          {category === 'ROOMMATE' ? 'Rent Share (INR)' : 'Price Range (INR / Mo)'}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-8 pr-2 py-2.5 rounded-xl outline-hidden transition"
            />
          </div>
          <div className="relative flex-1">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-8 pr-2 py-2.5 rounded-xl outline-hidden transition"
            />
          </div>
        </div>
      </div>

      {/* Sorting */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition"
        >
          <option value="createdAt">Newest Additions</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="createdAt_asc">Oldest Additions</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg select-none cursor-pointer"
      >
        Apply Search Filters
      </button>
    </form>
  );
}
