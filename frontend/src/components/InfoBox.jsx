import React, { useState, useEffect } from "react";
import { 
  Paper, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText,
  Divider,
  CircularProgress,
  Box,
  useTheme,
  TextField,
  Grid,
  IconButton,
  Collapse,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Autocomplete,
  InputAdornment
} from "@mui/material";
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import CakeIcon from '@mui/icons-material/Cake';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { isRecurringEventOccurrence } from '../utils/recurringEvents';
import { isPublicHoliday, getHolidayName } from '../utils/holidays';
import LocationPicker from './LocationPicker';
import EventMap from './EventMap';
import axios from 'axios';
import "../styles/InfoBox.css";

const InfoBox = ({ date, onClose }) => {
  const theme = useTheme();
  const { translations } = useSettings();
  const { user } = useAuth();
  const { refreshEvents } = useCalendar();
  const t = translations.common;
  const [birthdays, setBirthdays] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEvents, setShowEvents] = useState(true);
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: {
      name: '',
      latitude: null,
      longitude: null
    },
    startTime: '',
    endTime: '',
    guests: [],
    recurring: false,
    frequency: 'weekly',
    type: 'personal',
    invitations: [],
    inviteDepartment: ''
  });
  const [eventError, setEventError] = useState('');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if the date is in the past
  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  useEffect(() => {
    const fetchBirthdays = async () => {
      if (!date) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Get the year and month for the API request
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Convert to 1-based month
        
        const response = await axios.get(
          `http://localhost:3000/birthdays/${year}/${month}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Filter birthdays for the specific day
        const dayBirthdays = response.data.birthdays.filter(birthday => {
          const birthdayDate = new Date(birthday.birthDate);
          return birthdayDate.getDate() === date.getDate();
        });

        setBirthdays(dayBirthdays);
      } catch (err) {
        console.error('Error fetching birthdays:', err);
        setError(t.failedToLoadBirthdays || 'Failed to load birthdays');
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, [date, t]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!date || !user?.email) return;
      
      try {
        setLoadingEvents(true);
        const response = await axios.get(
          `http://localhost:3000/events/user/${user.email}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Filter events for the selected date (including recurring events)
        const dayEvents = response.data.events.filter(event => {
          if (!event.recurring) {
            // For non-recurring events, check exact date match
            const eventDate = new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
          } else {
            // For recurring events, check if this date is an occurrence
            return isRecurringEventOccurrence(event, date);
          }
        }).map(event => {
          // For recurring events, create a unique ID for this occurrence
          if (event.recurring) {
            return {
              ...event,
              _id: `${event._id}_${date.getTime()}`,
              originalEventId: event._id,
              isRecurringOccurrence: true
            };
          }
          return event;
        });

        setEvents(dayEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [date, user?.email]);

  // Fetch users and departments when event form is opened
  useEffect(() => {
    const fetchUsersAndDepartments = async () => {
      if (!showEventForm) return;
      
      try {
        setLoadingUsers(true);
        
        // Fetch users for invitations
        const usersResponse = await axios.get(
          'http://localhost:3000/users-for-invitations',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setAllUsers(usersResponse.data.users);

        // Fetch departments
        const departmentsResponse = await axios.get(
          'http://localhost:3000/departments',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setDepartments(departmentsResponse.data.departments);
      } catch (err) {
        console.error('Error fetching users and departments:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsersAndDepartments();
  }, [showEventForm]);

  const handleEventFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object properties like location.name
      const [parent, child] = name.split('.');
      setEventForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEventForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (eventError) {
      setEventError('');
    }
  };

  const handleLocationSelect = (location) => {
    setEventForm(prev => ({
      ...prev,
      location: location
    }));
  };

  const openLocationPicker = () => {
    setLocationPickerOpen(true);
  };

  const handleEditEvent = (event) => {
    // Convert event data to form format
    const eventData = {
      name: event.name,
      description: event.description || '',
      location: event.location?.name ? {
        name: event.location.name,
        latitude: event.location.latitude || 0,
        longitude: event.location.longitude || 0
      } : {
        name: event.location || '',
        latitude: 0,
        longitude: 0
      },
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      recurring: event.recurring || false,
      frequency: event.frequency || 'weekly',
      invitations: event.invitations || [],
      inviteDepartment: event.inviteDepartment || ''
    };

    setEventForm(eventData);
    setEditingEvent(event);
    setIsEditing(true);
    setShowEventForm(true);
  };

  const resetEventForm = () => {
    setEventForm({
      name: '',
      description: '',
      location: {
        name: '',
        latitude: null,
        longitude: null
      },
      startTime: '',
      endTime: '',
      guests: [],
      recurring: false,
      frequency: 'weekly',
      type: 'personal',
      invitations: [],
      inviteDepartment: ''
    });
    setEventError('');
    setEditingEvent(null);
    setIsEditing(false);
  };

  const closeEventForm = () => {
    setShowEventForm(false);
    resetEventForm();
  };

  const validateEventForm = () => {
    if (!eventForm.name.trim()) {
      setEventError(t.eventNameRequired);
      return false;
    }
    if (!eventForm.location.name.trim()) {
      setEventError(t.locationRequired);
      return false;
    }
    if (!eventForm.startTime || !eventForm.endTime) {
      setEventError(t.timeRequired);
      return false;
    }

    // Validate private event invitations
    if (eventForm.type === 'private') {
      if (!eventForm.invitations.length && !eventForm.inviteDepartment) {
        setEventError(t.privateEventInvitationsRequired || 'Please invite at least one person or select a department');
        return false;
      }
    }

    // Convert times to minutes for comparison
    const [startHours, startMinutes] = eventForm.startTime.split(':').map(Number);
    const [endHours, endMinutes] = eventForm.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      setEventError(t.endTimeAfterStart);
      return false;
    }

    return true;
  };

  const handleCreateEvent = async () => {
    try {
      setEventError('');
      
      if (!validateEventForm()) {
        return;
      }

      const eventData = {
        ...eventForm,
        date: date.toISOString(),
        email: user.email
      };

      // Add private event data if it's a private event
      if (eventForm.type === 'private') {
        if (eventForm.invitations.length > 0) {
          eventData.invitations = eventForm.invitations;
        } else if (eventForm.inviteDepartment) {
          eventData.inviteDepartment = eventForm.inviteDepartment;
        }
      }

      // Add recurring event data if it's a recurring event
      if (eventForm.recurring) {
        eventData.recurring = true;
        eventData.frequency = eventForm.frequency;
        eventData.originalDate = date.toISOString();
      }

      let response;
      if (isEditing && editingEvent) {
        // Update existing event
        response = await axios.put(
          `http://localhost:3000/events/${editingEvent._id}`,
          eventData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      } else {
        // Create new event
        response = await axios.post(
          'http://localhost:3000/events',
          eventData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      // Update the events list
      if (isEditing && editingEvent) {
        setEvents(prev => prev.map(event => 
          event._id === editingEvent._id 
            ? { ...response.data.event, _id: editingEvent._id }
            : event
        ));
      } else {
        setEvents(prev => [...prev, response.data.event]);
      }
      
      // Reset form and hide it
      closeEventForm();

      // Refresh events
      refreshEvents();
    } catch (err) {
      setEventError(err.response?.data?.message || t.failedToCreateEvent);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      console.log('[InfoBox] Attempting to delete event:', eventId);
      
      // For recurring events, we need to delete the original event
      const eventToDelete = events.find(event => event._id === eventId);
      const actualEventId = eventToDelete?.originalEventId || eventId;
      
      const response = await axios.delete(
        `http://localhost:3000/events/${actualEventId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('[InfoBox] Delete response:', response.data);
      
      // Remove the deleted event from the list
      setEvents(prev => {
        const updatedEvents = prev.filter(event => {
          // For recurring events, remove all occurrences of the same original event
          if (eventToDelete?.recurring) {
            return event.originalEventId !== eventToDelete.originalEventId;
          }
          // For non-recurring events, just remove the specific event
          return event._id !== eventId;
        });
        
        console.log('[InfoBox] Updated events list:', updatedEvents);
        return updatedEvents;
      });

      // Refresh events
      refreshEvents();
    } catch (err) {
      console.error('[InfoBox] Error deleting event:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Show error to user
      setEventError(err.response?.data?.message || 'Failed to delete event');
      
      // Clear error after 3 seconds
      setTimeout(() => setEventError(''), 3000);
    }
  };

  const toggleEvent = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Sort events chronologically by start time
  const sortEventsByTime = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      // Convert time strings to comparable values (HH:MM format)
      const timeA = a.startTime.replace(':', '');
      const timeB = b.startTime.replace(':', '');
      return parseInt(timeA) - parseInt(timeB);
    });
  };

  if (!date) return null;

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = translations.calendar.monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleTimeChange = (name) => (newTime) => {
    if (newTime) {
      const hours = newTime.getHours().toString().padStart(2, '0');
      const minutes = newTime.getMinutes().toString().padStart(2, '0');
      setEventForm(prev => ({
        ...prev,
        [name]: `${hours}:${minutes}`
      }));
    } else {
      setEventForm(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Helper functions for private events
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddInvitation = (userId) => {
    setEventForm(prev => ({
      ...prev,
      invitations: [...prev.invitations, userId]
    }));
  };

  const handleRemoveInvitation = (userId) => {
    setEventForm(prev => ({
      ...prev,
      invitations: prev.invitations.filter(id => id !== userId)
    }));
  };

  const handleInviteDepartment = (department) => {
    setEventForm(prev => ({
      ...prev,
      inviteDepartment: department,
      invitations: [] // Clear individual invitations when inviting department
    }));
  };

  const handleClearDepartmentInvitation = () => {
    setEventForm(prev => ({
      ...prev,
      inviteDepartment: ''
    }));
  };

  const getInvitedUsers = () => {
    return allUsers.filter(user => eventForm.invitations.includes(user.id));
  };

  return (
    <Paper 
      className="info-box" 
      elevation={3}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderLeft: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        height: '600px', // Fixed height
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="info-box-header">
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          {formatDate(date)}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      
      <Divider />
      
      {/* Scrollable content area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        px: 2,
        py: 1
      }}>
        {/* Birthdays Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary 
              }}
            >
              {t.todaysBirthdays}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& svg': {
                  fontSize: '1.75rem',
                  filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))',
                  '& path': {
                    fill: 'url(#cakeGradient)'
                  }
                }
              }}
            >
              <svg width="0" height="0">
                <linearGradient id="cakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF69B4" />
                  <stop offset="50%" stopColor="#FFB6C1" />
                  <stop offset="100%" stopColor="#FF69B4" />
                </linearGradient>
              </svg>
              <CakeIcon />
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : birthdays.length === 0 ? (
            <Typography 
              variant="body2" 
              sx={{ color: theme.palette.text.secondary }}
            >
              {t.noBirthdaysToday}
            </Typography>
          ) : (
            <List>
              {birthdays.map((birthday) => (
                <ListItem key={birthday._id || birthday.firstName + birthday.lastName} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={birthday.profilePicture ? `http://localhost:3000${birthday.profilePicture}` : null}
                      alt={`${birthday.firstName} ${birthday.lastName}`}
                    >
                      {birthday.firstName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`${birthday.firstName} ${birthday.lastName}`}
                    secondary={birthday.department}
                    sx={{ 
                      '& .MuiListItemText-primary': {
                        color: theme.palette.text.primary
                      },
                      '& .MuiListItemText-secondary': {
                        color: theme.palette.text.secondary
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Holiday Section */}
        {isPublicHoliday(date) && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: theme.palette.text.primary 
                }}
              >
                {t.publicHoliday || 'Public Holiday'}
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': {
                    fontSize: '1.75rem',
                    filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))',
                    color: theme.palette.mode === 'dark' 
                      ? '#FFD54F' 
                      : '#E65100'
                  }
                }}
              >
                <CelebrationIcon />
              </Box>
            </Box>
            
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 193, 7, 0.15)' 
                  : 'rgba(255, 193, 7, 0.1)',
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(255, 193, 7, 0.4)' 
                  : 'rgba(255, 193, 7, 0.3)'}`
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? '#FFD54F' 
                    : '#E65100',
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                {getHolidayName(date)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 213, 79, 0.9)' 
                    : 'rgba(230, 81, 0, 0.8)',
                  lineHeight: 1.5
                }}
              >
                {t.holidayDescription || 'This is a public holiday in Romania. Most businesses and government offices are closed.'}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Events Section - Show on all days */}
        <>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: theme.palette.text.primary 
                }}
              >
                {t.events}
              </Typography>
              <EventIcon sx={{ color: theme.palette.primary.main }} />
            </Box>

            {loadingEvents ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : events.length === 0 ? (
              <Typography 
                variant="body2" 
                sx={{ color: theme.palette.text.secondary }}
              >
                {t.noEvents}
              </Typography>
            ) : (
              <List>
                {sortEventsByTime(events).map((event) => (
                  <Paper
                    key={event._id}
                    elevation={1}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <ListItem 
                      sx={{ 
                        px: 2,
                        py: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleEvent(event._id)}
                    >
                      <Box sx={{ 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: theme.palette.text.primary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {event.name}
                          {event.recurring && (
                            <RepeatIcon 
                              fontSize="small" 
                              sx={{ 
                                color: theme.palette.primary.main,
                                fontSize: '1rem'
                              }} 
                            />
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!isPastDate() && event.email === user.email && (
                            <>
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event._id);
                                }}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton size="small">
                            {expandedEvents[event._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>

                    <Collapse in={expandedEvents[event._id]}>
                      <Box sx={{ px: 2, pb: 2 }}>
                        {event.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              mb: 1
                            }}
                          >
                            {event.description}
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <LocationOnIcon fontSize="small" />
                          {event.location?.name || event.location}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <EventIcon fontSize="small" />
                          {`${event.startTime} - ${event.endTime}`}
                        </Typography>
                        {event.type === 'public' && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1
                            }}
                          >
                            <PersonIcon fontSize="small" />
                            {t.createdBy || 'Created by'}: {event.email}
                          </Typography>
                        )}
                        {event.type === 'private' && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1
                            }}
                          >
                            <LockIcon fontSize="small" />
                            {event.inviteDepartment ? 
                              `${t.privateEventDepartment || 'Private event'} - ${t.invitedDepartment || 'Invited department'}: ${event.inviteDepartment}` :
                              `${t.privateEvent || 'Private event'} - ${t.invitedUsers || 'Invited users'}: ${event.invitations?.length || 0}`
                            }
                          </Typography>
                        )}
                        {event.recurring && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1
                            }}
                          >
                            <RepeatIcon fontSize="small" />
                            {event.frequency === 'weekly' && (t.everyWeekOnSelectedDay || 'Every week on the selected weekday')}
                            {event.frequency === 'monthly' && (t.everyMonthOnSelectedDate || 'Every month on the selected date')}
                            {event.frequency === 'yearly' && (t.everyYearOnSameDay || 'Every year on the same day')}
                          </Typography>
                        )}
                        
                        {/* Event Location Map */}
                        <EventMap 
                          location={event.location} 
                          height={120}
                        />
                      </Box>
                    </Collapse>
                  </Paper>
                ))}
              </List>
            )}
          </Box>

          {/* Event Creation Form */}
          <Collapse in={showEventForm}>
            <Box sx={{ p: 2, mt: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                  {isEditing ? (t.editEvent || 'Edit Event') : (t.createEvent || 'Create Event')}
                </Typography>
                <IconButton onClick={closeEventForm} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t.eventType || 'Event Type'}</InputLabel>
                    <Select
                      name="type"
                      value={eventForm.type}
                      onChange={handleEventFormChange}
                      label={t.eventType || 'Event Type'}
                    >
                      <MenuItem value="personal">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          {t.personalEvent || 'Personal Event'}
                        </Box>
                      </MenuItem>
                      <MenuItem value="public">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PublicIcon fontSize="small" />
                          {t.publicEvent || 'Public Event'}
                        </Box>
                      </MenuItem>
                      <MenuItem value="private">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockIcon fontSize="small" />
                          {t.privateEvent || 'Private Event'}
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.eventName}
                    name="name"
                    value={eventForm.name}
                    onChange={handleEventFormChange}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.eventDescription}
                    name="description"
                    value={eventForm.description}
                    onChange={handleEventFormChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t.location} *
                    </Typography>
                    {eventForm.location.name ? (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        p: 2, 
                        border: 1, 
                        borderColor: 'primary.main', 
                        borderRadius: 1,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }}>
                        <LocationOnIcon />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {eventForm.location.name}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={openLocationPicker}
                          sx={{ 
                            color: 'primary.contrastText',
                            borderColor: 'primary.contrastText',
                            '&:hover': {
                              borderColor: 'primary.contrastText',
                              bgcolor: 'primary.main'
                            }
                          }}
                        >
                          {t.changeLocation || 'Change'}
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={openLocationPicker}
                        startIcon={<LocationOnIcon />}
                        sx={{ 
                          py: 1.5,
                          borderStyle: 'dashed',
                          borderColor: 'text.secondary',
                          color: 'text.secondary',
                          '&:hover': {
                            borderColor: 'primary.main',
                            color: 'primary.main'
                          }
                        }}
                      >
                        {t.selectLocation || 'Select Location'}
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label={t.startTime}
                    value={eventForm.startTime ? new Date(`2000-01-01T${eventForm.startTime}`) : null}
                    onChange={handleTimeChange('startTime')}
                    format="HH:mm"
                    ampm={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: "small"
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label={t.endTime}
                    value={eventForm.endTime ? new Date(`2000-01-01T${eventForm.endTime}`) : null}
                    onChange={handleTimeChange('endTime')}
                    format="HH:mm"
                    ampm={false}
                    minTime={eventForm.startTime ? new Date(`2000-01-01T${eventForm.startTime}`) : undefined}
                    maxTime={new Date('2000-01-01T23:59')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: "small"
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={eventForm.recurring}
                        onChange={handleEventFormChange}
                        name="recurring"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RepeatIcon fontSize="small" />
                        {t.recurring || 'Recurring Event'}
                      </Box>
                    }
                  />
                </Grid>
                {eventForm.recurring && (
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend" sx={{ mb: 1 }}>
                        {t.recurrenceFrequency || 'Recurrence Frequency'}
                      </FormLabel>
                      <RadioGroup
                        name="frequency"
                        value={eventForm.frequency}
                        onChange={handleEventFormChange}
                      >
                        <FormControlLabel 
                          value="weekly" 
                          control={<Radio />} 
                          label={t.everyWeekOnSelectedDay || 'Every week on the selected weekday'} 
                        />
                        <FormControlLabel 
                          value="monthly" 
                          control={<Radio />} 
                          label={t.everyMonthOnSelectedDate || 'Every month on the selected date'} 
                        />
                        <FormControlLabel 
                          value="yearly" 
                          control={<Radio />} 
                          label={t.everyYearOnSameDay || 'Every year on the same day'} 
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                )}
                {eventForm.type === 'private' && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon fontSize="small" />
                        {t.invitations || 'Invitations'}
                      </Typography>
                      
                      {/* Department Invitation Option */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {t.inviteEntireDepartment || 'Invite Entire Department'}
                        </Typography>
                        <FormControl fullWidth size="small">
                          <InputLabel>{t.selectDepartment || 'Select Department'}</InputLabel>
                          <Select
                            value={eventForm.inviteDepartment}
                            onChange={(e) => handleInviteDepartment(e.target.value)}
                            label={t.selectDepartment || 'Select Department'}
                          >
                            <MenuItem value="">
                              <em>{t.none || 'None'}</em>
                            </MenuItem>
                            {departments.map((dept) => (
                              <MenuItem key={dept.name} value={dept.name}>
                                {dept.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {eventForm.inviteDepartment && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`Inviting all ${eventForm.inviteDepartment} members`}
                              onDelete={handleClearDepartmentInvitation}
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Individual Invitations */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {t.individualInvitations || 'Individual Invitations'}
                        </Typography>
                        
                        {/* Search and Filter */}
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder={t.searchUsers || 'Search users by name or email...'}
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{t.filterByDepartment || 'Filter by Department'}</InputLabel>
                            <Select
                              value={selectedDepartment}
                              onChange={(e) => setSelectedDepartment(e.target.value)}
                              label={t.filterByDepartment || 'Filter by Department'}
                            >
                              <MenuItem value="all">{t.allDepartments || 'All Departments'}</MenuItem>
                              {departments.map((dept) => (
                                <MenuItem key={dept.name} value={dept.name}>
                                  {dept.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        {/* Users List */}
                        <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          {loadingUsers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : (
                            <List dense>
                              {filteredUsers.map((user) => {
                                const isInvited = eventForm.invitations.includes(user.id);
                                return (
                                  <ListItem
                                    key={user.id}
                                    sx={{
                                      borderBottom: 1,
                                      borderColor: 'divider',
                                      '&:last-child': { borderBottom: 0 }
                                    }}
                                  >
                                    <ListItemText
                                      primary={user.fullName}
                                      secondary={`${user.email} • ${user.department}`}
                                    />
                                    <ListItemSecondaryAction>
                                      <Button
                                        variant={isInvited ? "outlined" : "contained"}
                                        size="small"
                                        onClick={() => isInvited ? handleRemoveInvitation(user.id) : handleAddInvitation(user.id)}
                                        color={isInvited ? "error" : "primary"}
                                      >
                                        {isInvited ? (t.remove || 'Remove') : (t.add || 'Add')}
                                      </Button>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                );
                              })}
                            </List>
                          )}
                        </Box>

                        {/* Selected Invitations */}
                        {eventForm.invitations.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              {t.selectedInvitations || 'Selected Invitations'} ({eventForm.invitations.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {getInvitedUsers().map((user) => (
                                <Chip
                                  key={user.id}
                                  label={user.fullName}
                                  onDelete={() => handleRemoveInvitation(user.id)}
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
                {eventError && (
                  <Grid item xs={12}>
                    <Typography color="error" variant="body2">
                      {eventError}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateEvent}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    {isEditing ? (t.updateEvent || 'Update Event') : (t.create || 'Create')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </>
      </Box>

      {/* Create Event Button - Only show for future dates and when form is not open */}
      {!isPastDate() && !showEventForm && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16,
          zIndex: 1
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowEventForm(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 2,
              py: 1
            }}
          >
            {t.createEvent}
          </Button>
        </Box>
      )}

      {/* Location Picker Dialog */}
      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onChange={handleLocationSelect}
        value={eventForm.location}
        label={t.selectEventLocation || "Select Event Location"}
        required={true}
      />
    </Paper>
  );
};

export default InfoBox;
