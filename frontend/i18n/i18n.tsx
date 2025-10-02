
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Language } from '../types.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fa'); // Default to Persian
  const [translations, setTranslations] = useState<Record<Language, Record<string, string>> | null>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const [enResponse, faResponse] = await Promise.all([
          fetch('/i18n/locales/en.json'),
          fetch('/i18n/locales/fa.json')
        ]);
        if (!enResponse.ok || !faResponse.ok) {
            throw new Error(`HTTP error! status: ${enResponse.status} & ${faResponse.status}`);
        }
        const enData = await enResponse.json();
        const faData = await faResponse.json();
        setTranslations({ en: enData, fa: faData });
      } catch (error) {
        console.error("Failed to load translation files:", error);
        // Fallback to empty objects to prevent the app from crashing.
        setTranslations({ en: {}, fa: {} });
      }
    };
    loadTranslations();
  }, []);

  useEffect(() => {
    if (translations) { // Only set attributes after translations are loaded
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
        // FIX: Apply the correct font family to the body element based on the selected language.
        if (language === 'fa') {
            document.body.classList.add('font-vazir');
        } else {
            document.body.classList.remove('font-vazir');
        }
    }
  }, [language, translations]);

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    if (!translations) {
      return ''; // Return empty string while loading to avoid layout shifts
    }
    let translation = translations[language][key] || key;
    if (options) {
      Object.keys(options).forEach((optionKey) => {
        translation = translation.replace(`{{${optionKey}}}`, String(options[optionKey]));
      });
    }
    return translation;
  }, [language, translations]);

  if (!translations) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading Atlas AI...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};