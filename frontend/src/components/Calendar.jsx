import React, { useState, useRef, useEffect } from "react";
import { Button, useTheme, Paper, Typography, Box, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import InfoBox from './InfoBox';
import '../styles/Calendar.css';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Something went wrong. Please try again later.</h2>;
    }

    return this.props.children;
  }
}

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
const getRomanianHolidays = (year) => {
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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const calendarRef = useRef(null);
  const infoBoxRef = useRef(null);
  const { translations } = useSettings();
  const { user } = useAuth();
  const theme = useTheme();
  const t = translations.calendar;

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay();
  const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  const prevMonthDays = prevMonthEnd.getDate();

  const changeMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newMonth = prevDate.getMonth() + direction;
      return new Date(prevDate.getFullYear(), newMonth, 1);
    });
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    
    // Set hours, minutes, seconds, and milliseconds to 0 for accurate date comparison
    today.setHours(0, 0, 0, 0);
    clickedDate.setHours(0, 0, 0, 0);
    
    // Only allow selection if the date is today or in the future
    if (clickedDate >= today) {
      setSelectedDay(clickedDate);
    } else {
      // If it's a past date, we'll still show the InfoBox but it will be in read-only mode
      setSelectedDay(clickedDate);
    }
  };

  const isSelectedDay = (day) => {
    if (!selectedDay) return false;
    return (
      day === selectedDay.getDate() &&
      currentDate.getMonth() === selectedDay.getMonth() &&
      currentDate.getFullYear() === selectedDay.getFullYear()
    );
  };

  const isCurrentDay = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Get holidays for the current year
  const holidays = getRomanianHolidays(currentDate.getFullYear());

  // Check if a date is a public holiday
  const isPublicHoliday = (date) => {
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
  const getHolidayName = (date) => {
    const holiday = holidays.find(h => 
      h.date.getDate() === date.getDate() &&
      h.date.getMonth() === date.getMonth() &&
      h.date.getFullYear() === date.getFullYear()
    );
    return holiday ? holiday.name : null;
  };

  // Check if a day is a weekend
  const isWeekend = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
  };

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      if (!user?.email) return;
      
      try {
        const response = await axios.get(
          'http://localhost:3000/requests/all',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Filter only approved requests
        const approvedRequests = response.data.requests.filter(
          request => request.status === 'approved'
        );
        setLeaveRequests(approvedRequests);
      } catch (err) {
        console.error('[Calendar] Error fetching leave requests:', err);
      }
    };

    fetchLeaveRequests();
  }, [user?.email]);

  // Check if a day is part of an approved leave period
  const isApprovedLeaveDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return leaveRequests.some(request => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      return date >= start && date <= end;
    });
  };

  // Add this useEffect to fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.email) return;
      
      try {
        console.log('[Calendar] Fetching events for user:', user.email);
        const response = await axios.get(
          `http://localhost:3000/events/user/${user.email}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log('[Calendar] Received events:', response.data.events);
        setEvents(response.data.events || []);
      } catch (err) {
        console.error('[Calendar] Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [user?.email]);

  // Add this new function to check if a day has events
  const hasEvents = (date) => {
    console.log('[Calendar] Checking events for date:', date.toISOString());
    console.log('[Calendar] Current events state:', events);
    
    const hasEvent = events.some(event => {
      const eventDate = new Date(event.date);
      console.log('[Calendar] Comparing with event date:', eventDate.toISOString());
      const isMatch = eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear();
      
      if (isMatch) {
        console.log('[Calendar] Found matching event:', event);
      }
      return isMatch;
    });
    
    console.log('[Calendar] Has event:', hasEvent);
    return hasEvent;
  };

  const renderCalendarCells = () => {
    const cells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      cells.push(
        <div key={`weekday-${i}`} className="calendar-weekday" style={{ color: theme.palette.text.secondary }}>
          {t.weekDays[i]}
        </div>
      );
    }

    for (let i = startDay - 1; i >= 0; i--) {
      cells.push(
        <Button
          key={`prev-${i}`}
          className="calendar-day adjacent-month"
          variant="text"
          disabled
          sx={{
            color: 'transparent',
            backgroundColor: 'transparent',
            minWidth: '40px',
            width: '40px',
            height: '40px',
            padding: 0,
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        >
          {prevMonthDays - i}
        </Button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const isPastDate = date < today;
      const isSelected = isSelectedDay(day);
      const isCurrent = isCurrentDay(day);
      const isApprovedLeave = isApprovedLeaveDay(day);
      const isHoliday = isPublicHoliday(date);
      const isWeekendDay = isWeekend(day);
      const holidayName = getHolidayName(date);
      const hasEvent = hasEvents(date);
      
      // Determine the cell's class based on its status
      const cellClass = [
        'calendar-day',
        isSelected ? 'selected' : '',
        isCurrent ? 'current' : '',
        isApprovedLeave ? 'approved-leave' : '',
        (isWeekendDay || isHoliday) ? 'weekend-holiday' : '',
        isHoliday ? 'holiday' : '',
        hasEvent ? 'has-event' : '',
        isPastDate ? 'past-date' : ''
      ].filter(Boolean).join(' ');

      // Determine the cell's style based on its status
      const cellStyle = {
        backgroundColor: isSelected ? theme.palette.primary.main : 
          isApprovedLeave ? theme.palette.secondary.main :
          (isWeekendDay || isHoliday) ? theme.palette.info.light :
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        color: isSelected ? theme.palette.primary.contrastText : 
          isApprovedLeave ? theme.palette.secondary.contrastText :
          (isWeekendDay || isHoliday) ? theme.palette.info.contrastText :
          theme.palette.text.primary,
        position: 'relative'
      };

      cells.push(
        <Button
          key={day}
          className={cellClass}
          variant="outlined"
          onClick={() => handleDayClick(day)}
          sx={{
            ...cellStyle,
            opacity: isPastDate ? 0.7 : 1,
            cursor: isPastDate ? 'default' : 'pointer'
          }}
          title={holidayName || ''}
        >
          <span>{day}</span>
          {holidayName && (
            <span className="holiday-indicator" title={holidayName}>•</span>
          )}
          {hasEvent && (
            <span className="event-indicator" title="Event">•</span>
          )}
        </Button>
      );
    }

    const totalCells = cells.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      cells.push(
        <Button
          key={`next-${i}`}
          className="calendar-day adjacent-month"
          variant="text"
          disabled
          sx={{
            color: 'transparent',
            backgroundColor: 'transparent',
            minWidth: '40px',
            width: '40px',
            height: '40px',
            padding: 0,
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        >
          {i}
        </Button>
      );
    }

    return cells;
  };

  return (
    <ErrorBoundary>
      <div className="calendar-wrapper" style={{maxWidth: selectedDay?"60rem":""}}>
        <div 
          className={`calendar-container ${selectedDay ? 'shift-left' : ''}`} 
          ref={calendarRef} 
          style={{ 
            fontFamily: '"Roboto Slab", serif',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
          }}
        >
          <div className="calendar-header">
            <Button variant="text" onClick={() => changeMonth(-1)} style={{ fontFamily: '"Roboto Slab", serif' }}>{"<"}</Button>
            <h2 className="calendar-title" style={{ fontFamily: '"Roboto Slab", serif' }}>
              {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="text" onClick={() => changeMonth(1)} style={{ fontFamily: '"Roboto Slab", serif' }}>{">"}</Button>
          </div>
          <div className="calendar-grid">
            {renderCalendarCells()}
          </div>
        </div>

        <div className={`info-box-wrapper ${selectedDay ? 'slide-in' : ''}`} ref={infoBoxRef}>
          {selectedDay && (
            <InfoBox date={selectedDay} onClose={() => setSelectedDay(null)} />
          )}
        </div>

        {/* Info Button */}
        <IconButton 
          className="info-button"
          onClick={() => setShowLegend(!showLegend)}
          sx={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          <InfoIcon />
        </IconButton>

        {/* Legend */}
        {showLegend && (
          <Paper 
            className="calendar-legend"
            elevation={3}
            sx={{
              position: 'fixed',
              bottom: '80px',
              left: '20px',
              padding: '16px',
              maxWidth: '300px',
              backgroundColor: theme.palette.background.paper,
              zIndex: 1000
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontFamily: '"Roboto Slab", serif' }}>
              {t.legendTitle || 'Calendar Legend'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Weekend/Holiday */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box className="legend-item weekend-holiday" />
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.weekendHoliday || 'Weekend/Holiday'}
                </Typography>
              </Box>

              {/* Approved Leave */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box className="legend-item approved-leave" />
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.approvedLeave || 'Approved Leave'}
                </Typography>
              </Box>

              {/* Current Day */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box className="legend-item current" />
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.currentDay || 'Current Day'}
                </Typography>
              </Box>

              {/* Selected Day */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box className="legend-item selected" />
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.selectedDay || 'Selected Day'}
                </Typography>
              </Box>

              {/* Holiday Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography sx={{ color: '#1976d2', fontSize: '1.5rem', lineHeight: 1 }}>•</Typography>
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.holidayIndicator || 'Public Holiday'}
                </Typography>
              </Box>

              {/* Event Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Typography sx={{ color: '#4caf50', fontSize: '1.5rem', lineHeight: 1 }}>•</Typography>
                <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                  {t.eventIndicator || 'Event'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Calendar;
  