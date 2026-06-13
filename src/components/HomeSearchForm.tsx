'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingCategory } from '@/lib/types';
import { Search, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomeSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    params.set('page', '1');
    router.push(`/listings?${params.toString()}`);
  };

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams();
        params.set('lat', latitude.toString());
        params.set('lng', longitude.toString());
        params.set('radius', '10'); // Default 10km radius
        params.set('page', '1');
        router.push(`/listings?${params.toString()}`);
        setLocating(false);
        toast.success('Found nearby properties!');
      },
      (error) => {
        console.error(error);
        toast.error('Failed to get your location. Please check browser permissions.');
        setLocating(false);
      }
    );
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white p-3 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2.5 text-slate-800"
    >
      {/* Query */}
      <div className="flex-1 flex flex-col items-start px-3 py-1">
        <label htmlFor="search-query" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Search</label>
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search description, keywords..."
          className="w-full bg-transparent border-0 focus:outline-hidden focus:ring-0 text-sm py-1 placeholder-slate-400 text-slate-700 font-medium border-none outline-none focus:border-none focus:outline-none"
        />
      </div>

      {/* Category */}
      <div className="md:border-l border-slate-100 flex-1 flex flex-col items-start px-3 py-1">
        <label htmlFor="search-category" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</label>
        <select
          id="search-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-hidden focus:ring-0 text-sm py-1 text-slate-700 appearance-none font-medium cursor-pointer outline-hidden"
        >
          <option value="">All Categories</option>
          {Object.values(ListingCategory).map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'ROOMMATE' ? 'Roommates / Roomy' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Location / City with Near Me Button */}
      <div className="md:border-l border-slate-100 flex-1 flex flex-col items-start px-3 py-1 relative">
        <label htmlFor="search-city" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">City / Location</label>
        <div className="flex items-center w-full">
          <input
            id="search-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Bangalore, Noida"
            className="w-full bg-transparent border-none focus:outline-hidden focus:ring-0 text-sm py-1 placeholder-slate-400 text-slate-700 font-medium outline-hidden"
          />
          <button
            type="button"
            onClick={handleNearbySearch}
            disabled={locating}
            title="Search Nearby (GPS)"
            aria-label="Find properties near my current location"
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition shrink-0 cursor-pointer disabled:text-slate-400"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition duration-200 shadow-md hover:shadow-lg select-none cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}
