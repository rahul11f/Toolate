'use client';

import { useState } from 'react';
import { IndianRupee, Users, Plus, Minus, Copy, Check, MessageCircle, Calculator, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type RoomType = 'MASTER' | 'REGULAR' | 'STORAGE' | 'SHARED';

interface Roommate {
  id: number;
  name: string;
  roomType: RoomType;
  attachedWashroom: boolean;
  hasBalcony: boolean;
}

const ROOM_WEIGHTS: Record<RoomType, number> = {
  MASTER: 1.3,
  REGULAR: 1.0,
  STORAGE: 0.7,
  SHARED: 0.5,
};

const ROOM_LABELS: Record<RoomType, string> = {
  MASTER: 'Master Bedroom',
  REGULAR: 'Regular Room',
  STORAGE: 'Storage / Converted',
  SHARED: 'Shared Room',
};

export default function RentCalculatorPage() {
  const [totalRent, setTotalRent] = useState<number>(0);
  const [roommates, setRoommates] = useState<Roommate[]>([
    { id: 1, name: 'Person 1', roomType: 'MASTER', attachedWashroom: true, hasBalcony: false },
    { id: 2, name: 'Person 2', roomType: 'REGULAR', attachedWashroom: false, hasBalcony: false },
  ]);
  const [copied, setCopied] = useState(false);

  const addRoommate = () => {
    if (roommates.length >= 4) {
      toast.error('Maximum 4 roommates allowed');
      return;
    }
    setRoommates([
      ...roommates,
      {
        id: Date.now(),
        name: `Person ${roommates.length + 1}`,
        roomType: 'REGULAR',
        attachedWashroom: false,
        hasBalcony: false,
      },
    ]);
  };

  const removeRoommate = () => {
    if (roommates.length <= 2) {
      toast.error('Minimum 2 roommates required');
      return;
    }
    setRoommates(roommates.slice(0, -1));
  };

  const updateRoommate = (id: number, field: keyof Roommate, value: any) => {
    setRoommates(roommates.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Calculate shares
  const calculateShares = () => {
    if (totalRent <= 0) return roommates.map(() => 0);

    const weights = roommates.map((r) => {
      let w = ROOM_WEIGHTS[r.roomType];
      if (r.attachedWashroom) w += 0.15;
      if (r.hasBalcony) w += 0.1;
      return w;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => Math.round((totalRent * w) / totalWeight));
  };

  const shares = calculateShares();
  const maxShare = Math.max(...shares, 1);

  const formatCurrency = (amount: number) => amount.toLocaleString('en-IN');

  const generateWhatsAppMessage = () => {
    let msg = `🏠 *Rent Split Breakdown*\n\n`;
    msg += `Total Rent: ₹${formatCurrency(totalRent)}/month\n\n`;
    roommates.forEach((r, i) => {
      const extras = [];
      if (r.attachedWashroom) extras.push('attached washroom');
      if (r.hasBalcony) extras.push('balcony');
      const extrasStr = extras.length > 0 ? ` (${extras.join(', ')})` : '';
      msg += `${r.name} — ${ROOM_LABELS[r.roomType]}${extrasStr}: *₹${formatCurrency(shares[i])}*\n`;
    });
    msg += `\n_Calculated on Toolate — Zero brokerage rentals_`;
    return msg;
  };

  const handleCopyToClipboard = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back & Header */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Rent Split Calculator
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Fair rent division based on room size, facilities & extras
            </p>
          </div>
        </div>
      </div>

      {/* Total Rent Input */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Step 1: Enter Total Rent</h3>
        <div className="relative max-w-xs">
          <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="number"
            value={totalRent || ''}
            onChange={(e) => setTotalRent(parseInt(e.target.value) || 0)}
            placeholder="e.g. 21500"
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-base pl-10 pr-4 py-3 rounded-xl outline-hidden transition font-semibold"
          />
        </div>
      </div>

      {/* Roommates Setup */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Step 2: Configure Rooms</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={removeRoommate}
              disabled={roommates.length <= 2}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex items-center gap-1 text-sm font-bold text-slate-700 px-2">
              <Users className="w-4 h-4 text-indigo-500" />
              {roommates.length}
            </span>
            <button
              onClick={addRoommate}
              disabled={roommates.length >= 4}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {roommates.map((r, i) => (
            <div
              key={r.id}
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Name</label>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => updateRoommate(r.id, 'name', e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-3 py-2 rounded-lg outline-hidden transition font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room Type</label>
                  <select
                    value={r.roomType}
                    onChange={(e) => updateRoommate(r.id, 'roomType', e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-3 py-2 rounded-lg outline-hidden transition font-medium"
                  >
                    {(Object.keys(ROOM_WEIGHTS) as RoomType[]).map((type) => (
                      <option key={type} value={type}>
                        {ROOM_LABELS[type]} (×{ROOM_WEIGHTS[type]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-slate-700 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={r.attachedWashroom}
                    onChange={(e) => updateRoommate(r.id, 'attachedWashroom', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Attached Washroom (+0.15)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={r.hasBalcony}
                    onChange={(e) => updateRoommate(r.id, 'hasBalcony', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Has Balcony (+0.10)</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {totalRent > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Fair Split Results
          </h3>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  <th className="text-left py-3 px-2">Person</th>
                  <th className="text-left py-3 px-2">Room</th>
                  <th className="text-left py-3 px-2">Extras</th>
                  <th className="text-right py-3 px-2">Fair Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {roommates.map((r, i) => {
                  const extras = [];
                  if (r.attachedWashroom) extras.push('🚿 Washroom');
                  if (r.hasBalcony) extras.push('🌿 Balcony');
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-2 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-3 px-2 text-slate-600">{ROOM_LABELS[r.roomType]}</td>
                      <td className="py-3 px-2 text-slate-500 text-xs">
                        {extras.length > 0 ? extras.join(', ') : '—'}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-indigo-700">
                        ₹{formatCurrency(shares[i])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="py-3 px-2 font-extrabold text-slate-900">TOTAL</td>
                  <td className="py-3 px-2 text-right font-extrabold text-indigo-800">
                    ₹{formatCurrency(shares.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual Bar Chart */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Visual Breakdown</h4>
            {roommates.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 w-20 truncate">{r.name}</span>
                <div className="flex-grow h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(15, (shares[i] / maxShare) * 100)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                      ₹{formatCurrency(shares[i])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer select-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer select-none"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
