import React from 'react';
import { Box, Typography, Paper, Container, useTheme } from '@mui/material';
import HomeHeader from '../HomeHeader';

const RequestsPage = () => {
  const theme = useTheme();

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
      <HomeHeader showSettings={false} />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
            My Requests
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default RequestsPage; 