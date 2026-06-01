import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import Link from 'next/link';
import InstallAppPopup from '@/components/InstallAppPopup';
import FloatingContactButton from '@/components/FloatingContactButton';
import MobileBottomNav from '@/components/MobileBottomNav';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Toolate - House, Flat, PG & Shop Listings',
  description: 'Completely free-to-use directory listing for rental and sale properties including houses, flats, shared PGs, and commercial shops. Simple, direct communication with landlords.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let footerText = 'Toolate Inc. All rights reserved. Built completely on Free Tier APIs.';
  let publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });
    if (settings) {
      if (settings.footerText) {
        footerText = settings.footerText;
      }
      if (settings.adsenseId) {
        publisherId = settings.adsenseId;
      }
    }
  } catch (error) {
    console.error('Failed to load layout settings:', error);
  }

  return (
    <html lang="en" className="h-full bg-slate-50">
      <head>
        {/* Google AdSense Auto Ads head script integration */}
        {publisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-full flex flex-col text-slate-800 antialiased`}>
        <Providers>
          <Navbar />
          <div className="flex-grow flex justify-center w-full max-w-[100vw] overflow-x-hidden relative">
            {/* Left Vertical Banner (Desktop only) */}
            <aside className="hidden xl:block w-40 shrink-0 sticky top-20 self-start p-4 z-10">
              <AdSensePlaceholder slot="side-banner-left" format="rectangle" className="h-[600px] w-[120px]" responsiveMinScreen="xl" />
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl w-full">
              {children}
            </main>

            {/* Right Vertical Banner (Desktop only) */}
            <aside className="hidden xl:block w-40 shrink-0 sticky top-20 self-start p-4 z-10">
              <AdSensePlaceholder slot="side-banner-right" format="rectangle" className="h-[600px] w-[120px]" responsiveMinScreen="xl" />
            </aside>
          </div>
          {/* Sticky footer with bottom banner AdSense placeholder */}
          <footer className="bg-white border-t border-slate-100 py-8 mt-12 w-full pb-28 md:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* AdSense Footer Banner */}
              <AdSensePlaceholder slot="footer-banner" format="auto" className="max-w-4xl mx-auto" />
              
              <div className="border-t border-slate-100 pt-6 flex flex-col items-center justify-center space-y-4">
                <p className="text-xs text-slate-400 text-center">&copy; {new Date().getFullYear()} {footerText}</p>
                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2.5">
                  <Link href="/about" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">About Us</Link>
                  <Link href="/contact" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">Contact & Feedback</Link>
                  <Link href="/privacy" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">Privacy Policy</Link>
                  <Link href="/terms" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">Terms of Service</Link>
                  <Link href="/tools/rental-agreement" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">Rental Agreement</Link>
                  <Link href="/admin" className="text-xs text-slate-400 hover:text-indigo-600 transition font-semibold text-center">Admin Portal</Link>
                </div>
              </div>
            </div>
          </footer>
          <InstallAppPopup />
          <FloatingContactButton />
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
