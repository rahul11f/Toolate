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
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Review submitted successfully!');
        setComment('');
        setRating(5);
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
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Rating</label>
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
                    isActive ? 'text-amber-500 fill-amber-500 scale-105' : 'text-slate-305 hover:scale-105'
                  }`}
                />
              </button>
            );
          })}
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
