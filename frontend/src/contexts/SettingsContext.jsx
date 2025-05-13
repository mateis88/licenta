import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
        main: '#90caf9',
      },
      background: {
        default: '#2d2d2d',
        paper: '#000000',
      },
    },
  },
  red: {
    palette: {
      mode: 'light',
      primary: {
        main: '#FF7276',
      },
      background: {
        default: '#ffcdd2',
        paper: '#FF7276',
      },
    },
  },
  green: {
    palette: {
      mode: 'light',
      primary: {
        main: '#2e7d32',
      },
      background: {
        default: '#c8e6c9',
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
      mode: 'dark',
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
  en: {
    common: {
      login: 'Login',
      register: 'Register',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      birthDate: 'Birth Date',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      close: 'Close',
      myRequests: 'My Requests',
    },
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to continue your journey.',
      noAccount: "Don't have an account?",
      registerHere: 'Register here',
      submit: 'Login',
      createAccount: 'Create Account',
      errors: {
        emailRequired: 'Email is required.',
        invalidEmail: 'Invalid email.',
        passwordRequired: 'Password is required.',
      }
    },
    register: {
      title: 'Create Account',
      subtitle: 'Join us and start your journey.',
      haveAccount: 'Already have an account?',
      loginHere: 'Login here',
      submit: 'Register',
      backToLogin: 'Back to Login',
      errors: {
        firstNameRequired: 'First name is required.',
        lastNameRequired: 'Last name is required.',
        emailRequired: 'Email is required.',
        invalidEmail: 'Invalid email.',
        passwordRequired: 'Password is required.',
        birthDateRequired: 'Birth date is required.',
      }
    },
    profile: {
      title: 'Profile',
      editProfile: 'Edit Profile',
      about: 'About',
    },
    settings: {
      title: 'Settings',
      theme: {
        title: 'Theme',
        light: 'Light Theme',
        dark: 'Dark Theme',
        red: 'Red Theme',
        green: 'Green Theme',
        blue: 'Blue Theme',
        darkBlue: 'Dark Blue Theme',
      },
      language: {
        title: 'Language',
        english: 'English',
        romanian: 'Romanian',
      },
    },
    calendar: {
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
  },
  ro: {
    common: {
      login: 'Autentificare',
      register: 'Înregistrare',
      profile: 'Profil',
      settings: 'Setări',
      logout: 'Deconectare',
      email: 'Email',
      password: 'Parolă',
      firstName: 'Prenume',
      lastName: 'Nume',
      birthDate: 'Data Nașterii',
      save: 'Salvează',
      cancel: 'Anulează',
      edit: 'Editează',
      close: 'Închide',
      myRequests: 'Cererile Mele',
    },
    login: {
      title: 'Bine ai revenit',
      subtitle: 'Conectează-te pentru a continua.',
      noAccount: 'Nu ai cont?',
      registerHere: 'Înregistrează-te aici',
      submit: 'Autentificare',
      createAccount: 'Creează cont',
      errors: {
        emailRequired: 'Email-ul este obligatoriu.',
        invalidEmail: 'Email invalid.',
        passwordRequired: 'Parola este obligatorie.',
      }
    },
    register: {
      title: 'Creează cont',
      subtitle: 'Alătură-te nouă și începe călătoria.',
      haveAccount: 'Ai deja cont?',
      loginHere: 'Autentifică-te aici',
      submit: 'Înregistrare',
      backToLogin: 'Înapoi la autentificare',
      errors: {
        firstNameRequired: 'Prenumele este obligatoriu.',
        lastNameRequired: 'Numele este obligatoriu.',
        emailRequired: 'Email-ul este obligatoriu.',
        invalidEmail: 'Email invalid.',
        passwordRequired: 'Parola este obligatorie.',
        birthDateRequired: 'Data nașterii este obligatorie.',
      }
    },
    profile: {
      title: 'Profil',
      editProfile: 'Editează Profilul',
      about: 'Despre',
    },
    settings: {
      title: 'Setări',
      theme: {
        title: 'Temă',
        light: 'Temă Luminoasă',
        dark: 'Temă Întunecată',
        red: 'Temă Roșie',
        green: 'Temă Verde',
        blue: 'Temă Albastră',
        darkBlue: 'Temă Albastră Întunecată',
      },
      language: {
        title: 'Limbă',
        english: 'Engleză',
        romanian: 'Română',
      },
    },
    calendar: {
      monthNames: [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
      ],
      weekDays: ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
    },
  },
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