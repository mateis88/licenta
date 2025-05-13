import React, { useState, useRef } from "react";
import { Button, Slide, useTheme } from '@mui/material';
import InfoBox from './InfoBox';
import '../styles/Calendar.css';
import { useSettings } from '../contexts/SettingsContext';

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
  const calendarRef = useRef(null);
  const infoBoxRef = useRef(null);
  const { translations } = useSettings();
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
          variant="outlined"
          disabled
          sx={{
            color: theme.palette.text.disabled,
            borderColor: theme.palette.divider
          }}
        >
          {prevMonthDays - i}
        </Button>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isSelectedDay(day);
      const isCurrent = isCurrentDay(day);
      cells.push(
        <Button
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
          variant="outlined"
          onClick={() => handleDayClick(day)}
          sx={{
            backgroundColor: isSelected ? '#1976d2' : isCurrent ? '#ff9800' : 'transparent',
            color: isSelected ? 'white' : isCurrent ? 'white' : 'inherit',
            borderColor: theme.palette.divider,
            '&:hover': {
              backgroundColor: isSelected ? '#1565c0' : isCurrent ? '#f57c00' : 'rgba(25, 118, 210, 0.04)',
            },
          }}
        >
          {day}
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
          variant="outlined"
          disabled
          sx={{
            borderColor: theme.palette.divider
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
  