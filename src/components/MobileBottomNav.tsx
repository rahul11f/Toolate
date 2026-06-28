'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Search, Plus, Bell, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const unread = (data.notifications || []).filter((n: { read: boolean }) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch {}
    }
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, [status]);

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname.startsWith('/listings');
  const isAlertsActive = pathname === '/notifications';
  const isDashboardActive = pathname === '/dashboard';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none">
      {/* Glass background bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-end justify-around max-w-lg mx-auto px-2 relative">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-95 ${
              isHomeActive
                ? 'text-indigo-650'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className={`w-[22px] h-[22px] ${isHomeActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isHomeActive ? 'font-black' : 'font-semibold'}`}>Home</span>
            {isHomeActive && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5 animate-pulse" />}
          </Link>

          {/* Search */}
          <Link
            href="/listings"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-95 ${
              isSearchActive
                ? 'text-indigo-655'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Search className={`w-[22px] h-[22px] ${isSearchActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isSearchActive ? 'font-black' : 'font-semibold'}`}>Search</span>
            {isSearchActive && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5 animate-pulse" />}
          </Link>

          {/* Center FAB — Post */}
          <div className="flex flex-col items-center -mt-5">
            <Link
              href={session ? '/listings/create' : '/login'}
              className="bg-gradient-to-br from-indigo-600 via-indigo-755 to-indigo-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90 transition-all duration-200 border-4 border-white"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </Link>
            <span className="text-[10px] font-black text-indigo-650 mt-1 uppercase tracking-wider">Post</span>
          </div>

          {/* Alerts */}
          <Link
            href="/notifications"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-95 relative ${
              isAlertsActive
                ? 'text-indigo-655'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Bell className={`w-[22px] h-[22px] ${isAlertsActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 ${isAlertsActive ? 'font-black' : 'font-semibold'}`}>Alerts</span>
            {isAlertsActive && <span className="w-1.5 h-1.5 bg-indigo-650 rounded-full mt-0.5 animate-pulse" />}
          </Link>

          {/* Dashboard / Profile */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-95 ${
              isDashboardActive
                ? 'text-indigo-650'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-[22px] h-[22px] ${isDashboardActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isDashboardActive ? 'font-black' : 'font-semibold'}`}>Dashboard</span>
            {isDashboardActive && <span className="w-1.5 h-1.5 bg-indigo-650 rounded-full mt-0.5 animate-pulse" />}
          </Link>
        </div>
      </div>

      {/* Safe area spacer for iPhones with home indicator */}
      <div className="bg-white/90 backdrop-blur-xl h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
