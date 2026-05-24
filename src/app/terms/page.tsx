import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-650 transition gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-6">
        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
          <FileText className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-slate-550 mt-1 text-sm font-medium">Last updated: May 24, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>
          Welcome to <strong>Toolate</strong>. By using our website and services, you agree to comply with and be bound by the following terms and conditions.
          Please read them carefully.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">1. Acceptance of Terms</h2>
        <p>
          Toolate provides a directory platform for users to publish and browse property advertisements (houses, flats, PGs, shops, offices, villas, etc.).
          By registering, submitting property listings, or searching on the directory, you accept these Terms of Service.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">2. Listing Rules & Content Guidelines</h2>
        <p>
          To maintain a premium, safe, and broker-free property listing platform, all users must agree to the following rules:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Broker-Free Policy</strong>: You must represent the property landlord, manager, or current tenant looking to lease/sell directly. Broker listings are prohibited.</li>
          <li><strong>Accuracy</strong>: All listings must represent real, existing properties with accurate prices, locations, addresses, and images. Falsified parameters will result in immediate bans.</li>
          <li><strong>Vetting</strong>: Every listing is initially placed in a PENDING status and is reviewed manually. Administrators hold complete rights to approve, modify, reject, or delete any listing.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 pt-4">3. User Moderation and Account Bans</h2>
        <p>
          Administrators monitor user activities and listings. If you submit spam, abusive descriptions, fake image uploads, or invalid coordinates,
          administrators can permanently delete or ban your account. Banning an account cascades and permanently removes all listing entries and user sessions.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">4. Liability Disclaimer</h2>
        <p>
          Toolate serves solely as an informational listing directory. We do not participate in, control, or verify any agreements made between tenants and landlords.
          We are not responsible for deposits, lease violations, or financial transfers. We advise all users to verify landlords and visit properties physically before committing any funds.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">5. AdSense & Third-Party Linkage</h2>
        <p>
          The platform contains third-party AdSense advertising placeholders. Toolate does not endorse the contents of these ads, and clicking them redirects users outside our web environment.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">6. Special Lodging Rules & Regulations</h2>
        <p>
          To maintain a safe community directory, specific lodging categories are bound by category-specific regulations:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Dormitories & Shared Spaces</strong>: Users listing shared rooms or bunk beds must maintain strict quiet hours and guest safety codes. Toolate holds zero liability for personal belongings stored in shared lockers.</li>
          <li><strong>Dharamshalas (Community Pilgrim Lodging)</strong>: All Dharamshala advertisements must emphasize non-commercial pilgrimage purposes. Guests must abide by strict community codes of conduct, including absolute bans on alcohol, smoking, gambling, and non-vegetarian food.</li>
          <li><strong>Hotels & Hourly Rooms</strong>: Standard local authority registrations are required. Hosts must inspect valid government IDs (local/marital conditions subject to local laws) upon check-in. Hourly rooms must state check-in/checkout rules clearly.</li>
        </ul>
      </div>
    </div>
  );
}
