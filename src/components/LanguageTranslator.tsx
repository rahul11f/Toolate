'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageTranslator() {
  const [currentLang, setCurrentLang] = useState('EN');

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'हिन्दी' },
    { code: 'KA', label: 'ಕನ್ನಡ' },
    { code: 'TA', label: 'தமிழ்' },
    { code: 'TE', label: 'తెలుగు' },
    { code: 'MR', label: 'मराठी' },
  ];

  const handleLangSelect = (code: string) => {
    setCurrentLang(code);
    const event = new CustomEvent('toolate-lang-change', { detail: { lang: code } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-2">
      <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 flex items-center gap-1">
        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Translate Info:</span>
      </span>
      <div className="flex flex-wrap gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLangSelect(lang.code)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer select-none ${
              currentLang === lang.code
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
