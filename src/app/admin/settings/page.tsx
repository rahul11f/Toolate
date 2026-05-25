'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LayoutGrid, Save, ArrowLeft, Loader2, Settings, ShieldAlert, Sparkles, Mail, Phone, MapPin, KeyRound, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cms' | 'contact' | 'security'>('cms');

  // Form states
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerText, setFooterText] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [adsenseId, setAdsenseId] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Dynamic Contact States
  const [helpEmail, setHelpEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [whatsappSupport, setWhatsappSupport] = useState('');

  // Password reset states
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

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
          setHelpEmail(data.helpEmail || '');
          setSupportEmail(data.supportEmail || '');
          setOfficeAddress(data.officeAddress || '');
          setSupportPhone(data.supportPhone || '');
          setWhatsappSupport(data.whatsappSupport || '');
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
          helpEmail,
          supportEmail,
          officeAddress,
          supportPhone,
          whatsappSupport,
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      toast.error('Password cannot be empty.');
      return;
    }
    if (adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (adminPassword !== confirmAdminPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Admin credentials updated successfully! Use your new password at next sign-in.');
        setAdminPassword('');
        setConfirmAdminPassword('');
      } else {
        toast.error(data.error || 'Failed to update credentials.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to reset password.');
    } finally {
      setUpdatingPassword(false);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Settings className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Site CMS Configuration</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage landing text copy, support emails, coordinates, and secure passwords.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cms')}
          className={`py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition select-none flex items-center gap-2 ${
            activeTab === 'cms'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-indigo-600 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Landing page & CMS</span>
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition select-none flex items-center gap-2 ${
            activeTab === 'contact'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-indigo-600 hover:border-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Support Contact Info</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition select-none flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-550 hover:text-indigo-600 hover:border-slate-300'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Admin Password Reset</span>
        </button>
      </div>

      {/* CMS Tab Panel */}
      {activeTab === 'cms' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Landing Hero Section Details */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6">
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
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6">
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
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
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
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer disabled:bg-slate-300"
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
      )}

      {/* Support Info Tab Panel */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <span>Support Channels & Coordinates</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Help Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={helpEmail}
                    onChange={(e) => setHelpEmail(e.target.value)}
                    placeholder="support@toolate.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Feedback & Suggestion Email</label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="info@toolate.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Call Support Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+91 80 4455 6677"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">WhatsApp Support Number</label>
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.706 1.458h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <input
                    type="text"
                    value={whatsappSupport}
                    onChange={(e) => setWhatsappSupport(e.target.value)}
                    placeholder="+91 80 4455 6677"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Office Physical Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  placeholder="Prestige Tech Park, Bangalore, KA, India"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer disabled:bg-slate-300"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Coordinates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Contact Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Security Admin Password Reset Panel */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordUpdate} className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              <span>Reset Administrator Password</span>
            </h3>
            <p className="text-xs text-slate-450 font-medium">
              You are currently logged in as administrator. Use the form below to change your active login credentials instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">New Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2.5 rounded-xl outline-hidden transition font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatingPassword}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition select-none cursor-pointer disabled:bg-slate-300"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
