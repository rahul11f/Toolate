'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, PlusCircle, Building, LogOut, LayoutDashboard, Settings, User, Bell } from 'lucide-react';
import InstallAppButton from './InstallAppButton';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Poll notifications
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(timer);
    }
  }, [status]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked read');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: 'Browse Listings', path: '/listings' },
    { label: 'Free Tools', path: '/tools' },
    { label: 'Market Insights', path: '/insights' },
    { label: 'About Us', path: '/about' },
  ];

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition">
              <img src="/images/logo.png" alt="Toolate Logo" loading="eager" fetchPriority="high" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
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
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    type="button"
                    className="p-2 text-slate-500 hover:text-indigo-650 transition rounded-lg hover:bg-slate-50 cursor-pointer relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Recent Alerts</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            type="button"
                            className="text-[10px] text-indigo-600 hover:text-indigo-755 font-bold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-400 font-semibold text-center py-6">No notifications yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 space-y-2.5">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markOneRead(n.id)}
                              className={`pt-2.5 first:pt-0 cursor-pointer group text-left ${
                                !n.read ? 'bg-indigo-50/20 px-2 py-1.5 rounded-lg border border-indigo-100/10' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`text-xs font-bold ${!n.read ? 'text-indigo-950 font-black' : 'text-slate-700'}`}>
                                  {n.title}
                                </h5>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-1">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href="/listings/create"
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Listing</span>
                </Link>

                {/* Profile Settings & User Avatar Premium Dropdown */}
                <div className="relative flex items-center pl-2 border-l border-slate-200" ref={profileDropdownRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    type="button"
                    className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-50 transition cursor-pointer select-none border border-transparent hover:border-slate-100"
                  >
                    <UserAvatar
                      image={session.user.image}
                      name={session.user.name || 'User'}
                      sizeClassName="w-8 h-8"
                      fallbackClassName="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-extrabold text-xs shadow-xs"
                    />
                    <div className="flex flex-col items-start text-left max-w-[100px] hidden lg:flex">
                      <span className="text-xs font-bold text-slate-700 truncate w-full">
                        {session.user.name || 'User'}
                      </span>
                      <span className="text-[9px] text-slate-400 capitalize font-bold leading-none mt-0.5">
                        {(session.user as any).role?.toLowerCase() || 'user'}
                      </span>
                    </div>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 top-11 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 divide-y divide-slate-100">
                      {/* User Header */}
                      <div className="px-3 py-2.5">
                        <div className="text-xs font-bold text-slate-800 truncate">{session.user.name || 'User'}</div>
                        <div className="text-[10px] text-slate-450 font-medium truncate mt-0.5">{session.user.email}</div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-2 border ${
                          isAdmin ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-250'
                        }`}>
                          {(session.user as any).role}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-650 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=profile"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-655 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile Settings</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-650 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Admin Console</span>
                          </Link>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-650 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-slate-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-indigo-600 text-xs font-bold px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-700 hover:to-violet-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
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
                <UserAvatar
                  image={session.user.image}
                  name={session.user.name || 'User'}
                  sizeClassName="w-8 h-8"
                  fallbackClassName="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-extrabold text-xs shadow-xs"
                />
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

              <Link
                href="/dashboard?tab=profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition"
              >
                Profile Settings & Deletion
              </Link>

              <Link
                href="/dashboard?tab=profile"
                onClick={() => {
                  setIsOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-55 hover:text-indigo-650 transition cursor-pointer flex items-center justify-between"
              >
                <span>Alerts & Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
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
