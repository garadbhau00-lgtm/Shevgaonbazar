
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import en from '@/lib/dictionaries/en.json';
import hi from '@/lib/dictionaries/hi.json';
import mr from '@/lib/dictionaries/mr.json';

const dictionaries: Record<string, any> = { en, hi, mr };

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('mr');
  const [dictionary, setDictionary] = useState(dictionaries.mr);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // If no saved language, detect from browser
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['en', 'hi', 'mr'].includes(browserLang)) {
        setLanguage(browserLang);
      } else {
        // Default to Marathi if browser language is not supported
        setLanguage('mr');
      }
    }
  }, []);

  useEffect(() => {
    setDictionary(dictionaries[language]);
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = { language, setLanguage, dictionary };

  return (
    <LanguageContext.Provider value={value}>
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
