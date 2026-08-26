"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useLocale } from '@/i18n/routing';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n';
import Icon from '@/components/ui/Icon';
import { useSiteTexts } from '@/lib/siteTexts';

export default function LanguageSwitcher() {
  const { t: st } = useSiteTexts();
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLanguageChange = (newLocale) => {
    setIsOpen(false);
    if (newLocale === activeLocale) return;
    
    // next-intl: router.push(pathname, {locale}) properly swaps the locale prefix
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div className="relative z-50" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={st("nav.selectLanguage", "Dili seçin")}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors bg-gray-50 hover:bg-brand-50 px-3 py-1.5 rounded-lg border border-gray-200"
      >
        <span>{activeLocale.toUpperCase()}</span>
        <Icon name="chevron-down" size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 py-2 z-50">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                activeLocale === locale ? 'text-brand-600 font-bold bg-brand-50' : 'text-gray-700'
              }`}
            >
              <span>{LOCALE_LABELS[locale]}</span>
              {activeLocale === locale && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
