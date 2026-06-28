'use client';

import { useState } from 'react';
import { Calculator, IndianRupee, PieChart } from 'lucide-react';

export default function RentEstimatorPage() {
  const [data, setData] = useState({
    baseRent: 15000,
    maintenance: 2000,
    electricity: 1500,
    water: 500,
    wifi: 800,
    groceries: 6000,
    maid: 2000,
    roommates: 2,
  });

  const updateField = (field: string, value: string) => {
    setData({ ...data, [field]: Number(value) || 0 });
  };

  const totalHouseholdCost = 
    data.baseRent + 
    data.maintenance + 
    data.electricity + 
    data.water + 
    data.wifi + 
    data.groceries + 
    data.maid;

  const perPersonCost = data.roommates > 0 ? Math.round(totalHouseholdCost / data.roommates) : totalHouseholdCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <Calculator className="w-8 h-8 text-emerald-500" />
          <span>Rent & Living Budget Estimator</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Calculate your true monthly living expenses and see exactly how much it costs per person when sharing a flat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">Monthly Expenses</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Base House Rent</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.baseRent || ''}
                  onChange={(e) => updateField('baseRent', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Society Maintenance</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.maintenance || ''}
                  onChange={(e) => updateField('maintenance', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Electricity (Est.)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.electricity || ''}
                  onChange={(e) => updateField('electricity', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Water Bill (Est.)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.water || ''}
                  onChange={(e) => updateField('water', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Wi-Fi / Internet</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.wifi || ''}
                  onChange={(e) => updateField('wifi', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Groceries & Food</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.groceries || ''}
                  onChange={(e) => updateField('groceries', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Maid / Cook / Cleaning</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  value={data.maid || ''}
                  onChange={(e) => updateField('maid', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Number of Roommates</label>
              <select
                value={data.roommates}
                onChange={(e) => updateField('roommates', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm px-4 py-2.5 rounded-xl outline-none transition"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Person{num > 1 ? 's' : ''} (Split by {num})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-500 rounded-full opacity-50 blur-2xl"></div>
            
            <h3 className="text-emerald-100 font-bold uppercase tracking-wider text-xs mb-2 relative z-10">Total Household Cost</h3>
            <div className="text-5xl font-black mb-8 relative z-10">₹{totalHouseholdCost.toLocaleString('en-IN')}</div>
            
            <div className="pt-6 border-t border-emerald-500/50 relative z-10">
              <h3 className="text-emerald-100 font-bold uppercase tracking-wider text-xs mb-2">Cost Per Person</h3>
              <div className="text-4xl font-black">₹{perPersonCost.toLocaleString('en-IN')} <span className="text-lg font-medium text-emerald-200">/ mo</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-500" />
              <span>Cost Breakdown</span>
            </h3>
            
            <div className="space-y-3">
              {[
                { label: 'Rent & Maintenance', value: data.baseRent + data.maintenance, color: 'bg-emerald-500' },
                { label: 'Utilities (Power, Water, Wi-Fi)', value: data.electricity + data.water + data.wifi, color: 'bg-sky-500' },
                { label: 'Food & Groceries', value: data.groceries, color: 'bg-amber-500' },
                { label: 'Services (Maid/Cook)', value: data.maid, color: 'bg-purple-500' },
              ].map((item, idx) => {
                const percentage = totalHouseholdCost > 0 ? (item.value / totalHouseholdCost) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-800">₹{item.value.toLocaleString('en-IN')} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
