'use client';

import { useState } from 'react';
import DashboardListings from './DashboardListings';
import ProfileSettings from '@/components/ProfileSettings';
import { Building, UserCircle, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardTabsProps {
  initialListings: any[];
  userName: string;
}

export default function DashboardTabs({ initialListings, userName }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'profile'>('listings');

  // Calculate statistics
  const totalListings = initialListings.length;
  const approvedListings = initialListings.filter((l) => l.status === 'APPROVED').length;
  const pendingListings = initialListings.filter((l) => l.status === 'PENDING').length;

  const stats = [
    { label: 'Total Listings', value: totalListings, icon: Building, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Approved Live', value: approvedListings, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Moderation', value: pendingListings, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'listings'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          } cursor-pointer select-none`}
        >
          <span className="flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            Your Listings
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'profile'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          } cursor-pointer select-none`}
        >
          <span className="flex items-center gap-1.5">
            <UserCircle className="w-4 h-4" />
            Profile Settings
          </span>
        </button>
      </div>

      {activeTab === 'listings' ? (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
                  <div className={`p-4 rounded-xl shrink-0 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">{stat.label}</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{stat.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Listings List Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Your Advertisements</h2>
            <DashboardListings initialListings={initialListings} />
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <ProfileSettings />
        </div>
      )}
    </div>
  );
}
