/**
 * Utility functions for handling recurring events
 */

/**
 * Calculate all occurrences of a recurring event within a given date range
 * @param {Object} event - The recurring event object
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @returns {Array} Array of dates when the event occurs
 */
export const calculateRecurringOccurrences = (event, startDate, endDate) => {
  if (!event.recurring || !event.originalDate || !event.frequency) {
    return [];
  }

  const occurrences = [];
  const originalDate = new Date(event.originalDate);
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to match the original event time
  const eventTime = new Date(event.date);
  originalDate.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);

  let currentDate = new Date(originalDate);

  // If the original date is before our start range, calculate the first occurrence in range
  if (currentDate < start) {
    currentDate = calculateNextOccurrence(originalDate, event.frequency, start);
  }

  // Generate occurrences until we exceed the end date
  while (currentDate <= end) {
    occurrences.push(new Date(currentDate));
    currentDate = calculateNextOccurrence(currentDate, event.frequency);
  }

  return occurrences;
};

/**
 * Calculate the next occurrence of a recurring event
 * @param {Date} currentDate - Current occurrence date
 * @param {string} frequency - Frequency of recurrence (weekly, monthly, yearly)
 * @param {Date} afterDate - Optional: only return occurrences after this date
 * @returns {Date} Next occurrence date
 */
export const calculateNextOccurrence = (currentDate, frequency, afterDate = null) => {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      return currentDate;
  }

  // If afterDate is provided, keep calculating until we're after it
  if (afterDate && nextDate <= afterDate) {
    return calculateNextOccurrence(nextDate, frequency, afterDate);
  }

  return nextDate;
};

/**
 * Check if a specific date is an occurrence of a recurring event
 * @param {Object} event - The recurring event object
 * @param {Date} checkDate - Date to check
 * @returns {boolean} True if the date is an occurrence of the event
 */
export const isRecurringEventOccurrence = (event, checkDate) => {
  if (!event.recurring || !event.originalDate || !event.frequency) {
    return false;
  }

  const originalDate = new Date(event.originalDate);
  const check = new Date(checkDate);

  // Set time to match the original event time for comparison
  const eventTime = new Date(event.date);
  originalDate.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);
  check.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);

  // If the check date is before the original date, it's not an occurrence
  if (check < originalDate) {
    return false;
  }

  let isOccurrence = false;

  switch (event.frequency) {
    case 'weekly':
      // Check if the difference in days is a multiple of 7
      const daysDiff = Math.floor((check - originalDate) / (1000 * 60 * 60 * 24));
      isOccurrence = daysDiff % 7 === 0;
      break;
    
    case 'monthly':
      // Check if it's the same day of the month
      isOccurrence = check.getDate() === originalDate.getDate();
      break;
    
    case 'yearly':
      // Check if it's the same month and day
      isOccurrence = check.getMonth() === originalDate.getMonth() && 
                     check.getDate() === originalDate.getDate();
      break;
    
    default:
      isOccurrence = false;
  }

  console.log('[RecurringEvents] Checking occurrence:', {
    eventName: event.name,
    frequency: event.frequency,
    originalDate: originalDate.toISOString(),
    checkDate: check.toISOString(),
    isOccurrence
  });

  return isOccurrence;
};

/**
 * Expand a list of events to include all recurring occurrences within a date range
 * @param {Array} events - Array of event objects
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @returns {Array} Array of events with recurring occurrences expanded
 */
export const expandRecurringEvents = (events, startDate, endDate) => {
  const expandedEvents = [];

  events.forEach(event => {
    if (event.recurring) {
      // Get all occurrences of this recurring event
      const occurrences = calculateRecurringOccurrences(event, startDate, endDate);
      
      // Create event objects for each occurrence
      occurrences.forEach(occurrenceDate => {
        expandedEvents.push({
          ...event,
          _id: `${event._id}_${occurrenceDate.getTime()}`, // Unique ID for each occurrence
          date: occurrenceDate.toISOString(),
          isRecurringOccurrence: true,
          originalEventId: event._id
        });
      });
    } else {
      // Non-recurring events are added as-is
      expandedEvents.push(event);
    }
  });

  return expandedEvents;
}; 