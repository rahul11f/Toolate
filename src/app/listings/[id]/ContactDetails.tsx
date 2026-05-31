'use client';

import { useState } from 'react';
import { Phone, MessageSquare, Eye, Lock, LogIn } from 'lucide-react';
import Link from 'next/link';

interface ContactDetailsProps {
  contactNumber: string;
  whatsappNumber: string;
  isAuthenticated?: boolean;
  isRestricted?: boolean;
}

export default function ContactDetails({ contactNumber, whatsappNumber, isAuthenticated = true, isRestricted = false }: ContactDetailsProps) {
  const [show, setShow] = useState(false);

  // If ID verification is required and user is unverified
  if (isAuthenticated && isRestricted) {
    return (
      <div className="space-y-4">
        <div className="relative bg-gradient-to-br from-amber-50/50 to-rose-50/30 border border-amber-100 rounded-xl p-6 text-center space-y-3 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06),transparent_70%)]" />
          <div className="relative z-10 space-y-3">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">🔒 ID Verification Required</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The host requires visitors to have a verified identity document badge to view contact details or apply.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition text-sm active:scale-[0.98]"
            >
              <span>Verify ID in Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show locked sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="relative bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-100 rounded-xl p-6 text-center space-y-3 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_70%)]" />
          <div className="relative z-10 space-y-3">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Contact Info Locked</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sign in to view landlord contact number, WhatsApp, and full property details.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition text-sm active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Unlock</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        type="button"
        className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer select-none active:scale-[0.98]"
      >
        <Eye className="w-4 h-4" />
        <span>Show Contact Information</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-250/60 rounded-xl p-5 space-y-4 transition-all duration-300">
      <div className="border-b border-slate-200 pb-2">
        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Landlord Details</h4>
      </div>
      <div className="space-y-3">
        <a
          href={`tel:+91${contactNumber}`}
          className="flex items-center space-x-3 text-slate-600 hover:text-indigo-600 transition"
        >
          <div className="bg-white p-2 rounded-lg border border-slate-200 text-indigo-600 shadow-xs">
            <Phone className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">+91 {contactNumber}</span>
        </a>
        <a
          href={`https://wa.me/91${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 text-slate-600 hover:text-emerald-600 transition"
        >
          <div className="bg-white p-2 rounded-lg border border-slate-200 text-emerald-600 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">+91 {whatsappNumber} (WhatsApp)</span>
        </a>
      </div>
    </div>
  );
}
