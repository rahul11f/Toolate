'use client';

import { useState } from 'react';
import { IndianRupee, ChevronDown, ChevronUp, Calculator, Wallet } from 'lucide-react';

interface MoveInCostCalculatorProps {
  monthlyRent: number;
}

export default function MoveInCostCalculator({ monthlyRent }: MoveInCostCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [depositMonths, setDepositMonths] = useState(2);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [agreementCost, setAgreementCost] = useState(500);
  const [movingCharges, setMovingCharges] = useState(0);

  const securityDeposit = monthlyRent * depositMonths;
  const advanceRent = monthlyRent * advanceMonths;
  const totalCost = securityDeposit + advanceRent + agreementCost + movingCharges;
  const brokerageSaved = monthlyRent; // Traditional broker charges 1 month rent

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Wallet className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-slate-800 text-sm">Calculate Move-in Cost</h4>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total day-1 expenses</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-50">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Rent</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600">
                <IndianRupee className="w-3 h-3 text-slate-400 mr-1" />
                <span>{formatCurrency(monthlyRent)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Security Deposit</label>
              <select
                value={depositMonths}
                onChange={(e) => setDepositMonths(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-3 py-2 rounded-lg outline-hidden transition font-medium text-slate-700"
              >
                <option value={1}>1 month</option>
                <option value={2}>2 months</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Advance Rent</label>
              <select
                value={advanceMonths}
                onChange={(e) => setAdvanceMonths(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-3 py-2 rounded-lg outline-hidden transition font-medium text-slate-700"
              >
                <option value={0}>None</option>
                <option value={1}>1 month</option>
                <option value={2}>2 months</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agreement Cost</label>
              <select
                value={agreementCost}
                onChange={(e) => setAgreementCost(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm px-3 py-2 rounded-lg outline-hidden transition font-medium text-slate-700"
              >
                <option value={0}>₹0 (Skip)</option>
                <option value={500}>₹500</option>
                <option value={1000}>₹1,000</option>
                <option value={1500}>₹1,500</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Packers & Movers (₹)</label>
            <div className="relative">
              <IndianRupee className="w-3 h-3 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                value={movingCharges || ''}
                onChange={(e) => setMovingCharges(parseInt(e.target.value) || 0)}
                placeholder="e.g. 5000"
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-sm pl-7 pr-3 py-2 rounded-lg outline-hidden transition font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
              <Calculator className="w-3.5 h-3.5 text-indigo-500" />
              <span>Day-1 Cost Breakdown</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Security deposit ({depositMonths} mo)</span>
                <span className="font-semibold">₹{formatCurrency(securityDeposit)}</span>
              </div>
              {advanceMonths > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Advance rent ({advanceMonths} mo)</span>
                  <span className="font-semibold">₹{formatCurrency(advanceRent)}</span>
                </div>
              )}
              {agreementCost > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Agreement registration</span>
                  <span className="font-semibold">₹{formatCurrency(agreementCost)}</span>
                </div>
              )}
              {movingCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Packers & movers</span>
                  <span className="font-semibold">₹{formatCurrency(movingCharges)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>TOTAL</span>
                <span className="text-indigo-700">₹{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Savings comparison */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
              You save ₹{formatCurrency(brokerageSaved)} by using Toolate
            </p>
            <p className="text-[9px] text-emerald-600 mt-0.5">
              Traditional broker would charge 1 month rent as brokerage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
