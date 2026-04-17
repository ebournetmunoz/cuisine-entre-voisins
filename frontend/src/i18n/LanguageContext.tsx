import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './translations/fr.json';
import en from './translations/en.json';
import es from './translations/es.json';
import de from './translations/de.json';

type TranslationKeys = typeof fr;

const translations: Record<string, TranslationKeys> = {
  fr,
  en,
  es,
  de,
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string) => string;
  refreshKey: number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('fr');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Load saved language on startup
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang && translations[savedLang]) {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    if (translations[lang]) {
      setLanguageState(lang);
      setRefreshKey(prev => prev + 1); // Force re-render
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch (error) {
        console.log('Error saving language:', error);
      }
    }
  };

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to French if key not found
        value = translations['fr'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return the key itself if not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, refreshKey }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
