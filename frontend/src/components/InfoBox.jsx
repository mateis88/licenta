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
  ListItemSecondaryAction
} from "@mui/material";
import CakeIcon from '@mui/icons-material/Cake';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import "../styles/InfoBox.css";

const InfoBox = ({ date, onClose }) => {
  const { translations } = useSettings();
  const { user } = useAuth();
  const theme = useTheme();
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
    location: '',
    startTime: '',
    endTime: '',
    guests: []
  });
  const [eventError, setEventError] = useState('');
  const [expandedEvents, setExpandedEvents] = useState({});

  useEffect(() => {
    const fetchBirthdays = async () => {
      if (!date) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Month is 0-based in JavaScript Date, but we need 1-based for the API
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const response = await axios.get(
          `http://localhost:3000/birthdays/${month}/${day}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setBirthdays(response.data.users);
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

        // Filter events for the selected date
        const dayEvents = response.data.events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === date.getDate() &&
                 eventDate.getMonth() === date.getMonth() &&
                 eventDate.getFullYear() === date.getFullYear();
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

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async () => {
    try {
      setEventError('');
      const response = await axios.post(
        'http://localhost:3000/events',
        {
          ...eventForm,
          date: date.toISOString(),
          email: user.email
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Add the new event to the list
      setEvents(prev => [...prev, response.data.event]);
      
      // Reset form and hide it
      setEventForm({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        guests: []
      });
      setShowEventForm(false);
    } catch (err) {
      setEventError(err.response?.data?.message || t.failedToCreateEvent);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      console.log('[InfoBox] Attempting to delete event:', eventId);
      
      const response = await axios.delete(
        `http://localhost:3000/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('[InfoBox] Delete response:', response.data);
      
      // Remove the deleted event from the list
      setEvents(prev => {
        const updatedEvents = prev.filter(event => event._id !== eventId);
        console.log('[InfoBox] Updated events list:', updatedEvents);
        return updatedEvents;
      });
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

  if (!date) return null;

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = translations.calendar.monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
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
        <Button size="small" onClick={onClose}>{t.close}</Button>
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
              {birthdays.map((user) => (
                <ListItem key={user.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={user.profilePicture ? `http://localhost:3000${user.profilePicture}` : null}
                      alt={user.fullName}
                    >
                      {user.fullName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.fullName}
                    sx={{ 
                      '& .MuiListItemText-primary': {
                        color: theme.palette.text.primary
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Events Section */}
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
              {events.map((event) => (
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
                          color: theme.palette.text.primary 
                        }}
                      >
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event expansion when clicking delete
                            handleDeleteEvent(event._id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
                        <EventIcon fontSize="small" />
                        {`${event.location} • ${event.startTime} - ${event.endTime}`}
                      </Typography>
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
                {t.createEvent}
              </Typography>
              <IconButton onClick={() => setShowEventForm(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
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
                <TextField
                  fullWidth
                  label={t.location}
                  name="location"
                  value={eventForm.location}
                  onChange={handleEventFormChange}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t.startTime}
                  name="startTime"
                  type="time"
                  value={eventForm.startTime}
                  onChange={handleEventFormChange}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t.endTime}
                  name="endTime"
                  type="time"
                  value={eventForm.endTime}
                  onChange={handleEventFormChange}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
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
                  {t.create}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>

      {/* Create Event Button */}
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
    </Paper>
  );
};

export default InfoBox;
