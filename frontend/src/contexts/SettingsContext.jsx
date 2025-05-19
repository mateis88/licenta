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
      newRequest: 'New Request',
      loading: 'Loading...',
      basicInformation: 'Basic Information',
      additionalInformation: 'Additional Information',
      address: 'Address',
      bio: 'Bio',
      phoneNumber: 'Phone Number',
      street: 'Street',
      city: 'City',
      state: 'State/County',
      country: 'Country',
      zipCode: 'ZIP Code',
      noBioProvided: 'No bio provided',
      noPhoneNumberProvided: 'No phone number provided',
      noStreetProvided: 'No street address provided',
      noCityProvided: 'No city provided',
      noStateProvided: 'No state provided',
      noCountryProvided: 'No country provided',
      noZipCodeProvided: 'No ZIP code provided',
      tellUsAboutYourself: 'Tell us about yourself...',
      phoneNumberPlaceholder: '+1234567890',
      failedToUpdateProfile: 'Failed to update profile',
      clickToChangePhoto: 'Click to change profile picture',
      invalidFileType: 'Please select an image file',
      fileTooLarge: 'Image size should be less than 5MB',
      failedToUploadImage: 'Failed to upload image',
      leaveType: 'Leave Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      submitRequest: 'Submit Request',
      startDateInPast: 'Start date cannot be in the past',
      endDateBeforeStart: 'End date must be after or equal to start date',
      failedToSubmitRequest: 'Failed to submit request',
      sickLeave: 'Sick Leave',
      paidLeave: 'Paid Leave',
      unpaidLeave: 'Unpaid Leave',
      studyLeave: 'Study Leave',
      newLeaveRequest: 'New Leave Request',
      sickLeaveDisclaimer: 'For sick leave, please upload necessary medical documents to support your request. These documents are required for compensation of absent days.',
      uploadDocuments: 'Upload Documents',
      uploading: 'Uploading...',
      sickLeaveDocumentsRequired: 'Medical documents are required for sick leave requests',
      noFilesSelected: 'Please select at least one file to upload',
      status: 'Status',
      statusPending: 'Pending',
      statusApproved: 'Approved',
      statusRejected: 'Rejected',
      submittedAt: 'Submitted At',
      documents: 'Documents',
      noDocuments: 'No documents',
      noRequestsFound: 'No requests found',
      failedToLoadRequests: 'Failed to load requests',
      downloadDocument: 'Download document',
      actions: 'Actions',
      deleteRequest: 'Delete Request',
      confirmDeleteRequest: 'Delete Request',
      deleteRequestConfirmation: 'Are you sure you want to delete this request? This action cannot be undone.',
      delete: 'Delete',
      failedToDeleteRequest: 'Failed to delete request',
      todaysBirthdays: "Today's Birthdays",
      noBirthdaysToday: "No birthdays today",
      failedToLoadBirthdays: "Failed to load birthdays",
      createEvent: 'Create Event',
      eventName: 'Event Name',
      eventDescription: 'Description',
      location: 'Location',
      startTime: 'Start Time',
      endTime: 'End Time',
      create: 'Create',
      failedToCreateEvent: 'Failed to create event',
      events: 'Events',
      noEvents: 'No events for this day',
    },
    login: {
      title: 'Welcome Back',
      subtitle: 'Please enter your credentials to login',
      noAccount: "Don't have an account?",
      registerHere: 'Register here',
      submit: 'Login',
      createAccount: 'Create Account',
      errors: {
        emailRequired: 'Email is required',
        invalidEmail: 'Invalid email format',
        passwordRequired: 'Password is required',
        invalidCredentials: 'Invalid email or password',
        serverError: 'An error occurred. Please try again later.'
      },
      loginHere: 'Login here',
      createAccountHere: 'Create an account here',
      backToLogin: 'Back to Login'
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
        light: 'Light',
        dark: 'Dark',
        green: 'Green',
        blue: 'Blue',
        darkBlue: 'Dark Blue'
      },
      language: {
        title: 'Language',
        english: 'English',
        romanian: 'Romanian'
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
      newRequest: 'Cerere Nouă',
      loading: 'Se încarcă...',
      basicInformation: 'Informații de Bază',
      additionalInformation: 'Informații Adiționale',
      address: 'Adresă',
      bio: 'Biografie',
      phoneNumber: 'Număr de Telefon',
      street: 'Stradă',
      city: 'Oraș',
      state: 'Stat/Județ',
      country: 'Țară',
      zipCode: 'Cod Poștal',
      noBioProvided: 'Nu există biografie',
      noPhoneNumberProvided: 'Nu există număr de telefon',
      noStreetProvided: 'Nu există adresă',
      noCityProvided: 'Nu există oraș',
      noStateProvided: 'Nu există județ',
      noCountryProvided: 'Nu există țară',
      noZipCodeProvided: 'Nu există cod poștal',
      tellUsAboutYourself: 'Spune-ne despre tine...',
      phoneNumberPlaceholder: '+40123456789',
      failedToUpdateProfile: 'Actualizarea profilului a eșuat',
      clickToChangePhoto: 'Clic pentru a schimba fotografia de profil',
      invalidFileType: 'Vă rugăm să selectați un fișier imagine',
      fileTooLarge: 'Dimensiunea imaginii trebuie să fie mai mică de 5MB',
      failedToUploadImage: 'Încărcarea imaginii a eșuat',
      leaveType: 'Tip Concediu',
      startDate: 'Data de Început',
      endDate: 'Data de Sfârșit',
      submitRequest: 'Trimite Cererea',
      startDateInPast: 'Data de început nu poate fi în trecut',
      endDateBeforeStart: 'Data de sfârșit trebuie să fie după sau egală cu data de început',
      failedToSubmitRequest: 'Trimiterea cererii a eșuat',
      sickLeave: 'Concediu Medical',
      paidLeave: 'Concediu Plătit',
      unpaidLeave: 'Concediu Neplătit',
      studyLeave: 'Concediu de Studii',
      newLeaveRequest: 'Cerere Concediu Nouă',
      sickLeaveDisclaimer: 'Pentru concediul medical, vă rugăm să încărcați documentele medicale necesare pentru a susține cererea. Aceste documente sunt obligatorii pentru compensarea zilelor de absență.',
      uploadDocuments: 'Încarcă Documente',
      uploading: 'Se încarcă...',
      sickLeaveDocumentsRequired: 'Documentele medicale sunt obligatorii pentru cererile de concediu medical',
      noFilesSelected: 'Vă rugăm să selectați cel puțin un fișier pentru încărcare',
      status: 'Status',
      statusPending: 'În Așteptare',
      statusApproved: 'Aprobat',
      statusRejected: 'Respins',
      submittedAt: 'Trimis La',
      documents: 'Documente',
      noDocuments: 'Fără documente',
      noRequestsFound: 'Nu s-au găsit cereri',
      failedToLoadRequests: 'Încărcarea cererilor a eșuat',
      downloadDocument: 'Descarcă documentul',
      actions: 'Acțiuni',
      deleteRequest: 'Șterge Cererea',
      confirmDeleteRequest: 'Șterge Cererea',
      deleteRequestConfirmation: 'Sigur doriți să ștergeți această cerere? Această acțiune nu poate fi anulată.',
      delete: 'Șterge',
      failedToDeleteRequest: 'Nu s-a putut șterge cererea',
      todaysBirthdays: "Zile de Naștere Astăzi",
      noBirthdaysToday: "Nu sunt zile de naștere astăzi",
      failedToLoadBirthdays: "Nu s-au putut încărca zilele de naștere",
      createEvent: 'Creează Eveniment',
      eventName: 'Nume Eveniment',
      eventDescription: 'Descriere',
      location: 'Locație',
      startTime: 'Ora de început',
      endTime: 'Ora de sfârșit',
      create: 'Creează',
      failedToCreateEvent: 'Nu s-a putut crea evenimentul',
      events: 'Evenimente',
      noEvents: 'Nu există evenimente pentru această zi',
    },
    login: {
      title: 'Bine ai revenit',
      subtitle: 'Te rugăm să introduci datele de autentificare',
      noAccount: 'Nu ai cont?',
      registerHere: 'Înregistrează-te aici',
      submit: 'Autentificare',
      createAccount: 'Creează cont',
      errors: {
        emailRequired: 'Email-ul este obligatoriu',
        invalidEmail: 'Format email invalid',
        passwordRequired: 'Parola este obligatorie',
        invalidCredentials: 'Email sau parolă incorectă',
        serverError: 'A apărut o eroare. Vă rugăm să încercați din nou mai târziu.'
      },
      loginHere: 'Autentifică-te aici',
      createAccountHere: 'Creează un cont aici',
      backToLogin: 'Înapoi la autentificare'
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
        light: 'Luminoasă',
        dark: 'Întunecată',
        green: 'Verde',
        blue: 'Albastră',
        darkBlue: 'Albastru Închis'
      },
      language: {
        title: 'Limbă',
        english: 'Engleză',
        romanian: 'Română'
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