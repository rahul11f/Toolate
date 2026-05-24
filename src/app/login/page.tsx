'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFields = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configurable seeded credentials
  const adminEmail = process.env.NEXT_PUBLIC_SEED_ADMIN_EMAIL || 'admin@toolate.com';
  const adminPassword = process.env.NEXT_PUBLIC_SEED_ADMIN_PASSWORD || 'Admin@123';
  const userEmail = process.env.NEXT_PUBLIC_SEED_USER_EMAIL || 'user@toolate.com';
  const userPassword = process.env.NEXT_PUBLIC_SEED_USER_PASSWORD || 'User@123';

  // Check if there was a redirection auth error
  const authError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    toast.success('Credentials filled! Ready to login.');
  };

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error || 'Invalid credentials. Please try again.');
      } else {
        toast.success('Successfully logged in!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      toast.error('Could not authenticate with Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sign In to Toolate</h2>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back! Browse and publish your properties.
          </p>
        </div>

        {authError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Authentication failed. {authError === 'CredentialsSignin' ? 'Invalid email or password.' : 'An error occurred during sign in.'}
            </span>
          </div>
        )}

        {/* Quick Autofill Seeded Credentials */}
        <div className="bg-indigo-50/40 border border-indigo-100/70 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <span>🔑</span> Quick Test Accounts
            </span>
            <span className="text-[10px] bg-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Click to Auto-fill
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillCredentials(adminEmail, adminPassword)}
              className="text-left bg-white hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 p-2.5 rounded-xl transition-all duration-200 shadow-xs hover:shadow-sm active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 mb-1 text-slate-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-650 group-hover:scale-105 transition-transform" />
                <span className="text-xs">Admin Portal</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{adminEmail}</p>
              <p className="text-[10px] text-indigo-650 font-semibold mt-0.5">Pass: {adminPassword}</p>
            </button>
            
            <button
              type="button"
              onClick={() => fillCredentials(userEmail, userPassword)}
              className="text-left bg-white hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 p-2.5 rounded-xl transition-all duration-200 shadow-xs hover:shadow-sm active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 mb-1 text-slate-800 font-bold">
                <User className="w-3.5 h-3.5 text-indigo-650 group-hover:scale-105 transition-transform" />
                <span className="text-xs">Regular User</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{userEmail}</p>
              <p className="text-[10px] text-indigo-650 font-semibold mt-0.5">Pass: {userPassword}</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-3 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-3 rounded-xl outline-hidden transition"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-755 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-300 disabled:shadow-none select-none cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider before:content-[''] before:flex-grow before:border-t before:border-slate-100 before:mr-3 after:content-[''] after:flex-grow after:border-t after:border-slate-100 after:ml-3">
          Or Continue With
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          type="button"
          className="w-full flex items-center justify-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition cursor-pointer select-none active:scale-[0.98] disabled:border-slate-100 disabled:text-slate-350"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.7 0 3.16.69 4.24 1.81l3.24-3.24C19.34 2.82 15.97 1.5 12.24 1.5 6.44 1.5 1.74 6.2 1.74 12s4.7 10.5 10.5 10.5c5.78 0 10.15-3.9 10.15-10.285 0-.61-.05-1.22-.16-1.715H12.24z"
            />
          </svg>
          <span>{googleLoading ? 'Redirecting to Google...' : 'Google Accounts'}</span>
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
