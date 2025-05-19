import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  useTheme,
} from '@mui/material';
import ratone from '../../assets/El_ratone.jpg';
import starryNight from '../../assets/starry_night.jpg';
import axios from 'axios';
import * as Yup from 'yup';
import { useNavigate, useLocation } from 'react-router';
import { useSettings } from '../../contexts/SettingsContext';
import HomeHeader from '../HomeHeader';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { translations } = useSettings();
  const theme = useTheme();
  const t = translations.login;
  const common = translations.common;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    return () => {
      setFormData({ email: '', password: '' });
      setErrors({});
      setAuthError('');
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      setFormData({ email: '', password: '' });
      setErrors({});
      setAuthError('');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleChange = (key, newValue) => {
    setFormData({ ...formData, [key]: newValue });
  };

  const validationSchema = Yup.object({
    email: Yup.string().required(t.errors.emailRequired).email(t.errors.invalidEmail),
    password: Yup.string().required(t.errors.passwordRequired),
  });

  const handleSubmit = async () => {
    try {
      setErrors({});
      await validationSchema.validate(formData, { abortEarly: false });
      postLoginData();
    } catch (error) {
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const postLoginData = async () => {
    try {
      setAuthError('');
      const response = await axios.post('http://localhost:3000/login', formData);
      console.log(response);
      
      // Use the auth context to login
      login(response.data.user, response.data.token);
      
      // Navigate to the attempted page or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (err) {
        console.log(err);
      if (err.response && err.response.status === 401) {
        setAuthError(translations.login.errors.invalidCredentials);
      } else {
        setAuthError(translations.login.errors.serverError);
      }
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <HomeHeader showSettings={false} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pt: 2,
        }}
      >
        <Box
          sx={{
            width: '70%',
            maxWidth: 800,
            height: {
              xs: 'auto',
              md: '500px'
            },
            display: 'flex',
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: 3,
            bgcolor: theme.palette.background.paper,
            transform: {
              xs: 'scale(0.65)',
              sm: 'scale(0.75)',
              md: 'scale(0.85)',
              lg: 'scale(0.95)',
              xl: 'scale(1.05)'
            },
            transformOrigin: 'center center',
          }}
        >
          {/* Left Form Section */}
          <Box
            sx={{
              width: {
                xs: '100%',
                md: '50%'
              },
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant="h6" mb={1} sx={{ fontSize: '1.5rem', color: theme.palette.text.primary }}>
              {t.title}
            </Typography>
            <Typography variant="body2" mb={2} sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
              {t.subtitle}
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={common.email}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  size="small"
                  InputProps={{
                    sx: { fontSize: '0.9rem' }
                  }}
                  InputLabelProps={{
                    sx: { fontSize: '0.9rem' }
                  }}
                  FormHelperTextProps={{
                    sx: { fontSize: '0.75rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={common.password}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  size="small"
                  InputProps={{
                    sx: { fontSize: '0.9rem' }
                  }}
                  InputLabelProps={{
                    sx: { fontSize: '0.9rem' }
                  }}
                  FormHelperTextProps={{
                    sx: { fontSize: '0.75rem' }
                  }}
                />
              </Grid>
              {authError && (
                <Grid item xs={12}>
                  <Typography 
                    color="error" 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      mt: 1
                    }}
                  >
                    {authError}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmit}
                  sx={{ 
                    fontSize: '0.9rem',
                    py: 1
                  }}
                >
                  {t.submit}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => navigate('/register')}
                  sx={{ 
                    mt: 1,
                    fontSize: '0.9rem',
                    py: 1
                  }}
                >
                  {t.createAccount}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Right Visual Section */}
          <Box
            sx={{
              width: {
                xs: '100%',
                md: '50%'
              },
              minHeight: {
                xs: '250px',
                md: 'auto'
              },
              backgroundImage: `url(${starryNight})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(1.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              flexDirection: 'column',
              color: 'white',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1
              }
            }}
          >
            <Box
              component="img"
              src={ratone}
              alt="Cool rat"
              sx={{
                width: {
                  xs: '150px',
                  md: '200px'
                },
                height: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;