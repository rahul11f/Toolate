'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, PlusCircle, Building, LogOut, LayoutDashboard, Settings, User } from 'lucide-react';
import InstallAppButton from './InstallAppButton';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navLinks = [
    { label: 'Browse Listings', path: '/listings' },
  ];

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition">
              <Building className="w-7 h-7 stroke-[2.5]" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Toolate
              </span>
            </Link>
            <div className="hidden md:flex ml-8 space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-indigo-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <InstallAppButton />

            {status === 'loading' ? (
              <span className="text-xs text-slate-400">Loading...</span>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                    isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                      isActive('/admin') ? 'text-rose-600 font-semibold' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  href="/listings/create"
                  className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Ad</span>
                </Link>

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[120px]">
                      {session.user.name || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {(session.user as any).role?.toLowerCase() || 'user'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-indigo-600 text-sm font-medium px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="flex items-center md:hidden space-x-2">
            <InstallAppButton />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-500 hover:text-indigo-600 focus:outline-none transition rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-2 shadow-inner">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition ${
                isActive(link.path)
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session?.user ? (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="px-3 py-2 flex items-center space-x-2">
                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{session.user.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{(session.user as any).role?.toLowerCase()}</div>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
              >
                Dashboard
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  Admin Panel
                </Link>
              )}

              <Link
                href="/listings/create"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              >
                Post Listing
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-2 text-slate-600 hover:bg-slate-50 rounded-md transition text-base font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition text-base font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
