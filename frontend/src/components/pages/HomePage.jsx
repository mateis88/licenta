import {useState} from 'react'
import {Box, Typography, TextField, Button, useTheme} from '@mui/material'
import { useNavigate } from 'react-router';
import axios from 'axios';
import Calendar from '../Calendar';
import HomeHeader from '../HomeHeader'

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <HomeHeader/>
      <Box sx={{ 
        flex: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}>
        <Calendar/>
      </Box>
    </Box>
  )
}

export default HomePage