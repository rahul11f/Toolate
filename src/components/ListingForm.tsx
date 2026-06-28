'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ListingCategory } from '@/lib/types';
import { Building, MapPin, IndianRupee, Clock, ClipboardList, Phone, Image as ImageIcon, Trash2, Search, Loader2, Upload } from 'lucide-react';

// Dynamic import of LeafletMap to avoid window issues in SSR
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-100 flex items-center justify-center text-slate-400 rounded-lg animate-pulse">
      Loading map module...
    </div>
  ),
});

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.nativeEnum(ListingCategory),
  price: z.coerce.number().nonnegative('Price must be 0 or positive.'),
  openingHours: z.string().min(1, 'Opening hours are required.'),
  closingHours: z.string().min(1, 'Closing hours are required.'),
  landlordTerms: z.string().min(5, 'Landlord terms must be at least 5 characters.'),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting with 6-9).'),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number (must be 10 digits starting with 6-9).'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  lat: z.number(),
  lng: z.number(),
  area: z.string().min(2, 'Area is required.'),
  state: z.string().optional(),
  city: z.string().optional(),
  roommateType: z.string().optional().nullable(),
  roommateGender: z.string().optional().nullable(),
  images: z.array(z.string().url()).min(1, 'At least one image is required.').max(5, 'Maximum 5 images allowed.'),
  priceType: z.string().optional().nullable(),
  requireVerification: z.boolean().optional(),
  isSharedHotelRoom: z.boolean().optional(),
  hotelName: z.string().optional().nullable(),
  hotelBookingRef: z.string().optional().nullable(),
  checkInDate: z.string().optional().nullable(),
  checkOutDate: z.string().optional().nullable(),
  hotelBookingProofUrl: z.string().optional().nullable(),
});

type ListingFormFields = z.infer<typeof listingSchema>;

interface ListingFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export default function ListingForm({ initialData, isEditMode = false }: ListingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [facilities, setFacilities] = useState<Record<string, any>>({});
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  const addCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    const currentCustom = facilities.custom || [];
    if (currentCustom.includes(customAmenityInput.trim())) {
      toast.error('This amenity is already added.');
      return;
    }
    setFacilities((prev) => ({
      ...prev,
      custom: [...currentCustom, customAmenityInput.trim()],
    }));
    setCustomAmenityInput('');
  };

  const removeCustomAmenity = (index: number) => {
    const currentCustom = facilities.custom || [];
    const nextCustom = currentCustom.filter((_: any, i: number) => i !== index);
    setFacilities((prev) => ({
      ...prev,
      custom: nextCustom,
    }));
  };

  // Load existing facilities in Edit mode
  useEffect(() => {
    if (initialData && initialData.facilities) {
      try {
        setFacilities(typeof initialData.facilities === 'string' ? JSON.parse(initialData.facilities) : initialData.facilities);
      } catch (err) {
        console.error('Failed to parse initial facilities:', err);
      }
    }
  }, [initialData]);

  const handleFacilityChange = (key: string, value: any) => {
    setFacilities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Address search autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Setup default coordinates (e.g. Bangalore, India center)
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ListingFormFields>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          category: initialData.category,
          price: initialData.price,
          openingHours: initialData.openingHours,
          closingHours: initialData.closingHours,
          landlordTerms: initialData.landlordTerms,
          contactNumber: initialData.contactNumber,
          whatsappNumber: initialData.whatsappNumber,
          address: initialData.address,
          lat: initialData.lat,
          lng: initialData.lng,
          area: initialData.area,
          state: initialData.state || '',
          city: initialData.city || '',
          roommateType: initialData.roommateType || '',
          roommateGender: initialData.roommateGender || '',
          images: typeof initialData.images === 'string'
            ? JSON.parse(initialData.images)
            : (Array.isArray(initialData.images) ? initialData.images : []),
          priceType: initialData.priceType || 'PAID',
          requireVerification: initialData.requireVerification || false,
          isSharedHotelRoom: initialData.isSharedHotelRoom || false,
          hotelName: initialData.hotelName || '',
          hotelBookingRef: initialData.hotelBookingRef || '',
          checkInDate: initialData.checkInDate ? new Date(initialData.checkInDate).toISOString().split('T')[0] : '',
          checkOutDate: initialData.checkOutDate ? new Date(initialData.checkOutDate).toISOString().split('T')[0] : '',
          hotelBookingProofUrl: initialData.hotelBookingProofUrl || '',
        }
      : {
          title: '',
          description: '',
          category: ListingCategory.HOUSE,
          price: 0,
          openingHours: '',
          closingHours: '',
          landlordTerms: '',
          contactNumber: '',
          whatsappNumber: '',
          address: '',
          lat: defaultLat,
          lng: defaultLng,
          area: '',
          state: '',
          city: '',
          roommateType: 'HAVE_ROOM',
          roommateGender: 'ANY',
          images: [],
          priceType: 'PAID',
          requireVerification: false,
          isSharedHotelRoom: false,
          hotelName: '',
          hotelBookingRef: '',
          checkInDate: '',
          checkOutDate: '',
          hotelBookingProofUrl: '',
        },
  });

  const watchImages = watch('images') || [];
  const watchLat = watch('lat') || defaultLat;
  const watchLng = watch('lng') || defaultLng;
  const watchAddress = watch('address') || '';
  const watchCategory = watch('category') || ListingCategory.HOUSE;
  const watchPriceType = watch('priceType') || 'PAID';

  // Auto-enable Hotel Sharing checkbox when Category is HOTEL
  useEffect(() => {
    if (watchCategory === ListingCategory.HOTEL && !isEditMode) {
      setValue('isSharedHotelRoom', true);
    }
  }, [watchCategory, setValue, isEditMode]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic for Nominatim address API
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Error fetching autocomplete options:', err);
      } finally {
        setSearching(false);
      }
    }, 600); // 600ms debounce delay to respect OpenStreetMap rate guidelines

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Extract Area/Suburb from geocode result addresses
  const extractArea = (addr: any) => {
    if (!addr) return 'Unknown Area';
    return (
      addr.suburb ||
      addr.neighbourhood ||
      addr.city_district ||
      addr.village ||
      addr.town ||
      addr.city ||
      addr.county ||
      'Unknown Area'
    );
  };

  const extractState = (addr: any) => {
    if (!addr) return '';
    return addr.state || '';
  };

  const extractCity = (addr: any) => {
    if (!addr) return '';
    return addr.city || addr.town || addr.village || addr.county || '';
  };

  // 1. Handle select suggestion option
  const handleSelectAddress = (option: any) => {
    const latFloat = parseFloat(option.lat);
    const lngFloat = parseFloat(option.lon);
    const areaName = extractArea(option.address);
    const stateName = extractState(option.address);
    const cityName = extractCity(option.address);

    setValue('address', option.display_name);
    setValue('lat', latFloat);
    setValue('lng', lngFloat);
    setValue('area', areaName);
    setValue('state', stateName);
    setValue('city', cityName);

    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    toast.success('Location marked on map!');
  };

  // 2. Handle map coordinates changes (draggable marker)
  const handleMapChange = async (lat: number, lng: number) => {
    setValue('lat', lat);
    setValue('lng', lng);

    // Call reverse geocoding proxy to update address values
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setValue('address', data.display_name);
          setValue('area', extractArea(data.address));
          setValue('state', extractState(data.address));
          setValue('city', extractCity(data.address));
          toast.success('Address auto-updated from map pin!');
        }
      }
    } catch (err) {
      console.error('Failed reverse geocoding coordinates:', err);
    }
  };

  // 2b. Auto-detect user GPS location and reverse geocode it
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue('lat', latitude);
        setValue('lng', longitude);
        toast.loading('Fetching address from your location...', { id: 'geo' });
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              setValue('address', data.display_name);
              setValue('area', extractArea(data.address));
              setValue('state', extractState(data.address));
              setValue('city', extractCity(data.address));
              toast.success('Location detected and address filled!', { id: 'geo' });
            } else {
              toast.success('Location detected! Drag marker to refine.', { id: 'geo' });
            }
          } else {
            toast.error('Could not fetch address for detected location.', { id: 'geo' });
          }
        } catch {
          toast.error('Reverse geocoding failed.', { id: 'geo' });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location access denied. Please allow location in browser settings.');
        } else {
          toast.error('Could not determine your location. Try searching manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 3. File upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit maximum files to 5
    if (watchImages.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images per listing.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload images.');
      } else {
        setValue('images', [...watchImages, ...data.urls]);
        toast.success('Images uploaded successfully!');
      }
    } catch (err) {
      toast.error('Failed to complete upload.');
    } finally {
      setUploading(false);
    }
  };

  // 4. Delete uploaded image
  const handleDeleteImage = (indexToDelete: number) => {
    setValue(
      'images',
      watchImages.filter((_, idx) => idx !== indexToDelete)
    );
  };

  const [generatingDescription, setGeneratingDescription] = useState(false);

  const handleGenerateDescription = async () => {
    const title = getValues('title');
    const category = getValues('category');
    const area = getValues('area');
    if (!title || !area) {
      toast.error('Please enter a listing title and area first so AI has some context!');
      return;
    }

    setGeneratingDescription(true);
    setValue('description', '');

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          price: getValues('price'),
          city: getValues('city') || '',
          area,
          amenities: Object.keys(facilities).filter(key => facilities[key] === true || typeof facilities[key] === 'string'),
          roommateGender: getValues('roommateGender') || '',
          roommateType: getValues('roommateType') || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      if (!response.body) {
        throw new Error('No response body stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;
          setValue('description', accumulatedText);
        }
      }
      toast.success('Description generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate description with AI.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // 5. Submit Form data
  const onSubmit = async (data: ListingFormFields) => {
    setSubmitting(true);
    const endpoint = isEditMode ? `/api/listings/${initialData.id}` : '/api/listings';
    const method = isEditMode ? 'PUT' : 'POST';

    // If it's a shared hotel room, force requireVerification and validate fields (if already booked)
    if (data.category === ListingCategory.HOTEL && data.isSharedHotelRoom) {
      const isAlreadyBooked = facilities.isAlreadyBooked !== false;
      if (isAlreadyBooked) {
        data.requireVerification = true;
        if (!data.hotelName?.trim() || !data.hotelBookingRef?.trim() || !data.checkInDate || !data.checkOutDate || !data.hotelBookingProofUrl) {
          toast.error('All hotel room sharing details and booking proof are required.');
          setSubmitting(false);
          return;
        }
      } else {
        if (!data.checkInDate || !data.checkOutDate) {
          toast.error('Please specify check-in and check-out dates for your travel.');
          setSubmitting(false);
          return;
        }
      }
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          facilities: JSON.stringify(facilities),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to submit listing.');
      } else {
        toast.success(
          isEditMode
            ? 'Listing updated successfully!'
            : 'Listing submitted successfully! Pending admin approval.'
        );
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
          Property Information
        </h3>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Listing Title</label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Spacious 2 BHK Flat with Balcony in Indiranagar"
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition"
          />
          {errors.title && (
            <p className="text-xs text-rose-500 font-semibold">{errors.title.message}</p>
          )}
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Category</label>
            <select
              {...register('category')}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-semibold"
            >
              {Object.values(ListingCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ROOMMATE'
                    ? 'Room Sharing / Roommate Partner'
                    : cat === 'HOTEL'
                    ? 'Hotel Room Sharing / Travel Partner'
                    : cat === 'HOURLY_ROOM'
                    ? 'Hourly Room'
                    : cat === 'COWORKING'
                    ? 'Coworking'
                    : cat === 'HOUSE_GUEST'
                    ? 'House Guest / Homestay'
                    : cat === 'SHARE_STAY'
                    ? '🤝 Share & Stay (Room/Hotel/Travel)'
                    : cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              {watchCategory === 'ROOMMATE'
                ? 'Expected Rent Share (INR)'
                : watchCategory === 'HOURLY_ROOM'
                ? 'Rent per Hour (INR)'
                : watchCategory === 'DORMITORY'
                ? 'Rent per Bed/Day (INR)'
                : watchCategory === 'HOUSE_GUEST'
                ? 'Stay Cost per Day (INR)'
                : watchCategory === 'SHARE_STAY'
                ? 'Budget Per Person (INR)'
                : 'Monthly Rent (INR)'}
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="number"
                {...register('price')}
                disabled={watchCategory === 'HOUSE_GUEST' && watchPriceType !== 'PAID'}
                placeholder={
                  watchCategory === 'ROOMMATE'
                    ? "Expected rent share per person"
                    : watchCategory === 'HOURLY_ROOM'
                    ? "Rent per hour"
                    : watchCategory === 'DORMITORY'
                    ? "Rent per bed/day"
                    : watchCategory === 'HOUSE_GUEST' && watchPriceType !== 'PAID'
                    ? "Free/Exchange Stay (₹0)"
                    : "Rent price per month"
                }
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition disabled:opacity-60"
              />
            </div>
            {errors.price && (
              <p className="text-xs text-rose-500 font-semibold">{errors.price.message}</p>
            )}
          </div>
        </div>

        {/* Gender Preference / Designation (for stay/residential categories) */}
        {['HOUSE', 'FLAT', 'PG', 'VILLA', 'HOSTEL', 'ROOMMATE', 'DORMITORY', 'HOTEL', 'DHARAMSHALA', 'HOURLY_ROOM', 'HOUSE_GUEST', 'SHARE_STAY'].includes(watchCategory) && (
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Gender Preference / Designation</label>
            <select
              {...register('roommateGender')}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-semibold"
            >
              <option value="ANY">Any / Co-ed / No Preference</option>
              <option value="MALE">Male / Boys Preferred</option>
              <option value="FEMALE">Female / Girls Preferred</option>
            </select>
          </div>
        )}

        {/* House Guest Custom Stay Configuration */}
        {watchCategory === ListingCategory.HOUSE_GUEST && (
          <div className="space-y-4 p-5 bg-indigo-50/50 border border-indigo-100/85 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Stay Pricing Model</label>
                <select
                  {...register('priceType')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'FREE' || val === 'OTHER') {
                      setValue('price', 0);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-700 font-medium"
                >
                  <option value="PAID">Paid Stay (Daily charge)</option>
                  <option value="FREE">🎁 100% Free Stay (Couchsurfing / Help welcome)</option>
                  <option value="OTHER">🤝 Exchange Stay (Housework, language swap, etc.)</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center">
                <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none mt-4">
                  <input
                    type="checkbox"
                    {...register('requireVerification')}
                    className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span>🔒 Require ID Verification to apply/view details</span>
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 pl-6">
                  Only travelers with a verified identity document badge will be allowed to view details.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Roommate Options (Conditional) */}
        {watchCategory === 'ROOMMATE' && (
          <div className="space-y-4 p-5 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">What is your situation?</label>
                <select
                  {...register('roommateType')}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-700 font-medium"
                >
                  <option value="HAVE_ROOM">I have a room/flat, looking for a roommate</option>
                  <option value="NEED_ROOM">I need a room/flat & roommate(s)</option>
                </select>
              </div>
            </div>

            {/* Optional Stay Partner Duration dates */}
            <div className="border-t border-indigo-100/50 pt-4 space-y-4">
              <div>
                <h5 className="text-xs uppercase font-extrabold text-slate-650 tracking-wider">Stay partner duration (Optional)</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Specify when you want to start and conclude your shared coordinate stay. If check-out date is specified, this listing will automatically expire on that date.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stay Start Date</label>
                  <input
                    type="date"
                    {...register('checkInDate')}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stay End / Expiry Date</label>
                  <input
                    type="date"
                    {...register('checkOutDate')}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share & Stay Quick-Fill Options (Conditional) */}
        {watchCategory === ListingCategory.SHARE_STAY && (
          <div className="space-y-4 p-5 bg-fuchsia-50/50 border border-fuchsia-100/80 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤝</span>
              <h4 className="font-extrabold text-slate-800 text-sm">Share & Stay Details</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-2">
              List what you want to share — a room, hotel, PG bed, or find a travel companion. Interested people can quickly join your listing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Share Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">What are you sharing?</label>
                <select
                  value={facilities.shareType || 'ROOM'}
                  onChange={(e) => handleFacilityChange('shareType', e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-fuchsia-500 text-xs px-3 py-2.5 rounded-xl outline-hidden transition text-slate-700 font-semibold"
                >
                  <option value="ROOM">🏠 Room / Flat</option>
                  <option value="HOTEL">🏨 Hotel Room</option>
                  <option value="PG_BED">🛏️ PG Bed</option>
                  <option value="TRAVEL">✈️ Travel Partner</option>
                  <option value="COWORK">💻 Co-working Space</option>
                  <option value="OTHER">📦 Other</option>
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stay Duration</label>
                <select
                  value={facilities.shareDuration || 'FLEXIBLE'}
                  onChange={(e) => handleFacilityChange('shareDuration', e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-fuchsia-500 text-xs px-3 py-2.5 rounded-xl outline-hidden transition text-slate-700 font-semibold"
                >
                  <option value="DAILY">📅 Daily</option>
                  <option value="WEEKLY">🗓️ Weekly</option>
                  <option value="MONTHLY">📆 Monthly</option>
                  <option value="FLEXIBLE">🔄 Flexible / Negotiable</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available From</label>
                <input
                  type="date"
                  {...register('checkInDate')}
                  className="w-full bg-white border border-slate-200 focus:border-fuchsia-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Until (Listing Expiry)</label>
                <input
                  type="date"
                  {...register('checkOutDate')}
                  className="w-full bg-white border border-slate-200 focus:border-fuchsia-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                />
                <p className="text-[9px] text-slate-400">Listing auto-expires on this date.</p>
              </div>
            </div>

            {/* Open to anyone */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center space-x-2.5 text-slate-700 text-xs font-semibold cursor-pointer select-none bg-white border border-slate-200 px-3 py-2.5 rounded-xl hover:border-fuchsia-300 transition">
                  <input
                    type="checkbox"
                    checked={facilities.openToAnyone || false}
                    onChange={(e) => handleFacilityChange('openToAnyone', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer"
                  />
                  <span>🌍 Open to anyone — no restrictions</span>
                </label>
              </div>
            </div>

            {/* Quick info banner */}
            <div className="bg-fuchsia-50 border border-fuchsia-100 p-3 rounded-xl text-xs text-fuchsia-800 font-semibold flex items-start gap-2">
              <span className="text-base leading-none">💡</span>
              <span>Once listed, anyone can click &quot;I&apos;m Interested — Join This Share&quot; on your listing to express interest. You&apos;ll get a notification and can coordinate directly.</span>
            </div>
          </div>
        )}

        {/* Hotel Sharing Options (Conditional) */}
        {watchCategory === ListingCategory.HOTEL && (
          <div className="space-y-4 p-5 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 text-slate-800 text-sm font-extrabold cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('isSharedHotelRoom')}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>🤝 List as Shared Hotel Room (Split Cost 50/50)</span>
              </label>
            </div>
            
            {watch('isSharedHotelRoom') && (
              <div className="space-y-4 pt-2 border-t border-indigo-100/50">
                {/* Booking Status Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hotel Booking Status</label>
                  <select
                    value={facilities.isAlreadyBooked !== false ? 'true' : 'false'}
                    onChange={(e) => {
                      const val = e.target.value === 'true';
                      handleFacilityChange('isAlreadyBooked', val);
                      if (!val) {
                        setValue('hotelName', '');
                        setValue('hotelBookingRef', '');
                        setValue('hotelBookingProofUrl', '');
                      }
                    }}
                    className="w-full bg-white border border-slate-205 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden transition text-slate-700 font-semibold"
                  >
                    <option value="true">🏨 Yes, Hotel Already Booked (requires booking proof & receipt)</option>
                    <option value="false">🔍 No, Pre-Booking Query (connect & select hotel together later)</option>
                  </select>
                </div>

                {facilities.isAlreadyBooked !== false ? (
                  <>
                    <p className="text-xs text-amber-800 font-bold bg-amber-50 border border-amber-100 p-3 rounded-xl">
                      ⚠️ Security Policy: Hotel room shares require both parties to be ID verified. Uploading a valid booking confirmation proof is mandatory to protect travellers.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hotel Name</label>
                        <input
                          type="text"
                          {...register('hotelName')}
                          placeholder="e.g. Radisson Blu MG Road"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Confirmation ID</label>
                        <input
                          type="text"
                          {...register('hotelBookingRef')}
                          placeholder="e.g. BK1234567"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-indigo-805 font-bold bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                    ✨ Pre-booking Co-Stay Query: You want to connect with a travel companion first and select/book a hotel together later. No booking details or verification receipts are required to publish this query.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Check-In Date</label>
                    <input
                      type="date"
                      {...register('checkInDate')}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Check-Out Date</label>
                    <input
                      type="date"
                      {...register('checkOutDate')}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden font-semibold"
                    />
                  </div>
                </div>

                {/* Booking Proof File Upload */}
                {facilities.isAlreadyBooked !== false && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Proof Receipt (Upload Image)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-2xs">
                      <label className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-755 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition select-none active:scale-95 shrink-0">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Select Booking Receipt Scan</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            setUploading(true);
                            const formData = new FormData();
                            formData.append('file', files[0]);
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                toast.error(data.error || 'Failed to upload booking proof.');
                              } else {
                                setValue('hotelBookingProofUrl', data.urls[0]);
                                toast.success('Booking proof uploaded successfully!');
                              }
                            } catch {
                              toast.error('Failed to complete upload.');
                            } finally {
                              setUploading(false);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <div className="text-[11px] text-slate-400 font-semibold truncate flex-grow">
                        {watch('hotelBookingProofUrl') ? (
                          <span className="text-emerald-600 font-bold">✓ Booking proof uploaded! Ready.</span>
                        ) : (
                          'No file uploaded. Upload a screenshot or receipt image.'
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {watch('price') > 0 && (
                  <p className="text-xs text-indigo-750 font-bold bg-indigo-50 border border-indigo-100/50 p-2.5 rounded-xl">
                    💰 Splitting cost: Both parties will split the total booking cost/budget of ₹{Number(watch('price')).toLocaleString('en-IN')} 50/50 (₹{(Number(watch('price')) / 2).toLocaleString('en-IN')} each).
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Description</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDescription}
              className="text-xs font-bold text-indigo-655 hover:text-indigo-700 flex items-center gap-1 cursor-pointer disabled:opacity-50 select-none bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg transition"
            >
              {generatingDescription ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>✨ Generate with AI</span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={5}
            {...register('description')}
            placeholder={
              watchCategory === 'ROOMMATE'
                ? "Describe your lifestyle, work hours, roommate expectations, shared space rules, and habits."
                : "Describe your property (amenities, rooms, utilities, transport proximity etc.)"
            }
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y"
          />
          {errors.description && (
            <p className="text-xs text-rose-500 font-semibold">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Dynamic Facilities Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-500" />
          <span>Amenities & Facilities (Category Specific)</span>
        </h3>
        
        {/* Render different options based on the active category */}
        {(watchCategory === 'HOUSE' || watchCategory === 'FLAT' || watchCategory === 'VILLA') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Furnished Status</label>
                <select
                  value={facilities.furnishedStatus || 'UNFURNISHED'}
                  onChange={(e) => handleFacilityChange('furnishedStatus', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-750 font-medium"
                >
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="SEMI_FURNISHED">Semi-Furnished</option>
                  <option value="FURNISHED">Fully Furnished</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Electricity Bill Option</label>
                <select
                  value={facilities.electricityCharges || 'SEPARATE'}
                  onChange={(e) => handleFacilityChange('electricityCharges', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="SEPARATE">Separate Bill (Metered Usage)</option>
                  <option value="INCLUDED">Included in Monthly Rent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Parking Available</label>
                <select
                  value={facilities.parking || 'NONE'}
                  onChange={(e) => handleFacilityChange('parking', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="NONE">No Parking</option>
                  <option value="BIKE">Two Wheeler Only</option>
                  <option value="CAR">Car Only</option>
                  <option value="BOTH">Both (Car & Bike)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roWater}
                  onChange={(e) => handleFacilityChange('roWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>RO Purified Drinking Water</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.powerBackup}
                  onChange={(e) => handleFacilityChange('powerBackup', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>24/7 Electricity / Power Backup</span>
              </label>
            </div>
          </div>
        )}

        {(watchCategory === 'PG' || watchCategory === 'HOSTEL') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Furnished Status</label>
                <select
                  value={facilities.furnishedStatus || 'FURNISHED'}
                  onChange={(e) => handleFacilityChange('furnishedStatus', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="FURNISHED">Fully Furnished</option>
                  <option value="SEMI_FURNISHED">Semi-Furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Food / Meals Type</label>
                <select
                  value={facilities.foodType || 'NO_MEALS'}
                  onChange={(e) => handleFacilityChange('foodType', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="NO_MEALS">No Meals Included</option>
                  <option value="VEG_ONLY">🌿 Vegetarian Only</option>
                  <option value="NON_VEG">🍗 Non-Vegetarian Available</option>
                  <option value="JAIN">🙏 Jain Food Available</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roWater}
                  onChange={(e) => handleFacilityChange('roWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>RO Purified Water</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Internet/Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.messService}
                  onChange={(e) => handleFacilityChange('messService', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Mess / Meals Service</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.laundry}
                  onChange={(e) => handleFacilityChange('laundry', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Laundry Service</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.acAvailable}
                  onChange={(e) => handleFacilityChange('acAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>AC Rooms Available</span>
              </label>
            </div>
          </div>
        )}

        {(watchCategory === 'SHOP' || watchCategory === 'OFFICE' || watchCategory === 'COWORKING' || watchCategory === 'WAREHOUSE') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Parking Slots</label>
                <select
                  value={facilities.parking || 'NONE'}
                  onChange={(e) => handleFacilityChange('parking', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="NONE">No Parking</option>
                  <option value="BIKE">Two Wheeler Only</option>
                  <option value="CAR">Car Only</option>
                  <option value="BOTH">Both (Car & Bike)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.powerBackup}
                  onChange={(e) => handleFacilityChange('powerBackup', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Power Backup</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Internet</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.security}
                  onChange={(e) => handleFacilityChange('security', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>24/7 Security & CCTV</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roWater}
                  onChange={(e) => handleFacilityChange('roWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>RO Drinking Water</span>
              </label>

              {(watchCategory === 'OFFICE' || watchCategory === 'COWORKING') && (
                <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!facilities.meetingRoom}
                    onChange={(e) => handleFacilityChange('meetingRoom', e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Meeting Room Access</span>
                </label>
              )}

              {watchCategory === 'WAREHOUSE' && (
                <>
                  <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!facilities.heavyVehicleAccess}
                      onChange={(e) => handleFacilityChange('heavyVehicleAccess', e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Heavy Vehicle Access</span>
                  </label>

                  <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!facilities.fireSafety}
                      onChange={(e) => handleFacilityChange('fireSafety', e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Fire Safety Systems</span>
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {watchCategory === 'ROOMMATE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Furnished Status</label>
                <select
                  value={facilities.furnishedStatus || 'SEMI_FURNISHED'}
                  onChange={(e) => handleFacilityChange('furnishedStatus', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="UNFURNISHED">Unfurnished</option>
                  <option value="SEMI_FURNISHED">Semi-Furnished</option>
                  <option value="FURNISHED">Fully Furnished</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Shared Utility Bills</label>
                <select
                  value={facilities.electricityCharges || 'SPLIT_EQUALLY'}
                  onChange={(e) => handleFacilityChange('electricityCharges', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="SPLIT_EQUALLY">Split Equally (Wi-Fi, Power, Maid)</option>
                  <option value="INCLUDED">Included in Cost Share</option>
                  <option value="SEPARATE">Negotiable / Separate arrangement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roWater}
                  onChange={(e) => handleFacilityChange('roWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>RO Water Available</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.cookAvailable}
                  onChange={(e) => handleFacilityChange('cookAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Maid / Cook Available</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.smokingAllowed}
                  onChange={(e) => handleFacilityChange('smokingAllowed', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Smoking Allowed</span>
              </label>
            </div>
          </div>
        )}

        {watchCategory === 'DORMITORY' && (
          <div className="space-y-4">
            {/* Gender designated at the top */}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.bunkBeds}
                  onChange={(e) => handleFacilityChange('bunkBeds', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Bunk Beds Type</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.lockers}
                  onChange={(e) => handleFacilityChange('lockers', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Personal Lockers</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.sharedBathrooms}
                  onChange={(e) => handleFacilityChange('sharedBathrooms', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Shared Bathrooms</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.laundry}
                  onChange={(e) => handleFacilityChange('laundry', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Laundry Facility</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.acAvailable}
                  onChange={(e) => handleFacilityChange('acAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Air Conditioning</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roWater}
                  onChange={(e) => handleFacilityChange('roWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>RO Purified Water</span>
              </label>
            </div>
          </div>
        )}

        {watchCategory === 'HOTEL' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.roomService}
                  onChange={(e) => handleFacilityChange('roomService', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Room Service</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Complimentary Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.acAvailable}
                  onChange={(e) => handleFacilityChange('acAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Air Conditioning (AC)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.tvAvailable}
                  onChange={(e) => handleFacilityChange('tvAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Smart TV in Room</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.attachedBathroom}
                  onChange={(e) => handleFacilityChange('attachedBathroom', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Attached Bathroom</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.breakfastIncluded}
                  onChange={(e) => handleFacilityChange('breakfastIncluded', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Complimentary Breakfast</span>
              </label>
            </div>
          </div>
        )}

        {watchCategory === 'DHARAMSHALA' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.commonKitchen}
                  onChange={(e) => handleFacilityChange('commonKitchen', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Common Kitchen Access</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.hotWater}
                  onChange={(e) => handleFacilityChange('hotWater', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Hot Water Facility</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.lockerFacility}
                  onChange={(e) => handleFacilityChange('lockerFacility', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Locker Room Facility</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.parking}
                  onChange={(e) => handleFacilityChange('parking', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Free Parking Space</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.attachedBathroom}
                  onChange={(e) => handleFacilityChange('attachedBathroom', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Attached Bathroom</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.pureVegOnly}
                  onChange={(e) => handleFacilityChange('pureVegOnly', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Strict Pure Vegetarian Rules</span>
              </label>
            </div>
          </div>
        )}

        {watchCategory === 'HOURLY_ROOM' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.flexibleCheckIn}
                  onChange={(e) => handleFacilityChange('flexibleCheckIn', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Flexible 24/7 Check-in</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.acAvailable}
                  onChange={(e) => handleFacilityChange('acAvailable', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Air Conditioning (AC)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.workspace}
                  onChange={(e) => handleFacilityChange('workspace', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Desk / Dedicated Workspace</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.attachedBathroom}
                  onChange={(e) => handleFacilityChange('attachedBathroom', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Attached Clean Bathroom</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.privacyLock}
                  onChange={(e) => handleFacilityChange('privacyLock', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Privacy Smart-card Lock</span>
              </label>
            </div>
          </div>
        )}

        {watchCategory === 'HOUSE_GUEST' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Accommodation Type</label>
                <select
                  value={facilities.accommodationType || 'ROOM_ONLY'}
                  onChange={(e) => handleFacilityChange('accommodationType', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="ROOM_ONLY">Private Room Only</option>
                  <option value="SHARED_ROOM">Shared Room / Roommate setup</option>
                  <option value="COUCH_SPACE">Couch / Shared space</option>
                  <option value="FULL_HOUSE">Entire House / Homestay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Host Status / Setup</label>
                <select
                  value={facilities.hostSetup || 'LIVES_WITH_HOST'}
                  onChange={(e) => handleFacilityChange('hostSetup', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-hidden transition text-slate-755 font-medium"
                >
                  <option value="LIVES_WITH_HOST">Host lives on-site (Homestay experience)</option>
                  <option value="INDEPENDENT">Independent access (Self check-in)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.kitchenAccess}
                  onChange={(e) => handleFacilityChange('kitchenAccess', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Kitchen Access Allowed</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.sharedMeals}
                  onChange={(e) => handleFacilityChange('sharedMeals', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Shared Meals Offered</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.petsAllowed}
                  onChange={(e) => handleFacilityChange('petsAllowed', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Pets Allowed</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.localGuiding}
                  onChange={(e) => handleFacilityChange('localGuiding', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Local Tips & Guiding</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.internet}
                  onChange={(e) => handleFacilityChange('internet', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>High-Speed Wi-Fi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!facilities.washingMachine}
                  onChange={(e) => handleFacilityChange('washingMachine', e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Washing Machine Access</span>
              </label>
            </div>
          </div>
        )}

        {/* WFH & Employee Stays Section (For House, Flat, PG, Roommate, Hotel, Dormitory) */}
        {(watchCategory === 'HOUSE' || watchCategory === 'FLAT' || watchCategory === 'PG' || watchCategory === 'ROOMMATE' || watchCategory === 'HOTEL' || watchCategory === 'DORMITORY') && (
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Work From Home (WFH) & Employee Stays Suitability</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              List special provisions for remote workers, IT professionals, and corporate guests looking for weekly/monthly stays.
            </p>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2.5 text-slate-700 text-sm font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!facilities.wfhFriendly}
                    onChange={(e) => handleFacilityChange('wfhFriendly', e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-355 text-indigo-655 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>💻 Optimized for WFH & Remote Employees</span>
                </label>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking / Rent Cycle Basis</label>
                  <select
                    value={facilities.bookingBasis || 'MONTHLY'}
                    onChange={(e) => handleFacilityChange('bookingBasis', e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-indigo-500 transition font-semibold"
                  >
                    <option value="MONTHLY">Monthly Basis (Standard Rent)</option>
                    <option value="WEEKLY">Weekly Basis (Short-term Corporate)</option>
                    <option value="DAILY">Daily Basis (Flexi-stays)</option>
                    <option value="FLEXIBLE">Flexible / Negotiable Basis</option>
                  </select>
                </div>
              </div>

              {facilities.wfhFriendly && (
                <div className="space-y-4 pt-2 border-t border-slate-105/50 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">WFH Amenities Provided</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-650 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!facilities.wfhWifi}
                          onChange={(e) => handleFacilityChange('wfhWifi', e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>High-Speed Wi-Fi (100+ Mbps)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-655 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!facilities.wfhDesk}
                          onChange={(e) => handleFacilityChange('wfhDesk', e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Dedicated Desk & Ergonomic Chair</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-655 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!facilities.wfhPower}
                          onChange={(e) => handleFacilityChange('wfhPower', e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>24/7 Power Backup / UPS</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-655 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!facilities.wfhQuiet}
                          onChange={(e) => handleFacilityChange('wfhQuiet', e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Quiet working environment</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-655 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!facilities.wfhTea}
                          onChange={(e) => handleFacilityChange('wfhTea', e.target.checked)}
                          className="w-3.5 h-3.5 rounded-sm border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Coffee / Tea access</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Employee Terms & Conditions (e.g. ID Proof, Silence hours, visitors)</label>
                    <textarea
                      rows={2}
                      value={facilities.wfhTerms || ''}
                      onChange={(e) => handleFacilityChange('wfhTerms', e.target.value)}
                      placeholder="Specify terms for corporate stays or remote employees..."
                      className="w-full bg-white border border-slate-205 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-indigo-500 transition font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Amenities Section (For all categories) */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <label className="text-xs uppercase font-extrabold text-slate-400 tracking-wider block">
            Custom User-defined Amenities (Optional)
          </label>
          
          {/* Custom list */}
          {facilities.custom && facilities.custom.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {facilities.custom.map((amenity: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomAmenity(idx)}
                    className="text-indigo-400 hover:text-indigo-700 cursor-pointer font-black text-sm pl-1 line-none border-none bg-transparent"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom amenity */}
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={customAmenityInput}
              onChange={(e) => setCustomAmenityInput(e.target.value)}
              placeholder="e.g. Pet Friendly, Park Facing, Lift, CCTV"
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl outline-hidden transition font-semibold text-slate-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustomAmenity}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
            >
              Add Amenity
            </button>
          </div>
        </div>
      </div>

      {/* Images Upload Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center">
          <span>Upload Media (Max 5)</span>
          <span className="text-xs text-slate-450 font-normal">JPG, PNG or WEBP (Max 2MB per file)</span>
        </h3>

        {/* Image Grid Previews */}
        {watchImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {watchImages.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-150 border border-slate-200 shadow-inner">
                <img src={url} alt={`Listing image ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-90 hover:opacity-100 transition shadow-md cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Uploader Input Box */}
        {watchImages.length < 5 && (
          <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition">
            <input
              type="file"
              multiple
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {uploading ? (
              <div className="space-y-2 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-sm font-semibold text-slate-650">Uploading images, please wait...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-350 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Select images to upload</p>
                <p className="text-xs text-slate-400">Click to browse your device files (remaining: {5 - watchImages.length})</p>
              </div>
            )}
          </div>
        )}
        {errors.images && (
          <p className="text-xs text-rose-500 font-semibold">{errors.images.message}</p>
        )}
      </div>

      {/* Geolocation and Coordinates mapping card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
          Property Location Details
        </h3>

        {/* Autocomplete Search input */}
        <div className="relative space-y-1.5" ref={dropdownRef}>
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Search Map Location</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing area/building name (e.g. MG Road Bangalore)..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-indigo-650 animate-spin absolute right-3.5 top-3.5" />
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectAddress(result)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-55 text-xs text-slate-700 transition flex items-start space-x-2"
                >
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto Filled Address Output */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Full Address (Adjustable)</label>
          <input
            type="text"
            {...register('address')}
            className="w-full bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl text-slate-650"
            placeholder="Mapped full address will display here..."
          />
          {errors.address && (
            <p className="text-xs text-rose-500 font-semibold">{errors.address.message}</p>
          )}
        </div>

        {/* Auto Filled Area Output */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Local Area/Suburb (Vetted)</label>
          <input
            type="text"
            {...register('area')}
            className="w-full bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl text-slate-650"
            placeholder="Local sub-district or area will display here..."
          />
          {errors.area && (
            <p className="text-xs text-rose-500 font-semibold">{errors.area.message}</p>
          )}
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">City (Auto-filled)</label>
            <input
              type="text"
              {...register('city')}
              className="w-full bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl text-slate-650"
              placeholder="City will display here..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">State (Auto-filled)</label>
            <input
              type="text"
              {...register('state')}
              className="w-full bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl text-slate-650"
              placeholder="State will display here..."
            />
          </div>
        </div>

        {/* Map Container widget */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold">Interactive Map (Drag marker to refine exact position)</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/60 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                {locating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>📍 Use My Location</span>
                  </>
                )}
              </button>
              <span className="font-mono bg-slate-50 px-2 py-1 rounded-sm border border-slate-100">
              Lat: {watchLat.toFixed(5)}, Lng: {watchLng.toFixed(5)}
            </span>
            </div>
          </div>
          <div className="h-80 w-full rounded-xl overflow-hidden shadow-inner border border-slate-200">
            <LeafletMap
              lat={watchLat}
              lng={watchLng}
              draggable={true}
              onChange={handleMapChange}
            />
          </div>
        </div>
      </div>

      {/* Timing and Contact Details Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
          Hours & Direct Contacts
        </h3>

        {/* Timing Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Opening Visiting Hour</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                {...register('openingHours')}
                placeholder="e.g. 09:00"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.openingHours && (
              <p className="text-xs text-rose-500 font-semibold">{errors.openingHours.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Closing Visiting Hour</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                {...register('closingHours')}
                placeholder="e.g. 19:00"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.closingHours && (
              <p className="text-xs text-rose-500 font-semibold">{errors.closingHours.message}</p>
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Mobile Number (Indian)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                {...register('contactNumber')}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.contactNumber && (
              <p className="text-xs text-rose-500 font-semibold">{errors.contactNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">WhatsApp Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                {...register('whatsappNumber')}
                placeholder="10-digit WhatsApp number"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.whatsappNumber && (
              <p className="text-xs text-rose-500 font-semibold">{errors.whatsappNumber.message}</p>
            )}
          </div>
        </div>

        {/* Landlord Terms */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            {watchCategory === 'ROOMMATE' ? 'Roommate Habits / Rules' : 'Landlord / Lease Terms'}
          </label>
          <textarea
            rows={3}
            {...register('landlordTerms')}
            placeholder={
              watchCategory === 'ROOMMATE'
                ? "e.g. Vegetarian preferred, no smoking inside, quiet hours after 11 PM, guest rules..."
                : "e.g. 10 months deposit required, bachelors allowed, family preferred..."
            }
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y"
          />
          {errors.landlordTerms && (
            <p className="text-xs text-rose-500 font-semibold">{errors.landlordTerms.message}</p>
          )}
        </div>
      </div>

      {/* Form Submission buttons */}
      <div className="flex gap-4 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => {
            if (confirm('Cancel and discard changes?')) router.push('/dashboard');
          }}
          disabled={submitting || uploading}
          className="flex-1 border border-slate-200 bg-white hover:bg-slate-55 text-slate-650 font-bold py-3.5 rounded-xl transition cursor-pointer select-none disabled:bg-slate-50 disabled:text-slate-350"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex-2 flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-755 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-350 select-none cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving details...</span>
            </>
          ) : (
            <span>{isEditMode ? 'Update Listing Details' : 'Publish Ad for Review'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
