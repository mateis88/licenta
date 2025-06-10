import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const refreshCalendar = useRef(null);
  const [events, setEvents] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshEvents = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const updateEvents = useCallback((newEvents) => {
    setEvents(newEvents);
  }, []);

  return (
    <CalendarContext.Provider value={{ 
      refreshCalendar, 
      events, 
      updateEvents, 
      refreshEvents, 
      refreshTrigger 
    }}>
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