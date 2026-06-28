'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationActionsProps {
  notificationId: string;
  type?: string | null;
  actionData?: string | null;
  onActionComplete?: () => void;
}

export default function NotificationActions({ notificationId, type, actionData, onActionComplete }: NotificationActionsProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (type !== 'VIEWING_REQUEST' || !actionData || completed) {
    return null;
  }

  let data: any = null;
  try {
    data = JSON.parse(actionData);
  } catch (e) {
    return null;
  }

  const { bookingId, listingId } = data;
  if (!bookingId || !listingId) return null;

  const handleAction = async (status: 'CONFIRMED' | 'CANCELLED') => {
    const returnMessage = prompt(`Enter a message for the tenant (optional):`);
    if (returnMessage === null) return; // User cancelled prompt

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/viewings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status, returnMessage }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to update booking');
      } else {
        toast.success(`Booking ${status.toLowerCase()} successfully!`);
        setCompleted(true);
        if (onActionComplete) onActionComplete();
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      {loading ? (
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
      ) : (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction('CONFIRMED'); }}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Confirm</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction('CANCELLED'); }}
            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </>
      )}
    </div>
  );
}
