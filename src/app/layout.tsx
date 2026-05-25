import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import AdSensePlaceholder from '@/components/AdSensePlaceholder';
import Link from 'next/link';
import InstallAppPopup from '@/components/InstallAppPopup';
import prisma from '@/lib/prisma';

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
          <footer className="bg-white border-t border-slate-100 py-8 mt-12 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* AdSense Footer Banner */}
              <AdSensePlaceholder slot="footer-banner" format="auto" className="max-w-4xl mx-auto" />
              
              <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-6">
                <p>&copy; {new Date().getFullYear()} {footerText}</p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <Link href="/contact" className="hover:text-indigo-650 text-indigo-600 font-bold transition">Contact Us & Suggestions</Link>
                  <Link href="/privacy" className="hover:text-indigo-650 transition">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-indigo-650 transition">Terms of Service</Link>
                  <Link href="/admin" className="hover:text-indigo-650 transition">Admin Portal</Link>
                </div>
              </div>
            </div>
          </footer>
          <InstallAppPopup />
        </Providers>
      </body>
    </html>
  );
}
