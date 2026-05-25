import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
        </div>
        <div className="h-12 w-44 bg-slate-200 rounded-xl shrink-0"></div>
      </div>

      {/* Tabs Row Skeleton */}
      <div className="flex space-x-6 border-b border-slate-200 pb-2">
        <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
        <div className="h-6 w-28 bg-slate-100 rounded-md"></div>
        <div className="h-6 w-24 bg-slate-100 rounded-md"></div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Stats Column Skeleton */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
            <div className="flex gap-4">
              <div className="h-12 w-20 bg-slate-100 rounded-lg"></div>
              <div className="h-12 w-20 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="h-5 w-28 bg-slate-200 rounded-md"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded-md"></div>
              <div className="h-4 w-5/6 bg-slate-100 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* Listings List Column Skeleton */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-4 w-20 bg-slate-100 rounded-md"></div>
          </div>

          {/* Listing Cards Skeletons */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-44 h-28 bg-slate-200 rounded-xl shrink-0"></div>
              <div className="flex-grow space-y-3 py-1">
                <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
                  <div className="h-6 w-24 bg-slate-150 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Central Spinner fallback in case of slow CPU/network */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    </div>
  );
}
