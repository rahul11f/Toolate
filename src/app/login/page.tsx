'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

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

  const authError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Invalid email or password.');
      } else {
        toast.success('Successfully logged in!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      toast.error('Could not authenticate with Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Sign In to Toolate
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back! Browse and publish your properties.
          </p>
        </div>

        {authError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Authentication failed.{' '}
              {authError === 'CredentialsSignin'
                ? 'Invalid email or password.'
                : 'An error occurred during sign in.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Email Address
            </label>

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
              <p className="text-xs text-rose-500 font-semibold">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Password
            </label>

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
              <p className="text-xs text-rose-500 font-semibold">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
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
          className="w-full flex items-center justify-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.7 0 3.16.69 4.24 1.81l3.24-3.24C19.34 2.82 15.97 1.5 12.24 1.5 6.44 1.5 1.74 6.2 1.74 12s4.7 10.5 10.5 10.5c5.78 0 10.15-3.9 10.15-10.285 0-.61-.05-1.22-.16-1.715H12.24z"
            />
          </svg>
          <span>
            {googleLoading ? 'Redirecting to Google...' : 'Google Accounts'}
          </span>
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}