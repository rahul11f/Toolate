'use client';

import { useEffect, useState } from 'react';
import { Download, X, HelpCircle, Laptop, Smartphone, Apple } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleButtonClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install choice outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // If native installation is not supported, show manual instruction modal
      setShowModal(true);
    }
  };

  // If already running inside standalone PWA mode, hide install triggers
  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={handleButtonClick}
        type="button"
        className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {/* Manual PWA Instructions Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md p-6 relative flex flex-col space-y-6 animate-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-650">
                  <Download className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">Install Toolate App</h4>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Fast & Free Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition rounded-lg hover:bg-slate-50 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content instruction details */}
            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <p className="leading-relaxed">
                Add Toolate directly to your home screen or desktop dashboard for offline capabilities and direct landlord contacts.
              </p>

              <div className="divide-y divide-slate-100">
                {/* iOS instructions */}
                <div className="py-3 flex items-start space-x-3">
                  <Apple className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-slate-850 font-bold">iOS / Apple Safari</h5>
                    <p className="text-slate-450 leading-relaxed text-[11px]">
                      Click the <strong className="text-indigo-600">Share button</strong> (box with up arrow) in the bottom toolbar, scroll down and select <strong className="text-slate-800 font-bold">"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* Android / Chrome instructions */}
                <div className="py-3 flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-slate-850 font-bold">Android / Mobile Chrome</h5>
                    <p className="text-slate-450 leading-relaxed text-[11px]">
                      Click the browser <strong className="text-indigo-600">Menu (3 dots)</strong> on the top right, and select <strong className="text-slate-800 font-bold">"Install App"</strong> or <strong className="text-slate-800 font-bold">"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* Desktop instructions */}
                <div className="py-3 flex items-start space-x-3">
                  <Laptop className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-slate-850 font-bold">Desktop (Chrome/Edge/Safari)</h5>
                    <p className="text-slate-450 leading-relaxed text-[11px]">
                      Click the <strong className="text-indigo-600">Install icon</strong> in the right end of the browser address bar (URL bar) next to bookmark stars.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="flex pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition cursor-pointer text-xs select-none"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
