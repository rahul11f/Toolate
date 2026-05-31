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

        <h3 className="text-lg font-bold text-slate-800 pt-2">4.1 Government ID Verification Data & Trusted Badges</h3>
        <p>
          To maintain safety on room roommate coordinates and travel partner stays, users can upload an identity document (Aadhaar, Passport, Voter ID) scan or photo.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Data Stored</strong>: We store the submitted Legal Name, ID number, and the secure document attachment URL on your profile.</li>
          <li><strong>Duplicate Protection</strong>: Our system scans for duplicate document numbers to block verification fraud.</li>
          <li><strong>Display Name Matching</strong>: The submitted Legal Name must match your display name exactly. If you change your display name later, your Trusted badge is automatically revoked, and all verification data is purged from the database.</li>
          <li><strong>Storage Policies</strong>: ID documents are uploaded to our secure storage and are only accessible by verified platform administrators.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 pt-4">5. Hotel Booking Receipts & Traveler Safety</h2>
        <p>
          When you create a listing under the "Hotel Room Sharing / Travel Partner" category, submitting a booking confirmation ID and booking receipt screenshot is mandatory.
          To ensure traveler safety, these sensitive files and details are ID-locked and are only displayed to other registered users who have a verified Trusted Identity badge.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">6. Third-Party Services & Storage</h2>
        <p>
          We utilize third-party services to deliver rate-limiting, notifications, and media hosting:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Cloudinary</strong>: All listing images, avatars, and ID verification document uploads are hosted on Cloudinary to manage storage capacity.</li>
          <li><strong>Supabase</strong>: Serves as a database provider and fallback storage bucket.</li>
          <li><strong>Google reCAPTCHA v3 & AdSense</strong>: Protects registration forms and displays contextual advertising blocks.</li>
          <li><strong>Upstash Redis & Resend</strong>: Handles OTP storage, email code generation, rate limits, and automated listing expiry alerts.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-800 pt-4">7. Roommate Stay Partner Coordinates & Expirations</h2>
        <p>
          Roommate partner listings optionally collect check-in and check-out coordinate stay dates.
          We use these stay dates to determine listing validity. When your checkout date is reached, the system automatically marks the listing as expired and removes it from public catalog indexes to prevent outdated listings.
        </p>

        <h2 className="text-xl font-bold text-slate-800 pt-4">8. Permanent Account Purging (Danger Zone)</h2>
        <p>
          You can request permanent account deletion from your settings. Doing so deletes all your listings, reviews, messages, document verification records, and payment logs immediately from our servers.
        </p>
      </div>
    </div>
  );
}
