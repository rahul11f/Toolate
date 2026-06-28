'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Mail, Lock, KeyRound, Check, ArrowRight } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const requireOtp = process.env.NEXT_PUBLIC_REQUIRE_OTP === 'true';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // 1. Send OTP verification email (for OTP-enabled signups)
  const handleRequestOtp = async (data: SignupFields) => {
    setOtpSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to send OTP.');
      } else {
        toast.success(result.message || 'Verification code sent to your email.');
        if (result.devOtp) {
          toast(`[Dev Mode] Auto-filling OTP: ${result.devOtp}`, {
            icon: '🔧',
            duration: 6000,
          });
          setOtp(result.devOtp);
        }
        setStep('otp');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Direct Registration (for standard credentials flow)
  const handleRegisterDirectly = async (data: SignupFields) => {
    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          otp: '',
          recaptchaToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Registration failed.');
      } else {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstStepSubmit = async (data: SignupFields) => {
    if (requireOtp) {
      await handleRequestOtp(data);
    } else {
      await handleRegisterDirectly(data);
    }
  };

  // Helper to resolve reCAPTCHA token
  const getRecaptchaToken = (): Promise<string> => {
    return new Promise((resolve) => {
      const grecaptcha = (window as any).grecaptcha;
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

      if (!siteKey) {
        resolve('bypass-site-key-missing');
        return;
      }

      if (!grecaptcha) {
        // If adblocker blocks the script, just bypass instead of breaking the flow
        resolve('bypass-script-blocked');
        return;
      }

      // Add a timeout to prevent indefinite buffering if recaptcha hangs
      const timeoutId = setTimeout(() => {
        resolve('bypass-recaptcha-timeout');
      }, 3000); // 3 seconds max

      try {
        grecaptcha.ready(() => {
          grecaptcha
            .execute(siteKey, { action: 'signup' })
            .then((token: string) => {
              clearTimeout(timeoutId);
              resolve(token);
            })
            .catch(() => {
              clearTimeout(timeoutId);
              resolve('bypass-recaptcha-error');
            });
        });
      } catch (e) {
        clearTimeout(timeoutId);
        resolve('bypass-recaptcha-exception');
      }
    });
  };

  // 2. Final verification and submission (OTP flow)
  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken();
      const { name, email, password } = getValues();

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          otp,
          recaptchaToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Registration failed.');
      } else {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic script loading Google reCAPTCHA v3 */}
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            {step === 'details'
              ? (requireOtp ? 'Join Toolate to browse properties and post ads.' : 'Create an account to start listing and browsing properties.')
              : 'Enter the verification code sent to your email.'}
          </p>
        </div>

        {step === 'details' ? (
          <form key="signup-details-form" onSubmit={handleSubmit(handleFirstStepSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-3 rounded-xl outline-hidden transition"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
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
              disabled={otpSending || loading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-300 select-none cursor-pointer"
            >
              <span>
                {requireOtp
                  ? (otpSending ? 'Sending Code...' : 'Request Verification Code')
                  : (loading ? 'Creating Account...' : 'Create Account')
                }
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form key="signup-otp-form" onSubmit={handleFinalSignup} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Verification OTP</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-3 rounded-xl outline-hidden tracking-[0.25em] text-center font-bold transition placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-405"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate-400 font-medium">
                  Sent verification code to <span className="font-bold text-slate-600">{getValues('email')}</span>
                </p>
                <button
                  type="button"
                  onClick={() => handleRequestOtp(getValues())}
                  disabled={otpSending}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 cursor-pointer select-none transition"
                >
                  {otpSending ? 'Resending...' : 'Resend'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={loading}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition cursor-pointer select-none"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex items-center justify-center space-x-2 bg-indigo-650 hover:bg-indigo-755 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:bg-slate-350 select-none cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Verify & Register'}</span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
