'use client';

import { useEffect, useState } from 'react';
import { Download, X, Building } from 'lucide-react';

export default function InstallAppPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If user dismissed it permanently, never show again
    if (localStorage.getItem('toolate-install-dismissed') === 'true') return;
    
    // Only show once per browser session to prevent annoying popups on refresh
    if (sessionStorage.getItem('toolate-install-session-seen') === 'true') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
      sessionStorage.setItem('toolate-install-session-seen', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide if already running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsVisible(false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('ServiceWorker registered with scope:', registration.scope))
        .catch(error => console.error('ServiceWorker registration failed:', error));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('toolate-install-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white border border-slate-100 shadow-2xl rounded-2xl p-5 z-50 flex flex-col space-y-4 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-650 shrink-0">
            <Building className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Install Toolate App</h4>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Free Property Directory</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 transition rounded-lg hover:bg-slate-50 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed font-medium">
        Install our lightweight app for fast listings access, offline search, and direct contact options right from your home screen.
      </p>

      {/* Buttons */}
      <div className="flex space-x-3 text-xs font-semibold">
        <button
          onClick={handleDismiss}
          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-xl transition cursor-pointer select-none"
        >
          Maybe Later
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer select-none"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Now</span>
        </button>
      </div>
    </div>
  );
}
