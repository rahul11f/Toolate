'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SharePanelProps {
  title: string;
  url?: string;
}

export default function SharePanel({ title, url }: SharePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';
  const encodedTitle = encodeURIComponent(`Check out this listing on Toolate: ${title}`);
  const encodedUrl = encodeURIComponent(shareUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this listing on Toolate: ${title}`,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setIsOpen(true); // Fallback to our custom modal
    }
  };

  const shareWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const shareTwitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <div className="relative inline-block">
      {/* Share Trigger Button */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold transition select-none active:scale-95 cursor-pointer"
        title="Share Listing"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </button>

      {/* Share Modal Dropdown Fallback */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-sm">Share this listing</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-3 px-4 rounded-xl border border-emerald-100 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={shareTwitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 px-4 rounded-xl border border-slate-900 transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter / X</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Copy Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow bg-slate-50 border border-slate-200 text-slate-550 text-xs px-3 py-2 rounded-xl outline-hidden overflow-ellipsis"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
