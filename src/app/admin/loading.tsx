import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex space-x-3 shrink-0">
          <div className="h-12 w-32 bg-slate-250 rounded-xl"></div>
          <div className="h-12 w-36 bg-slate-250 rounded-xl"></div>
          <div className="h-12 w-48 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-slate-150 h-10 w-10 shrink-0"></div>
            <div className="space-y-2 flex-grow">
              <div className="h-3 w-16 bg-slate-150 rounded-sm"></div>
              <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* User Moderation Block Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-slate-200 rounded-md"></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <div className="h-4 w-24 bg-slate-150 rounded-md"></div>
            <div className="h-4 w-28 bg-slate-150 rounded-md"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="space-y-1.5 flex-grow max-w-sm">
                  <div className="h-4 w-1/2 bg-slate-200 rounded-md"></div>
                  <div className="h-3.5 w-3/4 bg-slate-100 rounded-sm"></div>
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central Spinner fallback in case of slow CPU/network */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    </div>
  );
}
