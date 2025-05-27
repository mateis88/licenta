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
  green: {
    palette: {
      mode: 'light',
      primary: {
        main: '#00AE58',
      },
      background: {
        default: '#1b5e20',
        paper: '#00AE58',
      },
    },
  },
  blue: {
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      background: {
        default: '#90caf9',
        paper: '#00A3E1',
      },
      text: {
        primary: '#001440',
        secondary: '#001440',
      },
    },
  },
  darkBlue: {
    palette: {
      mode: 'light',
      primary: {
        main: '#64b5f6',
      },
      background: {
        default: '#1a237e',
        paper: '#283593',
      },
      text: {
        primary: '#90caf9',
        secondary: '#bbdefb',
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
    return savedTheme || 'light';
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