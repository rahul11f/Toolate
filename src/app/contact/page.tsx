'use client';

import { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Message sent! Thank you.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        toast.error(data.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to send.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-650 border border-indigo-100">
          📬 Contact Us & Support
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Have Questions or Suggestions? <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">We would love to hear from you</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Send us feedback, query reports, or feature suggestions. Our moderators check inbox logs daily.
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-8 space-y-6 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_40%)]" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-xl font-bold">Contact Information</h3>
              <p className="text-slate-350 text-xs font-medium leading-relaxed">
                Toolate is a fully direct directory listing platform. If you have suggestions or want to report listings, use the form or email us directly.
              </p>
            </div>

            <div className="relative z-10 space-y-4 text-sm font-medium">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">Office Address</h4>
                  {loading ? (
                    <div className="h-3.5 w-full max-w-[220px] bg-indigo-500/20 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-slate-300 text-xs mt-0.5 break-words leading-relaxed">{settings?.officeAddress || 'Prestige Tech Park, Outer Ring Rd, Bangalore, KA, India'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">Email Us</h4>
                  {loading ? (
                    <div className="h-3.5 w-36 bg-indigo-500/20 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-slate-300 text-xs mt-0.5 hover:text-white transition break-all">{settings?.helpEmail || 'support@toolate.com'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-grow min-w-0">
                  <h4 className="text-slate-200 text-xs font-bold uppercase tracking-wider">Call Support</h4>
                  {loading ? (
                    <div className="h-3.5 w-32 bg-indigo-500/20 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-slate-300 text-xs mt-0.5 break-all">{settings?.supportPhone || '+91 80 4455 6677'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs space-y-1 font-medium">
              <h4 className="font-bold">Avoid Scam Payments</h4>
              <p className="leading-relaxed text-amber-700">
                Toolate does not charge any brokerages or booking fees. Never transfer deposits online without inspecting rooms/properties in person.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Form Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span>Send Message</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Suggestion: add PG facilities filter option"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your suggestion, query, or listing report details here..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y text-slate-650"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting suggestion...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Query / Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
