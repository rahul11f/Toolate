'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, MessageSquare, Mail, X, ShieldCheck, AlertTriangle, Lock, LogIn, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import UserAvatar from './UserAvatar';

interface Lister {
  id: string;
  name: string;
  image?: string | null;
  documentVerified: boolean;
  legalName?: string | null;
  email?: string | null;
  whatsappEnabled?: boolean;
}

interface ListingData {
  id: string;
  title: string;
  category: string;
  contactNumber: string;
  whatsappNumber: string;
  requireVerification: boolean;
}

interface ListingConnectTriggerProps {
  lister: Lister;
  listing: ListingData;
  isAuthenticated?: boolean;
  currentUserVerified?: boolean;
}

export default function ListingConnectTrigger({
  lister,
  listing,
  isAuthenticated: propIsAuthenticated,
  currentUserVerified: propCurrentUserVerified
}: ListingConnectTriggerProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUserVerified, setCurrentUserVerified] = useState(propCurrentUserVerified || false);

  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : status === 'authenticated';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (propCurrentUserVerified !== undefined) {
      setCurrentUserVerified(propCurrentUserVerified);
      return;
    }

    if (isAuthenticated) {
      if (session?.user && (session.user as any).documentVerified) {
        setCurrentUserVerified(true);
      } else {
        fetch('/api/user/profile')
          .then((res) => res.json())
          .then((data) => {
            if (data?.user?.documentVerified) {
              setCurrentUserVerified(true);
            }
          })
          .catch((err) => console.warn('Failed to fetch user verification status:', err));
      }
    } else {
      setCurrentUserVerified(false);
    }
  }, [isAuthenticated, session, propCurrentUserVerified]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const ownerName = lister.legalName || lister.name || 'Anonymous Host';
  const isListerVerified = lister.documentVerified;
  const isRestricted = listing.requireVerification && !currentUserVerified;

  return (
    <div className="relative z-20">
      {/* Clickable Lister Info & Connect Trigger inside card */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 max-w-[65%]">
          <UserAvatar
            image={lister.image}
            name={ownerName}
            fallbackClassName="bg-indigo-100 text-indigo-600 font-bold text-[10px]"
          />
          <div className="truncate text-left">
            <span className="font-bold text-slate-700 block truncate leading-tight">
              {ownerName}
            </span>
            {isListerVerified ? (
              <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 fill-emerald-50 shrink-0" />
                <span>ID Verified</span>
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                Unverified Host
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleOpen}
          type="button"
          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 px-2.5 py-1.5 rounded-lg border border-indigo-100/30 transition cursor-pointer select-none active:scale-95"
        >
          <span>Connect</span>
        </button>

        {/* WhatsApp Quick-Connect — only shown on card if user is logged in and lister has a WhatsApp number and enabled it */}
        {isAuthenticated && !isRestricted && listing.whatsappNumber && lister?.whatsappEnabled && (
          <a
            href={`https://wa.me/91${listing.whatsappNumber}?text=Hi, I found your listing "${listing.title}" on Toolate. Is it still available?`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Chat on WhatsApp"
            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 transition cursor-pointer select-none active:scale-95 text-xs"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-emerald-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        )}
      </div>

      {/* Modal Dialog */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-fade-in relative z-50 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Connect with Host</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-450 hover:text-slate-650 transition p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-6">
              {/* Lister mini profile */}
              <div className="flex items-center gap-4 bg-slate-50/60 border border-slate-100 p-4 rounded-xl">
                <UserAvatar
                  image={lister.image}
                  name={ownerName}
                  sizeClassName="w-12 h-12"
                  fallbackClassName="bg-indigo-100 text-indigo-600 font-bold text-base"
                />
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">{ownerName}</h4>
                  {isListerVerified ? (
                    <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50/80 border border-emerald-100/80 px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 inline-flex">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                      <span>Trusted Identity Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 inline-flex">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Identity Not Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional States */}
              {!isAuthenticated ? (
                /* 1. Guest View */
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                    <Lock className="w-5 h-5 text-indigo-650" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 text-sm">Connection Details Locked</h5>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Please log in to view the host&apos;s direct phone number, email, and WhatsApp details.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      onClick={handleLinkClick}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition text-xs select-none cursor-pointer active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={handleLinkClick}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-55 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition text-xs select-none cursor-pointer active:scale-95"
                    >
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                </div>
              ) : isRestricted ? (
                /* 2. Unverified User trying to access Verified host */
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 text-sm">Identity Verification Required</h5>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      The host of &quot;{listing.title}&quot; requires potential matches/travelers to be ID verified before sharing contact details.
                    </p>
                  </div>
                  <Link
                    href="/dashboard?tab=profile"
                    onClick={handleLinkClick}
                    className="inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition text-xs select-none cursor-pointer active:scale-95 w-full"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify ID in Dashboard</span>
                  </Link>
                </div>
              ) : (
                /* 3. Authorized View */
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">
                    You can connect with the host directly using the coordinates below. Tell them you found their stay coordinate on Toolate.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Phone link */}
                    <a
                      href={`tel:+91${listing.contactNumber}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between bg-white hover:bg-indigo-50/20 border border-slate-200/80 hover:border-indigo-150 p-4 rounded-xl text-slate-700 hover:text-indigo-650 transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-indigo-600 shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Direct Call</span>
                          <span className="font-extrabold text-sm block mt-0.5">+91 {listing.contactNumber}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-bold">Call Now &rarr;</span>
                    </a>

                    {/* WhatsApp link */}
                    {listing.whatsappNumber && lister?.whatsappEnabled && (
                      <a
                      href={`https://wa.me/91${listing.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between bg-white hover:bg-emerald-50/20 border border-slate-200/80 hover:border-emerald-150 p-4 rounded-xl text-slate-700 hover:text-emerald-650 transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-emerald-600 shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">WhatsApp Message</span>
                          <span className="font-extrabold text-sm block mt-0.5">+91 {listing.whatsappNumber}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-bold">Message &rarr;</span>
                    </a>
                    )}

                    {/* Email link */}
                    {lister.email && (
                      <a
                        href={`mailto:${lister.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between bg-white hover:bg-violet-50/20 border border-slate-200/80 hover:border-violet-150 p-4 rounded-xl text-slate-700 hover:text-violet-650 transition group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="bg-violet-50 border border-violet-100 p-2.5 rounded-lg text-violet-600 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Send Email</span>
                            <span className="font-extrabold text-sm block mt-0.5 truncate max-w-[200px]">{lister.email}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-violet-600 font-bold">Email &rarr;</span>
                      </a>
                    )}
                  </div>

                  {/* Trust caution */}
                  {!isListerVerified && (
                    <div className="bg-amber-50 border border-amber-100/70 p-3 rounded-xl text-[11px] text-amber-800 font-semibold flex items-start gap-2 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>This host has not completed government ID verification. Please exercise standard safety precautions: inspect the accommodation in person before making any advance payments.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
