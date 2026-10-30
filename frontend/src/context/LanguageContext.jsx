import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app_language') || 'vi';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    window.dispatchEvent(new CustomEvent('app_language_changed', { detail: lang }));
  };

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && (e.detail === 'vi' || e.detail === 'en')) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('app_language_changed', handleSync);
    return () => window.removeEventListener('app_language_changed', handleSync);
  }, []);

  const t = (key, fallback) => {
    const dict = translations[language] || translations.vi;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    if (translations.vi && translations.vi[key] !== undefined) {
      return translations.vi[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isEn: language === 'en',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    const lang = typeof window !== 'undefined' ? (localStorage.getItem('app_language') || 'vi') : 'vi';
    return {
      language: lang,
      setLanguage: () => {},
      t: (key, fallback) => {
        const dict = translations[lang] || translations.vi;
        return dict?.[key] !== undefined ? dict[key] : (fallback ?? key);
      },
      isEn: lang === 'en',
    };
  }
  return ctx;
}

export default LanguageContext;
