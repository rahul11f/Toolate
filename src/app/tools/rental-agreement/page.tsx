'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Copy, Check, Sparkles, Loader2, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export default function RentalAgreementPage() {
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [leaseDuration, setLeaseDuration] = useState('11');
  const [startDate, setStartDate] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('1');
  const [paymentDueDay, setPaymentDueDay] = useState('5');
  const [specialConditions, setSpecialConditions] = useState('');

  const [loading, setLoading] = useState(false);
  const [agreementText, setAgreementText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landlordName || !tenantName || !propertyAddress || !rentAmount || !depositAmount || !startDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setAgreementText('');

    try {
      const res = await fetch('/api/ai/rental-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordName,
          landlordPhone,
          landlordAddress,
          tenantName,
          tenantPhone,
          tenantAddress,
          propertyAddress,
          rentAmount,
          depositAmount,
          leaseDuration,
          startDate,
          noticePeriod,
          paymentDueDay,
          specialConditions,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate rental agreement.');
      }

      const data = await res.json();
      setAgreementText(data.agreementText);
      toast.success('Rental Agreement Drafted successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error generating agreement.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!agreementText) return;
    navigator.clipboard.writeText(agreementText);
    setCopied(true);
    toast.success('Agreement copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!agreementText) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      doc.setFont('helvetica', 'normal');
      
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const contentWidth = pageWidth - (margin * 2);
      
      let y = margin;

      const lines = agreementText.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '') {
          y += 4;
          continue;
        }

        // Detect titles and headings for styling
        const isMainTitle = line === 'RENTAL AGREEMENT' || line.startsWith('RENTAL AGREEMENT');
        const isHeading = line.toUpperCase() === line && line.length > 3 && !line.includes(':') && !line.includes('₹') && !line.includes('__');

        if (isMainTitle) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.text(line, pageWidth / 2, y, { align: 'center' });
          y += 10;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          continue;
        }

        if (isHeading) {
          y += 4;
          // Page overflow check before writing heading
          if (y > pageHeight - margin - 15) {
            doc.addPage();
            y = margin;
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(line, margin, y);
          y += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          continue;
        }

        // Normal text wrapping
        const splitText = doc.splitTextToSize(line, contentWidth);
        for (let j = 0; j < splitText.length; j++) {
          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin;
          }
          doc.text(splitText[j], margin, y);
          y += 5.5;
        }
      }

      doc.save(`rental_agreement_${tenantName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      toast.success('Agreement PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-655 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Rental Agreement Generator
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Create customized, ready-to-print residential lease agreement drafts instantly
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Form Panel (5 cols) */}
        <form onSubmit={handleGenerate} className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 h-fit">
          <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-2 flex items-center gap-2">
            <span>📝 Agreement Details</span>
          </h3>

          <div className="space-y-4">
            {/* Section: Landlord */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Landlord (Owner)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={landlordPhone}
                    onChange={(e) => setLandlordPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Permanent Address</label>
                <input
                  type="text"
                  value={landlordAddress}
                  onChange={(e) => setLandlordAddress(e.target.value)}
                  placeholder="Street address, City, State"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                />
              </div>
            </div>

            {/* Section: Tenant */}
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Tenant (Renter)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="e.g. Priyan Sharma"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="e.g. 8765432109"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Permanent Address</label>
                <input
                  type="text"
                  value={tenantAddress}
                  onChange={(e) => setTenantAddress(e.target.value)}
                  placeholder="Permanent Home address, City, State"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                />
              </div>
            </div>

            {/* Section: Property & Rent Terms */}
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Property & Rent Terms</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Rental Property Address *</label>
                <input
                  type="text"
                  required
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="Address of the property being rented"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Lease (Months)</label>
                  <input
                    type="number"
                    value={leaseDuration}
                    onChange={(e) => setLeaseDuration(e.target.value)}
                    placeholder="11"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Due Day</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    placeholder="5"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Notice (Months)</label>
                  <input
                    type="number"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Lease Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Special Rules / Conditions</label>
                <textarea
                  value={specialConditions}
                  onChange={(e) => setSpecialConditions(e.target.value)}
                  placeholder="e.g. No pets allowed, veg only cooking, lock-in period..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-hidden transition font-medium resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-md cursor-pointer select-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Drafting Agreement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </form>

        {/* Preview Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {!agreementText ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-450 flex-1 flex flex-col justify-center items-center">
              <FileText className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3 animate-pulse" />
              <h4 className="font-bold text-slate-700">No Draft Generated Yet</h4>
              <p className="text-xs max-w-xs mt-1">Complete the details on the left and click "Generate with AI" to view your ready agreement document.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col flex-1 space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3 shrink-0">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Agreement Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl transition cursor-pointer text-slate-600 flex items-center gap-1.5 text-xs font-semibold select-none"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>Copy Text</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm select-none"
                    title="Download as PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Text Box */}
              <div className="flex-1 bg-slate-50 border border-slate-150 rounded-xl p-6 font-mono text-xs overflow-y-auto max-h-[500px] leading-relaxed whitespace-pre-line text-slate-750">
                {agreementText}
              </div>

              {/* Disclaimer Alert */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-amber-900">Legal Disclaimer & Next Steps</h5>
                  <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                    This document is a draft template generated for reference purposes only. Under Indian law (Registration Act, 1908), rental agreements longer than 11 months must be registered. To make it legally binding:
                  </p>
                  <ul className="list-disc pl-4 text-[9px] text-amber-850 font-medium leading-relaxed mt-1">
                    <li>Print the agreement on Non-Judicial Stamp Paper (typically ₹100 or ₹200 denomination).</li>
                    <li>Both the landlord and tenant must sign each page, witnessed by two adult individuals.</li>
                    <li>For full legal security, have the stamp paper notarized by a certified Public Notary.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
