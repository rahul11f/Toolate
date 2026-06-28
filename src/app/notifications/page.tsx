'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/notifications');
    }
  }, [status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
      const userId = (session.user as any).id;

      if (userId) {
        const channel = supabaseClient
          .channel('realtime-notifications-page')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'Notification',
              filter: `userId=eq.${userId}`,
            },
            (payload: any) => {
              setNotifications((prev) => [payload.new, ...prev]);
            }
          )
          .subscribe();

        return () => {
          supabaseClient.removeChannel(channel);
        };
      }
    }
  }, [status, session]);

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

  const markOneRead = async (id: string, read: boolean) => {
    if (read) return;
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Alerts & Notifications</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              You're all caught up! No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id, n.read)}
                  className={`p-5 transition hover:bg-slate-50 cursor-pointer ${
                    !n.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm font-bold ${!n.read ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-3">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
