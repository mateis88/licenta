import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import HomeHeader from './HomeHeader';

const ManageEmployees = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { translations } = useSettings();
  const { user } = useAuth();
  const t = translations.common;

  // Only allow access to admin users
  if (!user || user.status !== 'admin') {
    return <Navigate to="/home" replace />;
  }

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
      <HomeHeader />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ color: theme.palette.text.primary }}>
              {t.manageEmployees}
            </Typography>
          </Box>

          {/* Add your employee management content here */}
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            {t.employeeManagementComingSoon}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ManageEmployees; 