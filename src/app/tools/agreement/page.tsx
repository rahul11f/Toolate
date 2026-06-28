'use client';

import { useState } from 'react';
import { FileText, Copy, Printer, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomAgreementPage() {
  const [data, setData] = useState({
    date: new Date().toISOString().split('T')[0],
    landlordName: '',
    tenantName: '',
    propertyAddress: '',
    rentAmount: '',
    depositAmount: '',
    startDate: '',
    noticePeriod: '1',
  });

  const [copied, setCopied] = useState(false);

  const agreementText = `ROOM / FLAT RENTAL AGREEMENT

This Agreement is made on ${data.date || '[Date]'} between:

1. THE LANDLORD:
${data.landlordName || '[Landlord Name]'}

2. THE TENANT:
${data.tenantName || '[Tenant Name]'}

3. PROPERTY ADDRESS:
${data.propertyAddress || '[Full Address]'}

TERMS AND CONDITIONS:
1. RENT: The Tenant agrees to pay a monthly rent of ₹${data.rentAmount || '[Amount]'} to the Landlord.
2. SECURITY DEPOSIT: The Tenant has paid a refundable security deposit of ₹${data.depositAmount || '[Amount]'} to the Landlord. This deposit will be refunded at the time of vacating the premises, subject to deductions for damages or unpaid dues.
3. COMMENCEMENT: The tenancy shall commence on ${data.startDate || '[Start Date]'}.
4. NOTICE PERIOD: Either party must provide ${data.noticePeriod || '[Months]'} month(s) written notice before terminating this agreement.
5. UTILITIES: Electricity, water, and internet bills will be paid by the Tenant proportionately as agreed upon.
6. MAINTENANCE: The Tenant shall keep the property clean and hand it over in the same condition as received.

SIGNATURES:

___________________________                    ___________________________
Landlord Signature                             Tenant Signature

Name: ${data.landlordName || '________________________'}                    Name: ${data.tenantName || '________________________'}
Date: ____________________                     Date: ____________________`;

  const handleCopy = () => {
    navigator.clipboard.writeText(agreementText);
    setCopied(true);
    toast.success('Agreement copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 print:py-0 print:px-0">
      <div className="text-center max-w-2xl mx-auto space-y-4 print:hidden">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <FileText className="w-8 h-8 text-indigo-500" />
          <span>Room Agreement Generator</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Fill in the details below to generate a simple, printable rental agreement for a room, flat, or PG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
        {/* Form - Hidden on Print */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 print:hidden">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">Agreement Details</h2>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Date of Agreement</label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Landlord / Owner Name</label>
              <input
                type="text"
                value={data.landlordName}
                onChange={(e) => setData({ ...data, landlordName: e.target.value })}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Tenant / Roommate Name</label>
              <input
                type="text"
                value={data.tenantName}
                onChange={(e) => setData({ ...data, tenantName: e.target.value })}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Property Address</label>
              <textarea
                value={data.propertyAddress}
                onChange={(e) => setData({ ...data, propertyAddress: e.target.value })}
                placeholder="Full Address (Flat No, Building, Area, City)"
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={data.rentAmount}
                  onChange={(e) => setData({ ...data, rentAmount: e.target.value })}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={data.depositAmount}
                  onChange={(e) => setData({ ...data, depositAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Stay Start Date</label>
                <input
                  type="date"
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Notice Period (Months)</label>
                <select
                  value={data.noticePeriod}
                  onChange={(e) => setData({ ...data, noticePeriod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm px-4 py-2.5 rounded-xl outline-none"
                >
                  <option value="1">1 Month</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview / Print Area */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 print:hidden">
            <h2 className="text-xl font-bold text-slate-800">Preview Document</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Copy Text</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-sm whitespace-pre-wrap text-slate-800 leading-relaxed print:bg-white print:border-none print:p-0">
            {agreementText}
          </div>
        </div>
      </div>
    </div>
  );
}
