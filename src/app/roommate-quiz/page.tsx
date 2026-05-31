'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Check, HelpCircle, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoommateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Quiz states
  const [sleepSchedule, setSleepSchedule] = useState<'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE'>('FLEXIBLE');
  const [cleanliness, setCleanliness] = useState<'MESSY' | 'MODERATE' | 'NEAT_FREAK'>('MODERATE');
  const [guests, setGuests] = useState<'NEVER' | 'WEEKENDS' | 'ANYTIME'>('WEEKENDS');
  const [workStyle, setWorkStyle] = useState<'OFFICE' | 'WFH' | 'STUDENT'>('OFFICE');
  const [smoking, setSmoking] = useState<'SMOKER' | 'NON_SMOKER' | 'TOLERANT'>('NON_SMOKER');
  const [diet, setDiet] = useState<'VEG' | 'NON_VEG' | 'JAIN' | 'EAT_OUT'>('VEG');
  const [noiseTolerance, setNoiseTolerance] = useState<'QUIET' | 'MODERATE' | 'LOUD'>('MODERATE');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    async function loadQuizData() {
      try {
        const res = await fetch('/api/user/roommate-quiz');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setSleepSchedule(p.sleepSchedule || 'FLEXIBLE');
            setCleanliness(p.cleanliness || 'MODERATE');
            setGuests(p.guests || 'WEEKENDS');
            setWorkStyle(p.workStyle || 'OFFICE');
            setSmoking(p.smoking || 'NON_SMOKER');
            setDiet(p.diet || 'VEG');
            setNoiseTolerance(p.noiseTolerance || 'MODERATE');
            setBudget(p.budget ? String(p.budget) : '');
          }
        }
      } catch (err) {
        console.error('Failed to load profile quiz data:', err);
      } finally {
        setFetching(false);
      }
    }
    loadQuizData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const profile = {
      sleepSchedule,
      cleanliness,
      guests,
      workStyle,
      smoking,
      diet,
      noiseTolerance,
      budget: budget ? parseInt(budget) : undefined,
    };

    try {
      const res = await fetch('/api/user/roommate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        throw new Error('Failed to save compatibility quiz.');
      }

      toast.success('Roommate lifestyle quiz saved successfully!');
      router.push('/listings?category=ROOMMATE');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error saving quiz.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-800">
      {/* Back Link */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-655 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Roommate Compatibility Quiz
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Answer 8 quick questions to unlock compatibility percentages with listing owners
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Q1: Sleep Schedule */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>1. Sleep Schedule / Cycles</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'EARLY_BIRD', label: '🌅 Early Bird' },
                { val: 'NIGHT_OWL', label: '🦉 Night Owl' },
                { val: 'FLEXIBLE', label: '🕒 Flexible' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSleepSchedule(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    sleepSchedule === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Cleanliness */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>2. Cleanliness Level</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'MESSY', label: '🧺 Relaxed' },
                { val: 'MODERATE', label: '🧹 Average' },
                { val: 'NEAT_FREAK', label: '✨ Neat Freak' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setCleanliness(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    cleanliness === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Guests */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>3. Visitor / Guest Policy</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'NEVER', label: '🚫 No Guests' },
                { val: 'WEEKENDS', label: '📅 Weekends' },
                { val: 'ANYTIME', label: '👍 Anytime' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setGuests(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    guests === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Work Style */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>4. Profession / Work Style</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'OFFICE', label: '💼 Office-Goer' },
                { val: 'WFH', label: '💻 WFH / Remote' },
                { val: 'STUDENT', label: '🎓 Student' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setWorkStyle(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    workStyle === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q5: Smoking */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>5. Smoking Preferences</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'NON_SMOKER', label: '🚭 Non-Smoker' },
                { val: 'SMOKER', label: '🚬 Smoker' },
                { val: 'TOLERANT', label: '🤝 Tolerant' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSmoking(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    smoking === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q6: Diet */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>6. Food & Cooking Habits</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 'VEG', label: '🌿 Veg' },
                { val: 'NON_VEG', label: '🍗 Meat' },
                { val: 'JAIN', label: '🙏 Jain' },
                { val: 'EAT_OUT', label: '🥡 Order' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDiet(opt.val as any)}
                  className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition select-none cursor-pointer ${
                    diet === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q7: Noise Tolerance */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>7. Noise Level Tolerance</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'QUIET', label: '🤫 Silent' },
                { val: 'MODERATE', label: '🗣️ Average' },
                { val: 'LOUD', label: '🔊 Loud Music' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setNoiseTolerance(opt.val as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition select-none cursor-pointer ${
                    noiseTolerance === opt.val
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q8: Budget */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>8. Max Monthly Budget (₹)</span>
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-lg focus:border-indigo-500 outline-hidden transition font-semibold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm py-3.5 rounded-xl transition shadow-md cursor-pointer select-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Quiz Results...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Profile & Match Roommates</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
