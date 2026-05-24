'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Camera, Loader2, Save } from 'lucide-react';

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

  const {
    register,
    handleSubmit,
    setValue,
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

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-755 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-300 disabled:shadow-none select-none cursor-pointer"
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
