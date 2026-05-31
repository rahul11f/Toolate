'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Camera, Loader2, Save, ShieldCheck, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

type ProfileFormFields = z.infer<typeof profileFormSchema>;

export default function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || '');

  // Identity Verification States
  const [docVerified, setDocVerified] = useState(false);
  const [docStatus, setDocStatus] = useState('UNVERIFIED');
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);

  // New strict verification form states
  const [docType, setDocType] = useState('AADHAAR');
  const [legalName, setLegalName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setDocVerified(data.user.documentVerified);
            setDocStatus(data.user.documentStatus);
          }
        }
      } catch (err) {
        console.error('Failed to fetch verification status', err);
      }
    }
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      toast.success(`Attached document: ${files[0].name}`);
    }
  };

  const handleIdVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim() || !idNumber.trim()) {
      toast.error('Please enter your Legal Name and ID Number.');
      return;
    }
    if (!selectedFile) {
      toast.error('Please upload a scan or photograph of your ID document.');
      return;
    }

    const currentProfileName = getValues('name') || '';
    if (currentProfileName.toLowerCase().replace(/\s+/g, ' ').trim() !== legalName.toLowerCase().replace(/\s+/g, ' ').trim()) {
      toast.error(`Verification alert: Legal Name must match your display name ("${currentProfileName}") exactly.`);
      return;
    }

    if (docType === 'AADHAAR' && !/^\d{12}$/.test(idNumber)) {
      toast.error('Aadhaar number must be exactly 12 numeric digits.');
      return;
    } else if (docType === 'PASSPORT' && !/^[A-Z0-9]{8,9}$/i.test(idNumber)) {
      toast.error('Passport number must be 8 to 9 alphanumeric characters.');
      return;
    } else if (docType === 'VOTER_ID' && !/^[A-Z]{3}\d{7}$/i.test(idNumber)) {
      toast.error('Voter ID must match EPIC format (e.g. ABC1234567).');
      return;
    }

    setVerifying(true);
    setVerifyProgress(0);

    // Simulate progress bar checking
    const interval = setInterval(() => {
      setVerifyProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      // 1. Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        clearInterval(interval);
        toast.error(uploadData.error || 'Failed to upload document image.');
        setVerifying(false);
        return;
      }
      const documentUrl = uploadData.urls[0];

      // 2. Submit verify request
      const res = await fetch('/api/user/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          legalName,
          idNumber,
          documentUrl,
        }),
      });

      const data = await res.json();
      clearInterval(interval);
      setVerifyProgress(100);

      if (!res.ok) {
        toast.error(data.error || 'Failed to verify ID.');
        setVerifying(false);
      } else {
        setTimeout(() => {
          setDocVerified(true);
          setDocStatus('VERIFIED');
          setVerifying(false);
          toast.success('Identity document verified successfully!');
        }, 300);
      }
    } catch (err) {
      clearInterval(interval);
      toast.error('An error occurred during verification.');
      setVerifying(false);
    }
  };

  const handleResetVerification = async () => {
    if (!confirm('Are you sure you want to reset your identity verification? You will lose your Trusted Identity badge and will need to upload a new document to apply for ID-locked properties.')) {
      return;
    }

    try {
      const res = await fetch('/api/user/verify-id', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setDocVerified(false);
        setDocStatus('UNVERIFIED');
        setSelectedFile(null);
        setIdNumber('');
        setLegalName('');
        toast.success('Verification reset! You can now upload a new document.');
      } else {
        toast.error(data.error || 'Failed to reset verification.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('🚨 WARNING: Are you sure you want to delete your account permanently? This action CANNOT be undone and will delete all your listings, reviews, and profile data.')) {
      return;
    }
    if (!confirm('FINAL CONFIRMATION: Do you really want to permanently delete your account?')) {
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Account deleted successfully. Logging you out...');
        window.location.href = '/';
      } else {
        toast.error(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormFields>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload image.');
      } else {
        const uploadedUrl = data.urls[0];
        setAvatarUrl(uploadedUrl);
        toast.success('Avatar uploaded! Click Save to apply.');
      }
    } catch (err) {
      toast.error('Failed to complete upload.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormFields) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          image: avatarUrl,
          password: data.password || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to update profile.');
      } else {
        toast.success('Profile updated successfully!');
        // Update next-auth session client-side
        await updateSession({
          name: result.user.name,
          image: result.user.image,
        });
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-800">Profile Settings</h3>
        <p className="text-slate-400 text-xs mt-1 font-medium">Update your profile details and security password.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0 pb-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-500 font-extrabold text-3xl shadow-md">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-all active:scale-90">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">Profile Avatar</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-xs font-medium">
              Upload a clear JPEG, PNG, or WEBP photo. Max file size is 2MB.
            </p>
          </div>
        </div>

        {/* Email (Read-Only) */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Email Address (Non-changeable)</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-sm pl-10 pr-4 py-2.5 rounded-xl cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              {...register('name')}
              placeholder="Your full name"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
          )}
          {docVerified && (
            <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Note: Editing your name will automatically revoke your Verified ID badge, requiring re-verification.</span>
            </p>
          )}
        </div>

        {/* Government ID Verification */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span>Government ID Verification</span>
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            Verify your identity with an official government ID card (Aadhaar, Passport, Voter ID) to apply for verified homestays and display a trusted badge on your profile.
          </p>

          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Verification Status:</span>
              {docVerified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-100">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>NOT VERIFIED</span>
                </span>
              )}
            </div>

            {docVerified ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-500 font-medium max-w-md">
                  Your identity is fully verified. You can now view host details and book visits on ID-locked homestay listings.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/60 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Trusted Identity Badge Active</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetVerification}
                    className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-100 font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition cursor-pointer select-none active:scale-95"
                  >
                    Reset & Upload New ID
                  </button>
                </div>
              </div>
            ) : verifying ? (
              <div className="py-4 max-w-md space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Scanning & validating document credentials...</span>
                  <span>{verifyProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-100"
                    style={{ width: `${verifyProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-500 font-medium">
                  Please provide details from your physical document. The details will be matched against your profile display name, and the document scan will be securely uploaded.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-indigo-500 transition font-semibold"
                    >
                      <option value="AADHAAR">Aadhaar Card (12 digits)</option>
                      <option value="PASSPORT">Passport (8-9 alphanumeric)</option>
                      <option value="VOTER_ID">Voter ID (EPIC format)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legal Name on ID</label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Must match display name exactly"
                      className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-indigo-500 transition font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ID Number</label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder={
                        docType === 'AADHAAR' 
                          ? 'e.g. 123456789012' 
                          : docType === 'PASSPORT' 
                          ? 'e.g. A1234567' 
                          : 'e.g. ABC1234567'
                      }
                      className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl outline-hidden focus:border-indigo-500 transition font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-100 p-4 rounded-xl shadow-2xs">
                  <label className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-750 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition select-none active:scale-95 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload ID Scan / Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <div className="text-[11px] text-slate-400 font-semibold truncate flex-grow">
                    {selectedFile ? `Attached: ${selectedFile.name} (${(selectedFile.size/1024).toFixed(1)} KB)` : 'No file chosen (Accepts JPG, PNG, WEBP max 2MB).'}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleIdVerifySubmit}
                    disabled={verifying}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer transition select-none active:scale-95 disabled:bg-slate-350 disabled:shadow-none"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Identity Documents</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Security & Password</h4>
          <p className="text-xs text-slate-400 font-medium">Leave password fields blank if you do not wish to change your password.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-hidden transition"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 font-semibold">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-bold text-rose-600 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Danger Zone</span>
          </h4>
          <p className="text-xs text-slate-400 font-medium">Permanently delete your account and all associated listings from the system.</p>
          
          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <h5 className="font-extrabold text-rose-900 text-xs uppercase tracking-wider">Permanent Account Deletion</h5>
              <p className="text-xs text-rose-700 font-medium max-w-md leading-normal">
                Once deleted, your account details, listings, booking slots, and review feedback records will be purged immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer select-none active:scale-95 shrink-0"
            >
              Delete My Account
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-300 disabled:shadow-none select-none cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
