'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  listingId: string;
}

export default function ReviewForm({ listingId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [responsiveness, setResponsiveness] = useState(5);
  const [honesty, setHonesty] = useState(5);
  const [maintenance, setMaintenance] = useState(5);
  const [depositReturn, setDepositReturn] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating, 
          comment,
          responsiveness,
          honesty,
          maintenance,
          depositReturn,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Review submitted successfully!');
        setComment('');
        setRating(5);
        setResponsiveness(5);
        setHonesty(5);
        setMaintenance(5);
        setDepositReturn(5);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 border border-slate-100 p-5 rounded-2xl">
      <h4 className="font-bold text-slate-800 text-sm">Write a Review</h4>
      
      {/* Star Selector */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Rating</label>
        <div className="flex space-x-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = hoverRating !== null ? star <= hoverRating : star <= rating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="focus:outline-hidden cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 transition ${
                    isActive ? 'text-amber-500 fill-amber-500 scale-105' : 'text-slate-300 hover:scale-105'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 my-2 text-xs font-semibold text-slate-700">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Landlord Responsiveness</span>
            <span className="text-indigo-650 font-bold font-mono">{responsiveness} / 5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            value={responsiveness}
            onChange={(e) => setResponsiveness(parseInt(e.target.value))}
            className="w-full accent-indigo-650 h-1 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Honesty & Clarity</span>
            <span className="text-indigo-650 font-bold font-mono">{honesty} / 5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            value={honesty}
            onChange={(e) => setHonesty(parseInt(e.target.value))}
            className="w-full accent-indigo-655 h-1 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Property Maintenance</span>
            <span className="text-indigo-650 font-bold font-mono">{maintenance} / 5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            value={maintenance}
            onChange={(e) => setMaintenance(parseInt(e.target.value))}
            className="w-full accent-indigo-650 h-1 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Deposit Return Ease</span>
            <span className="text-indigo-655 font-bold font-mono">{depositReturn} / 5</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            value={depositReturn}
            onChange={(e) => setDepositReturn(parseInt(e.target.value))}
            className="w-full accent-indigo-655 h-1 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Review input */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Comment</label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was your experience with this property or landlord?"
          className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden transition resize-y text-slate-650"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition select-none cursor-pointer disabled:bg-slate-300"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Post Review</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
