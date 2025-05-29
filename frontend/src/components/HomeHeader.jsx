import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ratone from '../assets/El_ratone.jpg';
import { useNavigate, useLocation } from 'react-router';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';

function ResponsiveAppBar({ showSettings = true }) {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { translations } = useSettings();
  const { logout, user } = useAuth();
  const theme = useTheme();
  const t = translations.common;

  // Determine if we should show settings based on the current path
  const shouldShowSettings = location.pathname !== '/login' && location.pathname !== '/register';

  // Determine if we should show the back button
  const shouldShowBackButton = location.pathname !== '/login' && 
                             location.pathname !== '/home' && 
                             location.pathname !== '/register';

  const settings = [
    { key: 'profile', label: t.profile },
    { key: 'settings', label: t.settings },
    { key: 'logout', label: t.logout }
  ];

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuClick = (setting) => {
    handleCloseUserMenu();
    if (setting === 'logout') {
      logout();
      navigate('/login');
    } else if (setting === 'profile') {
      if (user && user.id) {
        navigate(`/profile/${user.id}`);
      } else {
        console.error('User ID not available for profile navigation');
      }
    } else if (setting === 'settings') {
      navigate('/settings');
    }
  };

  const handleLogoClick = () => {
    const currentPath = location.pathname;
    if (currentPath === '/register') {
      navigate('/login');
    } else if (currentPath !== '/login') {
      navigate('/home');
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    // Define the back navigation logic based on current path
    const currentPath = location.pathname;
    if (currentPath.startsWith('/profile/')) {
      navigate('/home');
    } else if (currentPath === '/manage-employees') {
      navigate('/home');
    } else if (currentPath === '/manage-requests') {
      navigate('/manage-employees');
    } else if (currentPath === '/requests') {
      navigate('/home');
    } else if (currentPath === '/settings') {
      navigate('/home');
    } else {
      navigate(-1); // Fallback to browser's back functionality
    }
  };

  // Get the first letter of the user's first name
  const getInitials = () => {
    if (user && user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Get profile picture URL
  const getProfilePicUrl = () => {
    if (user?.profilePicture) {
      // Remove any leading slash to avoid double slashes
      const picturePath = user.profilePicture.startsWith('/') 
        ? user.profilePicture.slice(1) 
        : user.profilePicture;
      return `http://localhost:3000/${picturePath}`;
    }
    return null;
  };

  // Check if user is admin
  const isAdmin = user?.status === 'admin';

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Container 
        maxWidth={false} 
        sx={{ 
          px: { xs: 2, sm: 4, md: 6, lg: 8 },
          width: '100%'
        }}
      >
        <Toolbar disableGutters sx={{ justifyContent: shouldShowSettings ? 'space-between' : 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {shouldShowBackButton && (
              <IconButton
                onClick={handleBackClick}
                sx={{
                  color: 'text.primary',
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box
              component="img"
              src={ratone}
              alt="Logo"
              onClick={handleLogoClick}
              sx={{
                height: 50,
                width: 'auto',
                objectFit: 'contain',
                display: { xs: 'none', md: 'flex' },
                cursor: location.pathname !== '/login' ? 'pointer' : 'default',
                '&:hover': {
                  opacity: location.pathname !== '/login' ? 0.8 : 1
                }
              }}
            />
            {location.pathname === '/home' && (
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                gap: 2,
                ml: 4
              }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/requests')}
                  startIcon={<ListAltIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                >
                  {t.myRequests}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/requests/new')}
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark
                    }
                  }}
                >
                  {t.newRequest}
                </Button>
                {isAdmin && (
              <Button
                variant="contained"
                    onClick={() => navigate('/manage-employees')}
                    startIcon={<AdminPanelSettingsIcon />}
                sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      backgroundColor: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: theme.palette.error.dark
                      }
                    }}
                  >
                    {t.manageEmployees}
                  </Button>
                )}
              </Box>
            )}
            {location.pathname === '/manage-employees' && isAdmin && (
              <Box sx={{ 
                  display: { xs: 'none', md: 'flex' },
                gap: 2,
                ml: 4
              }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/manage-requests')}
                  startIcon={<AssignmentIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark
                    }
                  }}
                >
                  {t.manageRequests}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/manage-departments')}
                  startIcon={<BusinessIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    backgroundColor: theme.palette.info.main,
                    '&:hover': {
                      backgroundColor: theme.palette.info.dark
                    }
                  }}
                >
                  {t.manageDepartments || 'Manage Departments'}
                </Button>
              </Box>
            )}
          </Box>

          {shouldShowSettings && (
            <Box sx={{ 
              flexGrow: 0,
              ml: 'auto'
            }}>
              <Tooltip title={t.settings}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    src={getProfilePicUrl()}
                    sx={{ 
                      bgcolor: theme.palette.background.default,
                      color: theme.palette.text.primary
                    }}
                  >
                    {!getProfilePicUrl() && getInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting.key} onClick={() => handleMenuClick(setting.key)}>
                    <Typography sx={{ textAlign: 'center' }}>{setting.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
