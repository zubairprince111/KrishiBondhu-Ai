'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, type TranslationKey } from '@/lib/i18n';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'krishibondhu-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(LOCAL_STORAGE_KEY) as Language | null;
      if (storedLanguage && ['en', 'bn'].includes(storedLanguage)) {
        setLanguageState(storedLanguage);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };
  
  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] || key;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
