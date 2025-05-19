import React, { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button, useTheme } from '@mui/material'
import { useNavigate, useLocation } from 'react-router';
import axios from 'axios';
import Calendar from '../Calendar';
import HomeHeader from '../HomeHeader'
import LeaveRequestForm from '../LeaveRequestForm';

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Effect to handle the /requests/new route
  useEffect(() => {
    if (location.pathname === '/requests/new') {
      setShowRequestForm(true);
    }
  }, [location.pathname]);

  const handleCloseRequestForm = () => {
    setShowRequestForm(false);
    navigate('/home');
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
        overflow: 'hidden', // Prevent scrolling when form is open
      }}
    >
      <HomeHeader/>
      <Box 
        sx={{ 
          flex: 1,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          overflow: 'auto', // Allow scrolling in the main content
          transition: 'margin-right 0.3s ease-in-out',
          marginRight: showRequestForm ? '40%' : 0, // Shift content when form is open
        }}
      >
        <Calendar/>
      </Box>
      <LeaveRequestForm open={showRequestForm} onClose={handleCloseRequestForm} />
    </Box>
  )
}

export default HomePage