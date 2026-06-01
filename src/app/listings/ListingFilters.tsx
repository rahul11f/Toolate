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
  const [foodType, setFoodType] = useState(searchParams.get('foodType') || '');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Commute Filter States
  const [commuteAddress, setCommuteAddress] = useState(searchParams.get('commuteAddress') || '');
  const [commuteLat, setCommuteLat] = useState(searchParams.get('commuteLat') || '');
  const [commuteLng, setCommuteLng] = useState(searchParams.get('commuteLng') || '');
  const [commuteMaxTime, setCommuteMaxTime] = useState(searchParams.get('commuteMaxTime') || '30');
  const [commuteMode, setCommuteMode] = useState(searchParams.get('commuteMode') || 'driving');

  const [nearMetro, setNearMetro] = useState(searchParams.get('nearMetro') === 'true');

  const [commuteQuery, setCommuteQuery] = useState('');
  const [commuteResults, setCommuteResults] = useState<any[]>([]);
  const [commuteSearching, setCommuteSearching] = useState(false);
  const [showCommuteDropdown, setShowCommuteDropdown] = useState(false);

  // Debounced search logic for commute address API
  useEffect(() => {
    if (!commuteQuery || commuteQuery.length < 3) {
      setCommuteResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setCommuteSearching(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(commuteQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setCommuteResults(data);
          setShowCommuteDropdown(true);
        }
      } catch (err) {
        console.error('Error fetching commute autocomplete options:', err);
      } finally {
        setCommuteSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [commuteQuery]);

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
    setFoodType(searchParams.get('foodType') || '');
    setCommuteAddress(searchParams.get('commuteAddress') || '');
    setCommuteLat(searchParams.get('commuteLat') || '');
    setCommuteLng(searchParams.get('commuteLng') || '');
    setCommuteMaxTime(searchParams.get('commuteMaxTime') || '30');
    setCommuteMode(searchParams.get('commuteMode') || 'driving');
    setNearMetro(searchParams.get('nearMetro') === 'true');
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

    if (category === 'ROOMMATE' || category === 'SHARE_STAY' || category === 'HOTEL') {
      if (roommateType && category === 'ROOMMATE') params.set('roommateType', roommateType);
      if (roommateGender) params.set('roommateGender', roommateGender);
    }

    if ((category === 'PG' || category === 'HOSTEL' || category === 'DORMITORY') && foodType) {
      params.set('foodType', foodType);
    }

    if (commuteLat && commuteLng) {
      params.set('commuteLat', commuteLat);
      params.set('commuteLng', commuteLng);
      params.set('commuteAddress', commuteAddress);
      params.set('commuteMaxTime', commuteMaxTime);
      params.set('commuteMode', commuteMode);
    }

    if (nearMetro) {
      params.set('nearMetro', 'true');
    }

    params.set('page', '1');

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
    setFoodType('');
    setSortBy('createdAt');
    setCommuteAddress('');
    setCommuteLat('');
    setCommuteLng('');
    setCommuteMaxTime('30');
    setCommuteMode('driving');
    setNearMetro(false);
    router.push('/listings');
  };

  return (
    <form onSubmit={handleApplyFilters} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-150">
        <h3 className="font-bold text-slate-800 text-lg">Filter Searches</h3>
        <button
          type="button"
          onClick={handleResetFilters}
          className="flex items-center text-xs text-slate-400 hover:text-indigo-600 transition font-medium cursor-pointer"
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
        className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-3 rounded-xl transition shadow-xs text-xs cursor-pointer select-none disabled:bg-slate-100 disabled:text-slate-400"
      >
        {gpsLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Locating your device...</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-indigo-600" />
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

      {/* Commute Time Filter Section */}
      <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-xl space-y-4 relative">
        <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>📍 Filter by Commute</span>
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Office/Landmark Address</label>
          <div className="relative">
            <input
              type="text"
              value={commuteAddress || commuteQuery}
              onChange={(e) => {
                setCommuteAddress('');
                setCommuteQuery(e.target.value);
                setShowCommuteDropdown(true);
              }}
              placeholder="Search office or college..."
              className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-lg outline-hidden transition font-medium"
            />
            {commuteSearching && (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 top-3" />
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showCommuteDropdown && commuteResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
              {commuteResults.map((opt) => (
                <button
                  key={opt.place_id}
                  type="button"
                  onClick={() => {
                    setCommuteAddress(opt.display_name);
                    setCommuteLat(opt.lat);
                    setCommuteLng(opt.lon);
                    setCommuteQuery('');
                    setCommuteResults([]);
                    setShowCommuteDropdown(false);
                    toast.success('Commute destination set!');
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition line-clamp-2 text-slate-650 font-medium"
                >
                  {opt.display_name}
                </button>
              ))}
            </div>
          )}

          {commuteAddress && (
            <p className="text-[9px] text-emerald-600 font-bold uppercase flex items-center gap-1 mt-1">
              <span>✅ Destination Marked</span>
            </p>
          )}
        </div>

        {commuteLat && commuteLng && (
          <>
            {/* Mode selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Commute Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'driving', label: '🚗 Car' },
                  { value: 'bike', label: '🏍️ Bike' },
                  { value: 'walking', label: '🚶 Walk' },
                ].map((modeOpt) => (
                  <button
                    key={modeOpt.value}
                    type="button"
                    onClick={() => setCommuteMode(modeOpt.value)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                      commuteMode === modeOpt.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {modeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <span>Max Commute Time</span>
                <span className="text-indigo-700 font-extrabold font-mono">{commuteMaxTime} Mins</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={commuteMaxTime}
                onChange={(e) => setCommuteMaxTime(e.target.value)}
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </>
        )}
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Category</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            // Reset roommate specific filters if category switches off roommate/hotel/share_stay
            if (e.target.value !== 'ROOMMATE' && e.target.value !== 'HOTEL' && e.target.value !== 'SHARE_STAY') {
              setRoommateType('');
              setRoommateGender('');
            } else if (e.target.value !== 'ROOMMATE') {
              setRoommateType('');
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
      {(category === 'ROOMMATE' || category === 'HOTEL') && (
        <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{category === 'HOTEL' ? 'Co-stay Criteria' : 'Roommate Criteria'}</span>
          </div>

          {category === 'ROOMMATE' && (
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
          )}

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

      {/* Share & Stay Filters (Conditional) */}
      {category === 'SHARE_STAY' && (
        <div className="p-4 bg-fuchsia-50/40 border border-fuchsia-100 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 text-fuchsia-700 text-xs font-bold uppercase tracking-wider">
            <span>🤝</span>
            <span>Share Type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All', emoji: '' },
              { value: 'ROOM', label: 'Room/Flat', emoji: '🏠' },
              { value: 'HOTEL', label: 'Hotel', emoji: '🏨' },
              { value: 'PG_BED', label: 'PG Bed', emoji: '🛏️' },
              { value: 'TRAVEL', label: 'Travel', emoji: '✈️' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (opt.value) {
                    params.set('shareType', opt.value);
                  } else {
                    params.delete('shareType');
                  }
                  params.set('page', '1');
                  router.push(`/listings?${params.toString()}`);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none border ${
                  searchParams.get('shareType') === opt.value || (!searchParams.get('shareType') && opt.value === '')
                    ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-fuchsia-300'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>

          {/* Gender Preference for Share */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender Preference</label>
            <select
              value={roommateGender}
              onChange={(e) => setRoommateGender(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-lg outline-hidden transition font-medium"
            >
              <option value="">Any Preference</option>
              <option value="ANY">Open to All</option>
              <option value="MALE">Male Only</option>
              <option value="FEMALE">Female Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Food Type Filter - PG/Hostel/Dormitory Only */}
      {(category === 'PG' || category === 'HOSTEL' || category === 'DORMITORY') && (
        <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>🍽️</span>
            <span>Food Preference</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All', emoji: '' },
              { value: 'VEG_ONLY', label: 'Veg Only', emoji: '🌿' },
              { value: 'NON_VEG', label: 'Non-Veg', emoji: '🍗' },
              { value: 'JAIN', label: 'Jain', emoji: '🙏' },
              { value: 'NO_MEALS', label: 'No Meals', emoji: '🚫' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFoodType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none border ${
                  foodType === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* State Filter */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">State</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          list="states-datalist"
          placeholder="Type or select State..."
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
        />
        <datalist id="states-datalist">
          {statesList.map((st) => (
            <option key={st} value={st} />
          ))}
        </datalist>
      </div>

      {/* City Filter */}
      <div className="space-y-1.5">
        <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          list="cities-datalist"
          placeholder="Type or select City..."
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
        />
        <datalist id="cities-datalist">
          {citiesList.map((ct) => (
            <option key={ct} value={ct} />
          ))}
        </datalist>
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

      {/* Near Metro Station Toggle */}
      <div className="flex items-center gap-2 pt-2 pb-1">
        <input
          type="checkbox"
          id="nearMetro"
          checked={nearMetro}
          onChange={(e) => setNearMetro(e.target.checked)}
          className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="nearMetro" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
          🚇 Near Metro Station (within 1.5km)
        </label>
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
