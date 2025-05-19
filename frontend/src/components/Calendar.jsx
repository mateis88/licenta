import React, { useState, useRef, useEffect } from "react";
import { Button, Slide, useTheme } from '@mui/material';
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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
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
    setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
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

  // List of public holidays (Romanian holidays for 2024)
  const publicHolidays = [
    { date: '2024-01-01', name: 'Anul Nou' },
    { date: '2024-01-24', name: 'Ziua Unirii Principatelor Române' },
    { date: '2024-04-01', name: 'Paștele Ortodox' },
    { date: '2024-05-01', name: 'Ziua Muncii' },
    { date: '2024-05-03', name: 'Ziua Copilului' },
    { date: '2024-06-01', name: 'Ziua Copilului' },
    { date: '2024-08-15', name: 'Adormirea Maicii Domnului' },
    { date: '2024-11-30', name: 'Sfântul Andrei' },
    { date: '2024-12-01', name: 'Ziua Națională a României' },
    { date: '2024-12-25', name: 'Crăciunul' },
    { date: '2024-12-26', name: 'A doua zi de Crăciun' }
  ];

  // Check if a date is a public holiday
  const isPublicHoliday = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return publicHolidays.some(holiday => holiday.date === dateString);
  };

  // Get holiday name if date is a holiday
  const getHolidayName = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const holiday = publicHolidays.find(h => h.date === dateString);
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

  const renderCalendarCells = () => {
    const cells = [];

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
      const isSelected = isSelectedDay(day);
      const isCurrent = isCurrentDay(day);
      const isApprovedLeave = isApprovedLeaveDay(day);
      const isHoliday = isPublicHoliday(date);
      const isWeekendDay = isWeekend(day);
      const holidayName = getHolidayName(date);
      
      // Determine the cell's class based on its status
      const cellClass = [
        'calendar-day',
        isSelected ? 'selected' : '',
        isCurrent ? 'current' : '',
        isApprovedLeave ? 'approved-leave' : '',
        (isWeekendDay || isHoliday) ? 'weekend-holiday' : '',
        isHoliday ? 'holiday' : ''
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
          sx={cellStyle}
          title={holidayName || ''}
        >
          {day}
          {holidayName && (
            <span className="holiday-indicator" title={holidayName}>•</span>
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
      </div>
    </ErrorBoundary>
  );
};

export default Calendar;
  