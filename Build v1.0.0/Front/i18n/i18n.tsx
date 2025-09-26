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
          fetch('./i18n/locales/en.json'),
          fetch('./i18n/locales/fa.json')
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
    }
  }, [language, translations]);

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    if (!translations) {
      return '...'; // Return a temporary string while loading
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
    // A temporary, non-translatable message is okay here since translations aren't loaded yet.
    return <div className="flex items-center justify-center h-screen bg-slate-100"><p>Loading languages...</p></div>;
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