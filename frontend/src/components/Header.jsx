import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translations } = useSettings();
  const t = translations.common;

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            color: 'text.primary',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/home')}
        >
          {t.appName}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/manage-employees')}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                px: 2
              }}
            >
              {t.manageEmployees}
            </Button>
          )}
          
          <IconButton 
            onClick={() => navigate(`/profile/${user?._id}`)}
            sx={{ color: 'text.primary' }}
          >
            <AccountCircleIcon />
          </IconButton>
          
          <IconButton 
            onClick={() => navigate('/settings')}
            sx={{ color: 'text.primary' }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 