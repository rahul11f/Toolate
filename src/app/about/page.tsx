import Link from 'next/link';
import { Shield, Sparkles, MapPin, Users, Calculator, FileText, CheckCircle2, Heart } from 'lucide-react';

export const metadata = {
  title: 'About Toolate — Vetted Direct Rentals & Zero Brokerage',
  description: 'Learn about Toolate, India\'s direct-to-landlord, zero brokerage property rental directory. Vetted coordinates, roommate matching, and guest-stay programs.',
};

export default function AboutPage() {
  const benefits = [
    {
      icon: Shield,
      title: '100% Vetted Listings',
      description: 'We check coordinates and run auto-fraud scoring models to block fake broker listings, saving you time.',
    },
    {
      icon: Users,
      title: 'Roommate Compatibility',
      description: 'Find matching roommates using lifestyle profiles and matching logic based on habits and interests.',
    },
    {
      icon: MapPin,
      title: 'Metro & Travel Proximity',
      description: 'Instantly view travel times to your workplace using integrated OpenSource route matrix calculations.',
    },
    {
      icon: Calculator,
      title: 'Move-in Cost Calculator',
      description: 'No hidden charges. Estimate security deposits, maintenance fees, and first-month rent upfront.',
    },
    {
      icon: FileText,
      title: 'Draft Lease Agreements',
      description: 'Generate standard landlord-tenant agreements for free. Print or send for digital signing.',
    },
    {
      icon: Sparkles,
      title: 'AI Description Generator',
      description: 'Landlords can write listing details in seconds using integrated Claude AI text generation models.',
    },
  ];

  const values = [
    {
      title: 'Save ₹15,000+ per Move',
      desc: 'Brokers charge up to 1 month of rent as commission. With Toolate, you deal directly with hosts and pay ₹0 brokerage fees.',
    },
    {
      title: 'Verified Trusted Badges',
      desc: 'Users verify their government IDs to build trust. Listings are marked with clear icons and real coordinates to avoid scam traps.',
    },
    {
      title: 'Homestay Guest Programs',
      desc: 'Traveling on a budget? Stay with local owners in our homestay category. Choose between paid, free, or skills exchange stays.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-805 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 text-xs font-black px-3 py-1.5 rounded-full border border-indigo-500/30 select-none uppercase tracking-wider animate-pulse">
            <Heart className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>The Zero Brokerage Revolution</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Stop Paying Brokers for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-teal-200">
              Just Opening a Door.
            </span>
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base font-semibold max-w-2xl mx-auto leading-relaxed">
            Toolate was built to solve the rental search hassle in India. We connect tenants directly with landlords and roommates with flatmates—all with verified details and zero fees.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/listings"
              className="bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-lg transition active:scale-95"
            >
              Browse Direct Listings
            </Link>
            <Link
              href="/dashboard"
              className="bg-indigo-650 hover:bg-indigo-700 border border-indigo-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-lg transition active:scale-95"
            >
              Post a Listing (Free)
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="max-w-6xl mx-auto -mt-10 px-4 sm:px-6 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-150 shadow-xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-8 text-center gap-6">
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-indigo-600">₹0</h3>
            <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Brokerage Charges</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-indigo-600">100%</h3>
            <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Direct Landlord Contact</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-indigo-600">₹15,000+</h3>
            <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Average Savings Per Move</p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Our Premium Features</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
            Everything you need to find a space and sign a lease, entirely free of broker intervention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 space-y-3">
                <div className="bg-indigo-50 text-indigo-600 w-11 h-11 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">{benefit.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Toolate Section */}
      <section className="bg-white border-y border-slate-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Why Choose Toolate?</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
              How we add tangible value to landlords, tenants, and travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {values.map((val, idx) => (
              <div key={idx} className="space-y-3 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <h4 className="font-extrabold text-slate-850 text-sm">{val.title}</h4>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-gradient-to-br from-indigo-650 to-indigo-805 text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Ready to Find Your Next Space?</h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
            Create an account in less than 30 seconds to view coordinates, check commute distances, and contact hosts.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg transition active:scale-95 inline-block"
            >
              Sign Up Now (Free)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
