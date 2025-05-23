import React, { createContext, useContext, useRef } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const refreshCalendar = useRef(null);

  return (
    <CalendarContext.Provider value={{ refreshCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 