import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import enTranslations from '../translations/en.json';
import roTranslations from '../translations/ro.json';

const themes = {
  light: {
    palette: {
      mode: 'light',
      primary: {
        main: '#9e9e9e',
      },
      background: {
        default: '#ffffff',
        paper: '#fafafa',
      },
    },
  },
  dark: {
    palette: {
      mode: 'dark',
      primary: {
        main: '#9e9e9e',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
  },
};

const translations = {
  en: enTranslations,
  ro: roTranslations
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  const theme = createTheme(themes[currentTheme]);

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const value = {
    currentTheme,
    setCurrentTheme,
    currentLanguage,
    setCurrentLanguage,
    translations: translations[currentLanguage],
  };

  return (
    <SettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 