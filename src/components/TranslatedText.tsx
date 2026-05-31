'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  originalText: string;
  className?: string;
  as?: 'span' | 'p' | 'h1';
}

export default function TranslatedText({
  originalText,
  className = '',
  as: Component = 'span',
}: TranslatedTextProps) {
  const [text, setText] = useState(originalText);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({ EN: originalText });

  // Sync state if original text changes (e.g. navigation)
  useEffect(() => {
    setText(originalText);
    cacheRef.current = { EN: originalText };
  }, [originalText]);

  useEffect(() => {
    const handleLangChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetLang = customEvent.detail.lang;

      // Check cache first
      if (cacheRef.current[targetLang]) {
        setText(cacheRef.current[targetLang]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: originalText, targetLanguage: targetLang }),
        });

        if (res.ok) {
          const data = await res.json();
          cacheRef.current[targetLang] = data.translatedText;
          setText(data.translatedText);
        } else {
          console.error('Translation failed');
        }
      } catch (err) {
        console.error('Error translating text:', err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('toolate-lang-change', handleLangChange);
    return () => window.removeEventListener('toolate-lang-change', handleLangChange);
  }, [originalText]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-xs animate-pulse py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-650 shrink-0" />
        Translating text...
      </span>
    );
  }

  return <Component className={className}>{text}</Component>;
}
