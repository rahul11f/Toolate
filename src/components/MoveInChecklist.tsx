'use client';

import { useState } from 'react';
import { ClipboardList, Download, Plus, Trash2, CheckCircle2, MessageSquare } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface MoveInChecklistProps {
  listingTitle: string;
  listingAddress: string;
  category: string;
}

export default function MoveInChecklist({
  listingTitle,
  listingAddress,
  category,
}: MoveInChecklistProps) {
  const isPgOrHostel = ['PG', 'HOSTEL', 'DORMITORY'].includes(category);

  // Category specific checklist items
  const defaultItems = isPgOrHostel
    ? [
        { text: 'Verify locker keys & working locking mechanism', checked: false },
        { text: 'Inspect bunk beds/mattress condition for bugs or damage', checked: false },
        { text: 'Confirm warden contact number & emergency procedures', checked: false },
        { text: 'Note mess and gate curfew timings', checked: false },
        { text: 'Check Wi-Fi connectivity and speed in your room', checked: false },
        { text: 'Verify RO drinking water availability and geyser hot water timing', checked: false },
        { text: 'Confirm biometric / keycard access registration', checked: false },
      ]
    : [
        { text: 'Verify water meter & electric meter current readings', checked: false },
        { text: 'Inspect for wall cracks, dampness, or fresh paint peeling', checked: false },
        { text: 'Check all electrical switches, light sockets & AC units', checked: false },
        { text: 'Verify gas connection, cylinders, or pipeline safety valve', checked: false },
        { text: 'Test all bathroom taps, showers, and toilet flush systems', checked: false },
        { text: 'Obtain Society NOC, gate pass, and vehicle parking slot allocation', checked: false },
        { text: 'Verify locks on all entry doors and windows', checked: false },
        { text: 'Confirm garbage collection rules and timing', checked: false },
      ];

  const [items, setItems] = useState(defaultItems);
  const [newItemText, setNewItemText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const toggleCheck = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems((prev) => [...prev, { text: newItemText.trim(), checked: false }]);
    setNewItemText('');
    toast.success('Checklist item added!');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Title & Address
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('MOVE-IN CHECKLIST', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Property: ${listingTitle}`, margin, y);
      y += 5;
      
      const splitAddress = doc.splitTextToSize(`Address: ${listingAddress}`, contentWidth);
      doc.text(splitAddress, margin, y);
      y += (splitAddress.length * 5) + 3;

      // Draw line separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Section Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Checklist Items (${isPgOrHostel ? 'Hostel/PG Specific' : 'Residential Flat Specific'})`, margin, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Loop items
      items.forEach((item, index) => {
        // Page break check
        if (y > doc.internal.pageSize.height - margin - 15) {
          doc.addPage();
          y = margin;
        }

        // Draw checkbox box
        doc.rect(margin, y - 3.5, 4, 4);
        if (item.checked) {
          doc.setFont('helvetica', 'bold');
          doc.text('X', margin + 1, y - 0.5);
          doc.setFont('helvetica', 'normal');
        }

        // Text wrapping
        const splitText = doc.splitTextToSize(item.text, contentWidth - 8);
        doc.text(splitText, margin + 8, y);
        y += (splitText.length * 5.5) + 3;
      });

      y += 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Vetted checklist tool provided by Toolate - Zero Brokerage Rentals.', margin, y);

      doc.save(`move_in_checklist_${listingTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      toast.success('Checklist downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF.');
    }
  };

  const handleShareWhatsApp = () => {
    const listString = items
      .map((item) => `${item.checked ? '✅' : '⬜'} ${item.text}`)
      .join('\n');
    
    const message = `📋 *Move-in Checklist for ${listingTitle}*\n\n${listString}\n\nGenerated via *Toolate* Rent Finder.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-violet-600" />
          <span>Move-in Checklist</span>
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-indigo-650 hover:text-indigo-850 font-bold select-none cursor-pointer"
        >
          {isOpen ? 'Collapse ▴' : 'Expand / Setup ▾'}
        </button>
      </div>

      <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
        Ensure zero surprises. Check structural fixtures, safety meters, water/curfew timelines before final settlement.
      </p>

      {isOpen && (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1.5 duration-200">
          {/* Custom Add Item */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add custom item..."
              className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
            />
            <button
              type="submit"
              className="px-3 bg-indigo-50 text-indigo-650 hover:bg-indigo-100 rounded-lg transition font-bold text-xs flex items-center justify-center cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Checklist list */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 justify-between py-1 group">
                <label className="flex items-start gap-2.5 text-xs text-slate-650 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(idx)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className={item.checked ? 'line-through text-slate-400 font-medium' : ''}>
                    {item.text}
                  </span>
                </label>
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-350 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition duration-150 shrink-0 cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-emerald-200 hover:border-emerald-350 hover:bg-emerald-50 text-emerald-700 rounded-xl transition text-xs font-bold select-none cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp List</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl transition text-xs font-bold shadow-sm select-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleDownloadPDF}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 rounded-xl transition text-xs font-bold select-none cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Quick Download PDF Checklist</span>
        </button>
      )}
    </div>
  );
}
