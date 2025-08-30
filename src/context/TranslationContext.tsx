import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getTranslation, getSupportedLanguages } from '../services/translationService';

interface TranslationContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  supportedLanguages: Array<{ code: string; name: string; flag: string }>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('TranslationProvider: component rendered');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
 const setLanguage = (language: string) => {
    console.log('TranslationProvider: setLanguage called', { language });
    setCurrentLanguage(language);
  };
  
  const t = (key: string) => {
    return getTranslation(currentLanguage, key);
  };
  
  const supportedLanguages = getSupportedLanguages();
  
  const value = {
    currentLanguage,
    setLanguage,
    t,
    supportedLanguages
  };
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};