'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Check,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardPaymentsProps {
  listings: any[];
}

export default function DashboardPayments({ listings }: DashboardPaymentsProps) {
  const [paymentsMade, setPaymentsMade] = useState<any[]>([]);
  const [paymentsReceived, setPaymentsReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'tenant' | 'landlord'>('tenant');

  // Tenant form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amountPaid, setAmountPaid] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/user/payments');
      if (res.ok) {
        const data = await res.json();
        setPaymentsMade(data.paymentsMade || []);
        setPaymentsReceived(data.paymentsReceived || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Search listings handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/listings?query=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          // Filter listings (ensure it has data.listings)
          const results = data.listings || data || [];
          setSearchResults(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.urls && data.urls[0]) {
        setScreenshotUrl(data.urls[0]);
        toast.success('Screenshot uploaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload screenshot.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) {
      toast.error('Please select a rented property.');
      return;
    }
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${selectedListing.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(month.toString()),
          year: parseInt(year.toString()),
          amountPaid: parseFloat(amountPaid),
          upiScreenshotUrl: screenshotUrl,
        }),
      });

      if (res.ok) {
        toast.success('Payment proof uploaded successfully!');
        setAmountPaid('');
        setScreenshotUrl('');
        setSelectedListing(null);
        setSearchQuery('');
        fetchPayments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit payment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLandlordConfirm = async (listingId: string, paymentId: string) => {
    try {
      const res = await fetch(`/api/listings/${listingId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action: 'confirm',
        }),
      });

      if (res.ok) {
        toast.success('Payment verified!');
        fetchPayments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to verify payment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error verifying payment.');
    }
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode('tenant')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'tenant'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } cursor-pointer`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Tenant Mode (Pay Rent)
        </button>
        <button
          onClick={() => setMode('landlord')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'landlord'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } cursor-pointer`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Landlord Mode (Receive Rent)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : mode === 'tenant' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 h-fit">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Submit Rent Payment Proof</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                Upload UPI transfer details for your landlord
              </p>
            </div>

            <form onSubmit={handleTenantSubmit} className="space-y-4">
              {/* Select rented property */}
              <div className="space-y-1 relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Property</label>
                {selectedListing ? (
                  <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-900">
                    <div>
                      <div>{selectedListing.title}</div>
                      <div className="text-[10px] text-slate-450 font-normal">{selectedListing.city} &bull; ₹{selectedListing.price}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedListing(null)}
                      className="text-red-500 hover:text-red-700 font-extrabold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search property title..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs pl-9 pr-3 py-2.5 rounded-xl outline-hidden text-slate-700 font-semibold"
                      />
                    </div>
                    {/* Autocomplete list */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 mt-1 rounded-xl shadow-lg z-25 max-h-40 overflow-y-auto">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedListing(item);
                              setSearchResults([]);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold border-b border-slate-100 flex flex-col cursor-pointer"
                          >
                            <span className="text-slate-800">{item.title}</span>
                            <span className="text-[10px] text-slate-450 font-normal">{item.area}, {item.city} &bull; ₹{item.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searching && (
                      <div className="text-[10px] text-slate-400 font-semibold italic mt-1">Searching...</div>
                    )}
                  </>
                )}
              </div>

              {/* Month/Year selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    {monthsList.map((m, idx) => (
                      <option key={idx} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden text-slate-700 font-bold"
                  >
                    {[2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount paid */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2.5 rounded-xl outline-hidden text-slate-700 font-semibold"
                />
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">UPI Screenshot Proof</label>
                {screenshotUrl ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden h-32 flex items-center justify-center">
                    <img src={screenshotUrl} alt="Receipt preview" className="object-contain h-full w-full" />
                    <button
                      type="button"
                      onClick={() => setScreenshotUrl('')}
                      className="absolute top-2 right-2 bg-red-650 text-white rounded-full p-1 text-xs hover:bg-red-750 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-6 hover:bg-slate-50 transition cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500 mt-2">
                      {uploading ? 'Uploading...' : 'Click to Upload Screenshot'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadScreenshot}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Payment Proof</span>
                )}
              </button>
            </form>
          </div>

          {/* Payments list history */}
          <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Your Paid Rent History</h3>
            
            {paymentsMade.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
                You haven't logged any rent payments yet. Use the form to submit one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Property</th>
                      <th className="pb-3">Month/Year</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Receipt</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paymentsMade.map((payment) => (
                      <tr key={payment.id} className="text-slate-700">
                        <td className="py-3.5 max-w-[150px] truncate">{payment.listing.title}</td>
                        <td className="py-3.5">{monthsList[payment.month - 1]} {payment.year}</td>
                        <td className="py-3.5 font-bold">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                        <td className="py-3.5">
                          {payment.upiScreenshotUrl ? (
                            <a
                              href={payment.upiScreenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-650 hover:underline flex items-center gap-0.5 text-[10px] font-black"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          {payment.landlordConfirmed ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 w-fit">
                              <Check className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 w-fit">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              <span>Awaiting</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Landlord Mode */
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">Tenant Payment Proofs Received</h3>
          
          {paymentsReceived.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
              No rent payment records received for your properties yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Property</th>
                    <th className="pb-3">Tenant Name</th>
                    <th className="pb-3">Month/Year</th>
                    <th className="pb-3">Amount Paid</th>
                    <th className="pb-3">Screenshot Proof</th>
                    <th className="pb-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paymentsReceived.map((payment) => (
                    <tr key={payment.id} className="text-slate-700">
                      <td className="py-3.5 font-bold">{payment.listing.title}</td>
                      <td className="py-3.5">
                        <div>{payment.tenant.name || 'Anonymous'}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{payment.tenant.email}</div>
                      </td>
                      <td className="py-3.5">{monthsList[payment.month - 1]} {payment.year}</td>
                      <td className="py-3.5 font-black">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="py-3.5">
                        {payment.upiScreenshotUrl ? (
                          <a
                            href={payment.upiScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-indigo-50 text-indigo-850 hover:bg-indigo-100 border border-indigo-150 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 w-fit"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Proof</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">No Image</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {payment.landlordConfirmed ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-650" />
                            <span>Confirmed Rent</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLandlordConfirm(payment.listing.id, payment.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer select-none active:scale-[0.97]"
                          >
                            Confirm Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
