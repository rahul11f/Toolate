'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ThumbsUp, Send, CheckCircle2, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ListingQAProps {
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
}

interface QAItem {
  id: string;
  listingId: string;
  askedBy: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  upvotes: number;
  createdAt: string;
  user: {
    name: string | null;
  };
}

export default function ListingQA({ listingId, isOwner, isAuthenticated }: ListingQAProps) {
  const [qas, setQas] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<Record<string, boolean>>({});

  const fetchQAs = async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}/qa`);
      if (res.ok) {
        const data = await res.json();
        setQas(data);
      }
    } catch (err) {
      console.error('Failed to load QAs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQAs();
  }, [listingId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (res.ok) {
        toast.success('Question posted successfully!');
        setNewQuestion('');
        fetchQAs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to post question.');
      }
    } catch (err) {
      toast.error('Network error. Failed to post.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handlePostAnswer = async (questionId: string) => {
    const answerText = answers[questionId];
    if (!answerText || !answerText.trim()) return;

    setSubmittingAnswer((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch(`/api/listings/${listingId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer: answerText }),
      });

      if (res.ok) {
        toast.success('Answer submitted successfully!');
        setAnswers((prev) => ({ ...prev, [questionId]: '' }));
        fetchQAs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to post answer.');
      }
    } catch (err) {
      toast.error('Network error. Failed to save answer.');
    } finally {
      setSubmittingAnswer((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!isAuthenticated) {
      toast.error('Sign in to upvote questions.');
      return;
    }

    try {
      const res = await fetch(`/api/listings/${listingId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, action: 'upvote' }),
      });

      if (res.ok) {
        setQas((prev) =>
          prev.map((item) =>
            item.id === questionId ? { ...item, upvotes: item.upvotes + 1 } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
      <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-50 pb-2">
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        <span>Public Q&A Forum</span>
      </h3>

      {/* Ask Question Form */}
      {isAuthenticated ? (
        !isOwner ? (
          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask the landlord a public question (e.g. 'Is there a geyser?', 'What is the maintenance fee?')"
              className="flex-grow bg-slate-50 border border-slate-200 focus:border-indigo-500 text-xs px-4 py-3 rounded-xl outline-hidden transition text-slate-700 font-medium"
            />
            <button
              type="submit"
              disabled={submittingQuestion || !newQuestion.trim()}
              className="bg-indigo-650 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl transition flex items-center justify-center font-bold text-xs gap-1 disabled:bg-slate-200 disabled:text-slate-400 select-none cursor-pointer"
            >
              {submittingQuestion ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask</span>
            </button>
          </form>
        ) : (
          <div className="text-xs bg-slate-50 text-slate-450 border border-slate-150 p-3 rounded-xl font-semibold">
            📢 You are the owner. You can answer tenant questions below.
          </div>
        )
      ) : (
        <div className="p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-450">
          <span>Have a question about this listing? Sign in to ask publicly.</span>
          <Link href="/login" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition">
            Login
          </Link>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="flex justify-center items-center py-6 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : qas.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
          No questions have been asked yet. Feel free to ask the first question!
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {qas.map((item) => (
            <div key={item.id} className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      Q
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.question}</h4>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold pl-6">
                    Asked by {item.user?.name || 'User'} &bull; {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleUpvote(item.id)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-200 rounded-lg px-2 py-1 transition shrink-0"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{item.upvotes}</span>
                </button>
              </div>

              {/* Answer display */}
              {item.answer ? (
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 ml-6 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-extrabold uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Answer from Landlord / Roommate</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{item.answer}</p>
                  <span className="text-[9px] text-slate-400 font-semibold block pt-0.5">
                    Replied on {new Date(item.answeredAt || '').toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <div className="ml-6">
                  {isOwner ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={answers[item.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [item.id]: e.target.value })}
                          placeholder="Type your reply here..."
                          className="flex-grow bg-white border border-slate-200 focus:border-indigo-500 text-xs px-3 py-2 rounded-xl outline-hidden text-slate-700 font-semibold"
                        />
                        <button
                          onClick={() => handlePostAnswer(item.id)}
                          disabled={submittingAnswer[item.id] || !(answers[item.id] || '').trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                        >
                          {submittingAnswer[item.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Reply</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-600 font-bold bg-amber-50/50 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Awaiting landlord's reply</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
