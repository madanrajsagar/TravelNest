import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../utils/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('travelnest_lang');
      return saved && ['en', 'hi', 'mr'].includes(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguageState(lang);
      try {
        localStorage.setItem('travelnest_lang', lang);
      } catch (err) {
        console.error("Failed to store language preference:", err);
      }
    }
  };

  // Translation helper function t()
  const t = (key, params = {}) => {
    const dict = translations[language] || translations['en'];
    let text = dict[key] || translations['en'][key] || key;

    // Support dynamic parameters injection e.g. "Logged in as @{username}"
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(`{${paramKey}}`, params[paramKey]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
