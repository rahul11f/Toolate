'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Bell, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const unread = (data.notifications || []).filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch {}
    }
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, [status]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden select-none">
      {/* Glass background bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-end justify-around max-w-lg mx-auto px-2 relative">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-90 ${
              isActive('/')
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            <Home className={`w-[22px] h-[22px] ${isActive('/') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive('/') ? 'font-extrabold' : 'font-medium'}`}>Home</span>
            {isActive('/') && <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
          </Link>

          {/* Search */}
          <Link
            href="/listings"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-90 ${
              isActive('/listings')
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            <Search className={`w-[22px] h-[22px] ${isActive('/listings') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive('/listings') ? 'font-extrabold' : 'font-medium'}`}>Search</span>
            {isActive('/listings') && <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
          </Link>

          {/* Center FAB — Post */}
          <div className="flex flex-col items-center -mt-5">
            <Link
              href={session ? '/listings/create' : '/login'}
              className="bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-all duration-200 border-4 border-white"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </Link>
            <span className="text-[10px] font-bold text-indigo-600 mt-1">Post</span>
          </div>

          {/* Alerts */}
          <Link
            href="/dashboard?tab=notifications"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-90 relative ${
              pathname.includes('notification')
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <Bell className={`w-[22px] h-[22px] ${pathname.includes('notification') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 ${pathname.includes('notification') ? 'font-extrabold' : 'font-medium'}`}>Alerts</span>
          </Link>

          {/* Dashboard / Profile */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-200 active:scale-90 ${
              isActive('/dashboard')
                ? 'text-indigo-600'
                : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className={`w-[22px] h-[22px] ${isActive('/dashboard') ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] mt-0.5 ${isActive('/dashboard') ? 'font-extrabold' : 'font-medium'}`}>Dashboard</span>
            {isActive('/dashboard') && <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
          </Link>
        </div>
      </div>

      {/* Safe area spacer for iPhones with home indicator */}
      <div className="bg-white/90 backdrop-blur-xl h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
