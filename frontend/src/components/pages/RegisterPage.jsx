import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import ratone from '../../assets/El_ratone.jpg';
import starryNight from '../../assets/starry_night.jpg';
import axios from 'axios';
import * as Yup from 'yup';
import { useNavigate } from 'react-router';
import { useSettings } from '../../contexts/SettingsContext';
import HomeHeader from '../HomeHeader';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { translations } = useSettings();
  const theme = useTheme();
  const t = translations.register;
  const common = translations.common;

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthDate: '',
    department: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:3000/departments');
        setDepartments(response.data.departments.map(dept => dept.name));
        setDepartmentsLoading(false);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setDepartmentsError(err.response?.data?.message || 'Failed to fetch departments');
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    return () => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthDate: '',
        department: ''
      });
      setErrors({});
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthDate: '',
        department: ''
      });
      setErrors({});
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
    firstName: Yup.string().required(t.errors.firstNameRequired),
    lastName: Yup.string().required(t.errors.lastNameRequired),
    email: Yup.string().required(t.errors.emailRequired).email(t.errors.invalidEmail),
    password: Yup.string().required(t.errors.passwordRequired),
    birthDate: Yup.string().required(t.errors.birthDateRequired),
    department: Yup.string().required(t.errors.departmentRequired)
  });

  const handleSubmit = async () => {
    try {
      setErrors({});
      await validationSchema.validate(formData, { abortEarly: false });
      postRegisterData();
    } catch (error) {
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const postRegisterData = async () => {
    await axios
      .post('http://localhost:3000/register', formData)
      .then((res) => {
        console.log(res);
        navigate('/login');
      })
      .catch((err) => {
        console.log(err);
      });
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={common.firstName}
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={common.lastName}
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
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
                <FormControl fullWidth size="small" error={!!errors.department || !!departmentsError}>
                  <InputLabel sx={{ fontSize: '0.9rem' }}>{common.department}</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    label={common.department}
                    sx={{ fontSize: '0.9rem' }}
                    disabled={departmentsLoading}
                  >
                    {departmentsLoading ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2">Loading departments...</Typography>
                        </Box>
                      </MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem disabled>No departments available</MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept} value={dept} sx={{ fontSize: '0.9rem' }}>
                          {dept}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {(errors.department || departmentsError) && (
                    <Typography color="error" variant="caption" sx={{ fontSize: '0.75rem', ml: 2, mt: 0.5 }}>
                      {errors.department || departmentsError}
                    </Typography>
                  )}
                </FormControl>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={common.birthDate}
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  error={!!errors.birthDate}
                  helperText={errors.birthDate}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                    sx: { fontSize: '0.9rem', color: theme.palette.text.primary }
                  }}
                  InputProps={{
                    sx: { 
                      fontSize: '0.9rem',
                      color: theme.palette.text.primary,
                      '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                      }
                    }
                  }}
                  FormHelperTextProps={{
                    sx: { fontSize: '0.75rem' }
                  }}
                />
              </Grid>
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
                  onClick={() => navigate('/login')}
                  sx={{ 
                    mt: 1,
                    fontSize: '0.9rem',
                    py: 1
                  }}
                >
                  {t.backToLogin}
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

export default RegisterPage;
