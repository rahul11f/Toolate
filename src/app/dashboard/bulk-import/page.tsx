'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{
    successCount: number;
    failedCount: number;
    results: any[];
  } | null>(null);

  const templateHeaders = [
    'title', 'description', 'category', 'price', 'openingHours', 'closingHours',
    'landlordTerms', 'contactNumber', 'whatsappNumber', 'address', 'lat', 'lng',
    'area', 'state', 'city', 'images', 'facilities'
  ];

  const handleDownloadTemplate = () => {
    const csvContent = [
      templateHeaders.join(','),
      'Premium 2BHK in Indiranagar,Spacious semi-furnished apartment near metro with 24/7 power backup.,FLAT,25000,9:00 AM,9:00 PM,Vegetarian families preferred.,9876543210,9876543210,12th Main Road Indiranagar,12.9783,77.6408,Indiranagar,Karnataka,Bangalore,https://images.unsplash.com/photo-1522708323590-d24dbb6b0267,{"furnishedStatus":"SEMI_FURNISHED"}'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'toolate_bulk_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file.');
          console.error(results.errors);
          return;
        }

        const data = results.data as any[];
        if (data.length === 0) {
          toast.error('CSV file is empty.');
          return;
        }

        // Validate headers
        const fileHeaders = Object.keys(data[0] || {});
        const missingHeaders = templateHeaders.filter(h => !fileHeaders.includes(h));
        
        if (missingHeaders.length > 0 && missingHeaders.includes('title')) {
          toast.error(`Invalid template structure. Missing column headers: ${missingHeaders.join(', ')}`);
          return;
        }

        setHeaders(fileHeaders);
        setCsvData(data);
        validateData(data);
        setUploadStatus(null);
        toast.success(`Successfully loaded ${data.length} records!`);
      }
    });
  };

  const validateData = (data: any[]) => {
    const errors: string[] = [];
    const validCategories = ['HOUSE', 'FLAT', 'PG', 'HOSTEL', 'DORMITORY', 'SHOP', 'OFFICE', 'WAREHOUSE', 'HOURLY_ROOM', 'ROOMMATE'];

    data.forEach((row, idx) => {
      const rowNum = idx + 1;
      
      if (!row.title || row.title.length < 3) {
        errors.push(`Row ${rowNum}: Title must be at least 3 characters.`);
      }
      if (!row.description || row.description.length < 10) {
        errors.push(`Row ${rowNum}: Description must be at least 10 characters.`);
      }
      if (!row.category || !validCategories.includes(row.category.toUpperCase())) {
        errors.push(`Row ${rowNum}: Category must be one of: ${validCategories.join(', ')}.`);
      }
      if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
        errors.push(`Row ${rowNum}: Price must be a positive number.`);
      }
      if (!row.contactNumber || !/^[6-9]\d{9}$/.test(row.contactNumber)) {
        errors.push(`Row ${rowNum}: Contact number must be a valid 10-digit Indian number.`);
      }
      if (!row.address || row.address.length < 5) {
        errors.push(`Row ${rowNum}: Address must be at least 5 characters.`);
      }
      if (!row.area || row.area.length < 2) {
        errors.push(`Row ${rowNum}: Area is required.`);
      }
      if (!row.images) {
        errors.push(`Row ${rowNum}: Listing images (comma-separated URLs) are required.`);
      }
    });

    setValidationErrors(errors);
  };

  const handleSubmit = async () => {
    if (csvData.length === 0) return;
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading.');
      return;
    }

    setLoading(true);
    setUploadStatus(null);

    try {
      const res = await fetch('/api/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings: csvData }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit listings.');
      }

      const status = await res.json();
      setUploadStatus(status);
      
      if (status.failedCount === 0) {
        toast.success(`All ${status.successCount} listings imported successfully!`);
        setCsvData([]);
      } else {
        toast.error(`Import completed with ${status.failedCount} failures.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Bulk upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-800">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-655 transition gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-650 rounded-2xl shadow-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Bulk CSV Import</h1>
              <p className="text-slate-500 text-sm mt-0.5 font-medium">Create multiple listings at once by uploading a formatted CSV sheet</p>
            </div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700 shadow-xs select-none cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download Template CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & validation details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-50 pb-2">1. Upload CSV</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <Upload className="w-10 h-10 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700">Click to upload spreadsheet</p>
                <p className="text-[10px] text-slate-400 mt-1">Accepts standard .csv files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-2">
              <h5 className="font-bold text-slate-700 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Instructions
              </h5>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li>Make sure category values exactly match: <code className="bg-white px-1 py-0.5 rounded border">HOUSE</code>, <code className="bg-white px-1 py-0.5 rounded border">FLAT</code>, <code className="bg-white px-1 py-0.5 rounded border">PG</code>, <code className="bg-white px-1 py-0.5 rounded border">ROOMMATE</code> etc.</li>
                <li>Multiple image URLs must be comma-separated in the <code className="bg-white px-1 py-0.5 rounded border">images</code> column.</li>
                <li>Contact numbers must be valid 10-digit Indian numbers starting with 6-9.</li>
                <li>Facilities can be a JSON string like: <code className="bg-white px-1 py-0.5 rounded border">{"{ \"furnishedStatus\": \"SEMI_FURNISHED\" }"}</code>.</li>
              </ul>
            </div>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Validation Errors ({validationErrors.length})</span>
              </h4>
              <div className="max-h-48 overflow-y-auto text-[11px] text-rose-700 space-y-1.5 font-semibold leading-relaxed">
                {validationErrors.map((err, i) => (
                  <p key={i}>&bull; {err}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview / Results Table */}
        <div className="lg:col-span-8 space-y-6">
          {uploadStatus && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg border-b border-slate-50 pb-2">Import Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Success</span>
                    <h4 className="text-xl font-black text-emerald-900">{uploadStatus.successCount} Listings Created</h4>
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-700">Failed</span>
                    <h4 className="text-xl font-black text-rose-900">{uploadStatus.failedCount} Row Failures</h4>
                  </div>
                </div>
              </div>

              {uploadStatus.results.some(r => !r.success) && (
                <div className="space-y-2 mt-4">
                  <h5 className="text-xs font-bold text-slate-700">Detailed Errors log:</h5>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-[11px] font-semibold text-slate-650">
                    {uploadStatus.results.filter(r => !r.success).map((r, idx) => (
                      <div key={idx} className="py-2 flex items-start justify-between gap-4 text-rose-700">
                        <span>Row {r.row}</span>
                        <span className="text-right font-medium">{r.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {csvData.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-450 h-64 flex flex-col justify-center items-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3 animate-pulse" />
              <h4 className="font-bold text-slate-700">No Spreadsheet Loaded</h4>
              <p className="text-xs max-w-xs mt-1">Upload a valid CSV file on the left to review the preview before submitting.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <h3 className="font-bold text-slate-800 text-base">Spreadsheet Preview (First 5 Rows)</h3>
                <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-3 py-1 rounded-lg">
                  {csvData.length} records parsed
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-750">
                      <th className="p-3">#</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Area</th>
                      <th className="p-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                    {csvData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 truncate max-w-[150px] font-bold text-slate-800">{row.title || 'N/A'}</td>
                        <td className="p-3 font-semibold uppercase">{row.category || 'N/A'}</td>
                        <td className="p-3 font-mono font-bold">₹{row.price || 'N/A'}</td>
                        <td className="p-3">{row.area || 'N/A'}</td>
                        <td className="p-3">{row.contactNumber || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setCsvData([])}
                  className="px-5 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-600 select-none cursor-pointer"
                >
                  Clear Data
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || validationErrors.length > 0}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl transition text-xs font-bold shadow-sm select-none cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Listings...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Batch ({csvData.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
