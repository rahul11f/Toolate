'use client';

import { useState, useRef, useCallback } from 'react';
import { QrCode, Download, Printer, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingArea: string;
  listingCity: string;
}

export default function QRCodeGenerator({
  listingId,
  listingTitle,
  listingPrice,
  listingArea,
  listingCity,
}: QRCodeGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const listingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://toolate.in'}/listings/${listingId}`;

  const generateQR = useCallback(async () => {
    setGenerating(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(listingUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  }, [listingUrl]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;

    // Create a canvas with listing info
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 520;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
    ctx.stroke();

    // QR Code
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 50, 30, 300, 300);

      // Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';

      // Truncate title if needed
      const truncatedTitle = listingTitle.length > 35
        ? listingTitle.substring(0, 35) + '...'
        : listingTitle;
      ctx.fillText(truncatedTitle, canvas.width / 2, 360);

      // Price and location
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText(`₹${listingPrice.toLocaleString('en-IN')}/month`, canvas.width / 2, 390);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`${listingArea}, ${listingCity}`, canvas.width / 2, 415);

      // Scan instruction
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('Scan to view full details & contact landlord', canvas.width / 2, 450);

      // Brand
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('toolate.in — Zero brokerage', canvas.width / 2, 480);

      // Download
      const link = document.createElement('a');
      link.download = `toolate-qr-${listingId.substring(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR code downloaded!');
    };
    img.src = qrDataUrl;
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups for printing');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code — ${listingTitle}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex; justify-content: center; align-items: center;
              min-height: 100vh; font-family: -apple-system, system-ui, sans-serif;
              background: white;
            }
            .card {
              text-align: center; padding: 32px;
              border: 2px solid #e2e8f0; border-radius: 16px;
              width: 105mm; /* A6 width */
            }
            .qr-img { width: 200px; height: 200px; }
            h2 { font-size: 16px; color: #1e293b; margin: 12px 0 4px; }
            .price { font-size: 18px; color: #4f46e5; font-weight: 800; }
            .location { font-size: 12px; color: #64748b; margin-top: 4px; }
            .scan-text { font-size: 11px; color: #94a3b8; margin-top: 12px; }
            .brand { font-size: 10px; color: #94a3b8; margin-top: 8px; font-weight: 600; }
            @media print {
              body { background: white; }
              .card { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrDataUrl}" class="qr-img" />
            <h2>${listingTitle}</h2>
            <div class="price">₹${listingPrice.toLocaleString('en-IN')}/month</div>
            <div class="location">${listingArea}, ${listingCity}</div>
            <div class="scan-text">Scan to view full details & contact landlord</div>
            <div class="brand">toolate.in — Zero brokerage</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={generateQR}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm py-3 rounded-xl transition cursor-pointer select-none disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <QrCode className="w-4 h-4 text-indigo-500" />
            <span>📱 Get QR Code</span>
          </>
        )}
      </button>

      {/* Modal */}
      {showModal && qrDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h3 className="font-bold text-slate-800 text-lg">Your Listing QR Code</h3>

            {/* QR Preview */}
            <div className="text-center space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-5">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm line-clamp-1">{listingTitle}</p>
                <p className="text-indigo-700 font-extrabold text-sm">
                  ₹{listingPrice.toLocaleString('en-IN')}/month
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {listingArea}, {listingCity}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Scan to view full details & contact landlord
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPNG}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer select-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer select-none"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print (A6)</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              Print and stick on your property's door/gate/notice board
            </p>
          </div>
        </div>
      )}
    </>
  );
}
