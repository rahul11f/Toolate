'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageSquare, ArrowLeft, Loader2, Calendar, Mail, User, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  // Feedback Reply states
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  // Authorization check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch feedback records
  useEffect(() => {
    async function loadFeedback() {
      try {
        const res = await fetch('/api/feedback');
        if (res.ok) {
          const data = await res.json();
          setFeedback(data);
        } else {
          toast.error('Failed to load feedback records.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to contact server database.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/');
      } else {
        loadFeedback();
      }
    }
  }, [status, session, router]);

  const handleReplyInputChange = (id: string, value: string) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleStartEditReply = (id: string, currentReply: string) => {
    setEditingReplyId(id);
    setReplyInputs((prev) => ({ ...prev, [id]: currentReply }));
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
  };

  const submitReply = async (id: string) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) return;

    setSubmittingReplyId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: text }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Reply saved successfully!');
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, reply: data.feedback.reply, repliedAt: data.feedback.repliedAt }
              : item
          )
        );
        setEditingReplyId(null);
        setReplyInputs((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        toast.error(data.error || 'Failed to submit reply.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while sending your reply.');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-650 animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Loading Administration Queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-650 transition gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Panel</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Feedback Inbox</h1>
            <p className="text-slate-500 mt-1 font-medium">Read suggestion forms, platform queries, and user reports.</p>
          </div>
        </div>
      </div>

      {/* Feedback Feed */}
      {feedback.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          No feedback or contact messages have been received yet.
        </div>
      ) : (
        <div className="space-y-6">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-50 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-indigo-655 tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                    Subject
                  </span>
                  <h3 className="font-bold text-slate-850 text-base">{item.subject}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-3 py-1 rounded-md shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* User Metadata info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>From: <strong className="text-slate-800 font-bold">{item.name}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email: <a href={`mailto:${item.email}`} className="text-indigo-600 hover:underline">{item.email}</a></span>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-slate-650 text-sm font-medium leading-relaxed whitespace-pre-line">
                  {item.message}
                </p>
              </div>

              {/* Admin Reply Details */}
              {item.reply && editingReplyId !== item.id && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-700">
                    <span>Admin Reply</span>
                    {item.repliedAt && <span>{new Date(item.repliedAt).toLocaleString()}</span>}
                  </div>
                  <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-line">
                    {item.reply}
                  </p>
                  <button
                    onClick={() => handleStartEditReply(item.id, item.reply || '')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold mt-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Edit Reply
                  </button>
                </div>
              )}

              {/* Admin Reply Form */}
              {(!item.reply || editingReplyId === item.id) && (
                <div className="space-y-3 mt-4 border-t border-slate-50 pt-4">
                  <label className="text-xs uppercase font-extrabold text-slate-450 tracking-wider block">
                    {editingReplyId === item.id ? 'Edit Admin Reply' : 'Send Admin Reply'}
                  </label>
                  <div className="flex flex-col gap-2">
                    <textarea
                      rows={3}
                      value={replyInputs[item.id] || ''}
                      onChange={(e) => handleReplyInputChange(item.id, e.target.value)}
                      placeholder="Type your response to the user query..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y font-medium text-slate-700"
                    />
                    <div className="flex gap-2 justify-end">
                      {editingReplyId === item.id && (
                        <button
                          onClick={handleCancelEditReply}
                          className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => submitReply(item.id)}
                        disabled={submittingReplyId === item.id || !replyInputs[item.id]?.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {submittingReplyId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>{editingReplyId === item.id ? 'Update Reply' : 'Send Reply'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
