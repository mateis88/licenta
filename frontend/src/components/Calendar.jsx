import React, { useState, useRef, useEffect } from "react";
import { Button, useTheme, Paper, Typography, Box, IconButton, Grid, Tooltip, Badge } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import InfoBox from './InfoBox';
import '../styles/Calendar.css';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { isRecurringEventOccurrence } from '../utils/recurringEvents';
import { isPublicHoliday, getHolidayName } from '../utils/holidays';
import axios from 'axios';
import CakeIcon from '@mui/icons-material/Cake';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const calendarRef = useRef(null);
  const infoBoxRef = useRef(null);
  const { translations } = useSettings();
  const { user } = useAuth();
  const { events, updateEvents, refreshTrigger } = useCalendar();
  const theme = useTheme();
  const t = translations.calendar;
  const [birthdays, setBirthdays] = useState([]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const startDay = (startOfMonth.getDay() + 6) % 7;
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

        // Get both approved and pending requests
        const relevantRequests = response.data.requests.filter(
          request => request.status === 'approved' || request.status === 'pending'
        );
        console.log('[Calendar] Fetched leave requests:', relevantRequests);
        setLeaveRequests(relevantRequests);
      } catch (err) {
        console.error('[Calendar] Error fetching leave requests:', err);
      }
    };

    fetchLeaveRequests();
  }, [user?.email]);

  // Check if a day is part of an approved leave period
  const isApprovedLeaveDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return leaveRequests.some(request => {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      return date >= start && date <= end && request.status === 'approved';
    });
  };

  // Check if a day is part of a pending leave period
  const isPendingLeaveDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return leaveRequests.some(request => {
      const start = new Date(request.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(request.endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      return date >= start && date <= end && request.status === 'pending';
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
        updateEvents(response.data.events || []);
      } catch (err) {
        console.error('[Calendar] Error fetching events:', err);
      }
    };

    fetchEvents();
  }, [user?.email, updateEvents, refreshTrigger]);

  // Add this new function to check if a day has events
  const hasEvents = (date) => {
    console.log('[Calendar] Checking events for date:', date.toISOString());
    console.log('[Calendar] Current events state:', events);
    
    const hasEvent = events.some(event => {
      // For non-recurring events, check exact date match
      if (!event.recurring) {
      const eventDate = new Date(event.date);
      console.log('[Calendar] Comparing with event date:', eventDate.toISOString());
      const isMatch = eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear();
      
      if (isMatch) {
        console.log('[Calendar] Found matching event:', event);
      }
      return isMatch;
      } else {
        // For recurring events, check if this date is an occurrence
        const isOccurrence = isRecurringEventOccurrence(event, date);
        if (isOccurrence) {
          console.log('[Calendar] Found recurring event occurrence:', event);
        }
        return isOccurrence;
      }
    });
    
    console.log('[Calendar] Has event:', hasEvent);
    return hasEvent;
  };

  // Add this useEffect to fetch birthdays
  useEffect(() => {
    const fetchBirthdays = async () => {
      if (!user?.email) return;
      
      try {
        const response = await axios.get(
          `http://localhost:3000/birthdays/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setBirthdays(response.data.birthdays || []);
      } catch (err) {
        console.error('[Calendar] Error fetching birthdays:', err);
      }
    };

    fetchBirthdays();
  }, [user?.email, currentDate.getFullYear(), currentDate.getMonth()]);

  // Add this function to check if a day has birthdays
  const hasBirthdays = (date) => {
    return birthdays.some(birthday => {
      const birthdayDate = new Date(birthday.birthDate);
      return birthdayDate.getDate() === date.getDate() &&
        birthdayDate.getMonth() === date.getMonth();
    });
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
      const isHoliday = isPublicHoliday(date);
      const isWeekendDay = isWeekend(day);
      const isWeekendOrHoliday = isWeekendDay || isHoliday;
      const isApprovedLeave = !isWeekendOrHoliday && isApprovedLeaveDay(day);
      const isPendingLeave = !isWeekendOrHoliday && isPendingLeaveDay(day);
      const holidayName = getHolidayName(date);
      const hasEvent = hasEvents(date);
      const hasBirthday = hasBirthdays(date);
      
      // Determine the cell's class based on its status
      const cellClass = [
        'calendar-day',
        isSelected ? 'selected' : '',
        isCurrent ? 'current' : '',
        isWeekendOrHoliday ? 'weekend-holiday' : '',
        isHoliday ? 'holiday' : '',
        !isWeekendOrHoliday && isApprovedLeave ? 'approved-leave' : '',
        !isWeekendOrHoliday && isPendingLeave ? 'pending-leave' : '',
        hasEvent ? 'has-event' : '',
        hasBirthday ? 'has-birthday' : '',
        isPastDate ? 'past-date' : ''
      ].filter(Boolean).join(' ');

      // Determine the cell's style based on its status, with weekend/holiday taking priority
      const cellStyle = {
        backgroundColor: isSelected ? theme.palette.primary.main : 
          isWeekendOrHoliday ? theme.palette.info.light :
          isApprovedLeave ? theme.palette.secondary.main :
          isPendingLeave ? theme.palette.warning.light :
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        color: isSelected ? theme.palette.primary.contrastText : 
          isWeekendOrHoliday ? theme.palette.info.contrastText :
          isApprovedLeave ? theme.palette.secondary.contrastText :
          isPendingLeave ? theme.palette.warning.contrastText :
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
          {hasBirthday && (
            <CakeIcon 
              sx={{ 
                fontSize: '0.875rem',
                color: '#FF69B4',
                filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))'
              }} 
            />
          )}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Time Off Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontFamily: '"Roboto Slab", serif', mb: 1, color: theme.palette.text.secondary }}>
                  {t.timeOff || 'Time Off'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Approved Leave */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box className="legend-item approved-leave" />
                    <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                      {t.approvedLeave || 'Approved Leave'}
                    </Typography>
                  </Box>

                  {/* Pending Leave */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box className="legend-item pending-leave" />
                    <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                      {t.pendingLeave || 'Pending Leave'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Special Days Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontFamily: '"Roboto Slab", serif', mb: 1, color: theme.palette.text.secondary }}>
                  {t.specialDays || 'Special Days'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                  {/* Weekend/Holiday */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box className="legend-item weekend-holiday" />
                    <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                      {t.weekendHoliday || 'Weekend/Holiday'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Indicators Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontFamily: '"Roboto Slab", serif', mb: 1, color: theme.palette.text.secondary }}>
                  {t.indicators || 'Indicators'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

                  {/* Birthday Indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CakeIcon sx={{ fontSize: '1.5rem', color: '#FF69B4' }} />
                    <Typography sx={{ fontFamily: '"Roboto Slab", serif' }}>
                      {t.birthdayIndicator || 'Birthday'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Calendar;
  