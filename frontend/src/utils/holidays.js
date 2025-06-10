/**
 * Utility functions for handling holidays
 */

// Orthodox Easter dates for the next 10 years
const orthodoxEasterDates = {
  2024: { month: 4, day: 5 },  // May 5, 2024
  2025: { month: 3, day: 20 }, // April 20, 2025
  2026: { month: 3, day: 12 }, // April 12, 2026
  2027: { month: 4, day: 2 },  // May 2, 2027
  2028: { month: 3, day: 16 }, // April 16, 2028
  2029: { month: 3, day: 8 },  // April 8, 2029
  2030: { month: 4, day: 28 }, // April 28, 2030
  2031: { month: 4, day: 13 }, // April 13, 2031
  2032: { month: 4, day: 2 },  // May 2, 2032
  2033: { month: 3, day: 24 }, // April 24, 2033
};

// Function to get Orthodox Easter date for a given year
const getOrthodoxEaster = (year) => {
  const easterDate = orthodoxEasterDates[year];
  if (!easterDate) {
    console.warn(`No Orthodox Easter date available for year ${year}`);
    return null;
  }
  return new Date(year, easterDate.month, easterDate.day, 12, 0, 0);
};

// Function to get all Romanian holidays for a given year
export const getRomanianHolidays = (year) => {
  console.log(`Getting holidays for year: ${year}`);
  
  // Helper function to create dates at noon to avoid timezone issues
  const createDate = (y, m, d) => new Date(y, m, d, 12, 0, 0);
  
  const holidays = [
    { date: createDate(year, 0, 1), name: 'Anul Nou' }, // New Year's Day
    { date: createDate(year, 0, 24), name: 'Ziua Unirii Principatelor Române' }, // Union Day
    { date: createDate(year, 4, 1), name: 'Ziua Muncii' }, // Labor Day
    { date: createDate(year, 5, 1), name: 'Ziua Copilului' }, // Children's Day
    { date: createDate(year, 7, 15), name: 'Adormirea Maicii Domnului' }, // Assumption of Mary
    { date: createDate(year, 11, 1), name: 'Ziua Națională a României' }, // National Day
    { date: createDate(year, 11, 25), name: 'Crăciunul' }, // Christmas Day
    { date: createDate(year, 11, 26), name: 'A doua zi de Crăciun' } // Second Day of Christmas
  ];

  // Get Orthodox Easter and related holidays
  const easterSunday = getOrthodoxEaster(year);
  if (easterSunday) {
    console.log('Easter Sunday:', easterSunday.toLocaleDateString());
    
    const goodFriday = new Date(easterSunday);
    goodFriday.setDate(easterSunday.getDate() - 2);
    
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);
    
    holidays.push(
      { date: goodFriday, name: 'Vinerea Mare' },
      { date: easterSunday, name: 'Paștele Ortodox' },
      { date: easterMonday, name: 'A doua zi de Paște' }
    );
  }

  // Log all holidays for debugging
  console.log('All holidays:', holidays.map(h => ({
    name: h.name,
    date: h.date.toLocaleDateString()
  })));

  return holidays;
};

// Check if a date is a public holiday
export const isPublicHoliday = (date) => {
  const holidays = getRomanianHolidays(date.getFullYear());
  
  // Create a date at noon for comparison to avoid timezone issues
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  
  const isHoliday = holidays.some(holiday => {
    const isMatch = holiday.date.getDate() === compareDate.getDate() &&
      holiday.date.getMonth() === compareDate.getMonth() &&
      holiday.date.getFullYear() === compareDate.getFullYear();
    
    if (isMatch) {
      console.log('Found holiday match:', holiday.name, 'on', compareDate.toLocaleDateString());
    }
    return isMatch;
  });
  
  return isHoliday;
};

// Get holiday name if date is a holiday
export const getHolidayName = (date) => {
  const holidays = getRomanianHolidays(date.getFullYear());
  
  const holiday = holidays.find(h => 
    h.date.getDate() === date.getDate() &&
    h.date.getMonth() === date.getMonth() &&
    h.date.getFullYear() === date.getFullYear()
  );
  return holiday ? holiday.name : null;
}; 