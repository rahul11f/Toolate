'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, FileText, User, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
    },
    {
      label: 'Search',
      path: '/listings',
      icon: Search,
    },
    {
      label: 'Agreement',
      path: '/tools/rental-agreement',
      icon: FileText,
    },
    {
      label: 'Quiz',
      path: '/roommate-quiz',
      icon: Sparkles,
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-45 bg-white/85 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] px-2 py-1 md:hidden select-none pb-safe">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Simple active state check
          const isActive = item.path === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.path);

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-indigo-650 font-black'
                  : 'text-slate-450 hover:text-slate-800 font-semibold'
              }`}
            >
              <Icon className={`w-5.5 h-5.5 ${isActive ? 'stroke-[2.5] scale-105' : 'stroke-[2]'}`} />
              <span className="text-[10px] mt-0.5 tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
