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

function ResponsiveAppBar({ showSettings = true }) {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { translations } = useSettings();
  const t = translations.common;

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
      navigate('/login');
    } else if (setting === 'profile') {
      navigate('/profile');
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

  return (
    <AppBar position="static">
      <Container 
        maxWidth={false} 
        sx={{ 
          px: { xs: 2, sm: 4, md: 6, lg: 8 },
          width: '100%'
        }}
      >
        <Toolbar disableGutters sx={{ justifyContent: showSettings ? 'space-between' : 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <Button
                variant="contained"
                onClick={() => navigate('/home/requests')}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  ml: 2
                }}
              >
                {translations.common.myRequests}
              </Button>
            )}
          </Box>

          {showSettings && (
            <Box sx={{ 
              flexGrow: 0,
              ml: 'auto'
            }}>
              <Tooltip title={t.settings}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
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
