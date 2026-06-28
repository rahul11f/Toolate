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
  const [returnMessage, setReturnMessage] = useState('');

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
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={returnMessage}
            onChange={(e) => setReturnMessage(e.target.value)}
            placeholder="Optional message to tenant..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400 text-slate-700 bg-white"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('CONFIRMED')}
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm</span>
            </button>
            <button
              onClick={() => handleAction('CANCELLED')}
              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
