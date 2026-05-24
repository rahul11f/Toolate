import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
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
          <Shield className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-550 mt-1 text-sm font-medium">Last updated: May 24, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-slate max-w-none text-slate-600 space-y-6 leading-relaxed">
        <p>
          At <strong>Toolate</strong>, we value your privacy and are committed to protecting your personal data.
          This privacy policy describes how we collect, use, and process your information when you list or search for properties on our platform.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">1. Information We Collect</h2>
        <p>
          We collect information that you directly provide when you register an account or submit a property listing:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Account Information</strong>: Name, email address, password hash, and optional profile image.</li>
          <li><strong>Listing Data</strong>: Property title, description, category, rental cost, visiting hours, lease terms, area name, full address, and coordinates (latitude and longitude).</li>
          <li><strong>Media Uploads</strong>: Property photographs uploaded directly to our storage.</li>
          <li><strong>Contact Details</strong>: Mobile and WhatsApp numbers provided for direct tenant-landlord communication.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 pt-4">2. Map and Location Processing</h2>
        <p>
          To display listing locations safely, we integrate with Leaflet Maps and OpenStreetMap APIs. Your precise listing coordinates (latitude and longitude) are plotted on public maps.
          By submitting a listing, you consent to making the coordinates of the property public so prospective tenants can locate it.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">3. Vetting and Administration Reviews</h2>
        <p>
          Every submitted property listing is subject to manual validation by our system administrators before it is approved and published live.
          Administrators have access to your account profile and listing information to inspect and verify details.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">4. Security</h2>
        <p>
          We implement standard security practices including password hashing (using bcrypt) and secure routing.
          However, because listings publish your contact numbers publicly to facilitate direct communication, please exercise discretion regarding the details you upload.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">5. Third-Party Services</h2>
        <p>
          We utilize third-party free tier APIs:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Google reCAPTCHA v3</strong> to prevent automated spam signups.</li>
          <li><strong>Google AdSense</strong> placeholders to show contextual advertisement banners.</li>
          <li><strong>Upstash Redis</strong> for temporary OTP generation and sliding rate limits.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 pt-4">6. Category-Specific Data Handling</h2>
        <p>
          Depending on the lodging category selected, we process specific listing parameters to assist searchers:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Dormitories & Hostels</strong>: Details concerning shared sleeping spaces, lockboxes, and guest occupancy rules.</li>
          <li><strong>Hotels & Hourly Rooms</strong>: Timing limits, check-in requirements, and local ID requirements.</li>
          <li><strong>Dharamshalas</strong>: Strict observance of vegetarianism guidelines, pilgrim credentials, and non-commercial community conduct.</li>
        </ul>
      </div>
    </div>
  );
}
