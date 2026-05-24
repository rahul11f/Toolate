'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LayoutGrid, Save, ArrowLeft, Loader2, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerText, setFooterText] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [adsenseId, setAdsenseId] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Authorization check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setHeroTitle(data.heroTitle || '');
          setHeroSubtitle(data.heroSubtitle || '');
          setFooterText(data.footerText || '');
          setMetaTitle(data.metaTitle || '');
          setMetaDescription(data.metaDescription || '');
          setAdsenseId(data.adsenseId || '');
          setMaintenanceMode(!!data.maintenanceMode);
        } else {
          toast.error('Failed to load settings.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to contact database.');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/');
      } else {
        loadSettings();
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroTitle,
          heroSubtitle,
          footerText,
          metaTitle,
          metaDescription,
          adsenseId,
          maintenanceMode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Site settings updated successfully!');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Loading Administration Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Site CMS Configuration</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage landing text copy, metadata, footers and global ads.</p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Landing Hero Section Details */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Landing Page Hero Header</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hero Main Title</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Find Your Next Home, Flat or Shop Without Brokerage"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hero Subtitle</label>
            <textarea
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Search vetted listings for houses, flats, PGs, and commercial spaces."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y text-slate-650"
            />
          </div>
        </div>

        {/* Global Configuration */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-500" />
            <span>SEO Headers & Dynamic Footer</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">SEO Meta Title Prefix</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Toolate - House, Flat, PG & Shop Listings"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">AdSense Publisher ID</label>
              <input
                type="text"
                value={adsenseId}
                onChange={(e) => setAdsenseId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">SEO Meta Description</label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Completely free-to-use directory listing for rental and sale properties..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition resize-y text-slate-650"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Footer Copyright text copy</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Toolate Inc. All rights reserved. Built completely on Free Tier APIs."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
            />
          </div>
        </div>

        {/* Maintenance Toggle */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl self-start">
              <ShieldAlert className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Site Maintenance Toggle</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Enable this to temporarily display a maintenance page to all users except system admins. Use when uploading major schemas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-14 h-7.5 rounded-full p-1 transition-all duration-300 ${
              maintenanceMode ? 'bg-rose-600 justify-end' : 'bg-slate-200 justify-start'
            } flex items-center cursor-pointer`}
          >
            <span className="w-5.5 h-5.5 bg-white rounded-full shadow-md transition-all duration-300" />
          </button>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-755 text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer disabled:bg-slate-300"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Config Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
