import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Divider,
  useTheme,
  Button,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import HomeHeader from '../HomeHeader';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { translations } = useSettings();
  const theme = useTheme();
  const t = translations.common;
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  // Check if current user is admin
  const isAdmin = user?.status === 'admin';

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:3000/departments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
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

  // Add effect to fetch complete profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (id) {  // Use the URL ID instead of user.id
        try {
          console.log('[ProfilePage] Fetching profile data for user:', id);
          const response = await axios.get(
            `http://localhost:3000/profile/${id}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          console.log('[ProfilePage] Received profile data:', response.data);
          
          if (response.data && response.data.user) {
            console.log('[ProfilePage] Updating user data with:', response.data.user);
            // Only update if the data is different
            if (JSON.stringify(response.data.user) !== JSON.stringify(user)) {
              login(response.data.user, localStorage.getItem('token'));
            }
          }
        } catch (err) {
          console.error('[ProfilePage] Error fetching profile data:', err);
          setError(err.response?.data?.message || 'Failed to load profile data');
        }
      }
    };

    fetchProfileData();
  }, [id]); // Only depend on the URL ID

  // Initialize editedUser with user data when component loads
  useEffect(() => {
    if (user) {
      console.log('[ProfilePage] Initializing editedUser with user data:', user);
      setEditedUser({
        ...user,
        birthDate: formatDateForInput(user.birthDate),
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          country: user.address?.country || '',
          zipCode: user.address?.zipCode || ''
        }
      });
    }
  }, [user]);

  // Debug log to see full user data structure
  useEffect(() => {
    if (user) {
      console.log('[ProfilePage] Current user data:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        address: user.address,
        fullUserObject: user
      });
    }
  }, [user]);

  // Add effect to handle URL ID mismatch
  useEffect(() => {
    if (user && id !== user.id) {
      console.error('URL ID mismatch:', { urlId: id, userId: user.id });
      navigate(`/profile/${user.id}`);
    }
  }, [id, user, navigate]);

  // Debug log to see user data and profile picture URL
  console.log('User data in ProfilePage:', user);
  console.log('Profile picture URL:', user?.profilePicture);
  console.log('Full profile picture URL:', user?.profilePicture ? `http://localhost:3000${user.profilePicture}` : null);

  // Get initials for avatar
  const getInitials = () => {
    if (user && user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Use UTC methods to avoid timezone issues
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Use UTC methods to avoid timezone issues
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageError = () => {
    console.error('Failed to load profile picture');
    setImageError(true);
  };

  const getProfilePicUrl = () => {
    const baseUrl = 'http://localhost:3000/';
    if (isEditing && editedUser?.profilePicture) {
      // Remove any leading slash to avoid double slashes
      const picturePath = editedUser.profilePicture.startsWith('/') 
        ? editedUser.profilePicture.slice(1) 
        : editedUser.profilePicture;
      return `${baseUrl}${picturePath}`;
    }
    if (user?.profilePicture) {
      // Remove any leading slash to avoid double slashes
      const picturePath = user.profilePicture.startsWith('/') 
        ? user.profilePicture.slice(1) 
        : user.profilePicture;
      return `${baseUrl}${picturePath}`;
    }
    return null;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t.invalidFileType);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.fileTooLarge);
      return;
    }

    try {
      setImageLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(
        `http://localhost:3000/upload/profile-picture/${user.id}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Reset error state and update image
      setImageError(false);
      
      // Update the editedUser state with the new profile picture
      setEditedUser(prev => ({
        ...prev,
        profilePicture: response.data.imageUrl
      }));

      // Store the new token but don't refresh the page
      localStorage.setItem('token', response.data.token);

      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err.response?.data?.message || t.failedToUploadImage);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedUser({
      ...user,
      birthDate: formatDateForInput(user.birthDate),
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        country: user.address?.country || '',
        zipCode: user.address?.zipCode || ''
      }
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedUser(null);
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    try {
      console.log('Save button clicked');
      console.log('Current user state:', user);
      console.log('Current editedUser state:', editedUser);
      console.log('URL ID:', id);

      if (!user) {
        console.error('User object is null or undefined');
        setError('User data not available');
        return;
      }

      if (!user.id) {
        console.error('User ID is missing from user object:', user);
        setError('User ID not available');
        return;
      }

      if (id !== user.id) {
        console.error('URL ID does not match user ID:', { urlId: id, userId: user.id });
        setError('Invalid profile access');
        return;
      }

      // Format the birth date before sending
      const dataToSend = {
        ...editedUser,
        // Keep birth date in ISO format (YYYY-MM-DD)
        birthDate: editedUser.birthDate,
        // Only include email and department if user is admin
        ...(isAdmin && {
        email: editedUser.email,
          department: editedUser.department
        })
      };
      
      // Remove any undefined or null values
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === undefined || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });
      
      // Remove _id from the data we're sending
      delete dataToSend._id;
      
      console.log('Making update request with:', {
        url: `http://localhost:3000/profile/${id}`,
        data: dataToSend,
        token: localStorage.getItem('token')
      });

      const response = await axios.put(
        `http://localhost:3000/profile/${id}`,
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Server response:', response.data);
      
      if (response.data && response.data.user) {
        console.log('Updating user state with:', response.data.user);
        login(response.data.user, response.data.token);
        setIsEditing(false);
        setError('');
      } else {
        console.error('Invalid server response:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error in handleSave:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.response?.data?.details || 'Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
          ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  if (!user) {
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
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h5" align="center">
            {t.loading}
          </Typography>
        </Container>
      </Box>
    );
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Profile Section */}
          <Box sx={{ 
            mb: 4, 
            display: 'flex', 
            alignItems: 'center',
            gap: 3,
            position: 'relative'
          }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Tooltip title={isEditing ? t.clickToChangePhoto : ''}>
              <Box
                onClick={handleAvatarClick}
                sx={{ 
                  cursor: isEditing ? 'pointer' : 'default',
                  position: 'relative',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  '&:hover': {
                    '& .camera-overlay': {
                      opacity: isEditing ? 1 : 0
                    }
                  }
                }}
              >
                {imageLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      zIndex: 2
                    }}
                  >
                    <CircularProgress size={40} />
                  </Box>
                )}
                <Avatar
                  src={!imageError ? getProfilePicUrl() : null}
                  onError={handleImageError}
                alt={`${user.firstName} ${user.lastName}`}
                  imgProps={{
                    onLoad: () => {
                      console.log('Image loaded successfully:', getProfilePicUrl());
                      setImageError(false);
                    }
                  }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: theme.palette.primary.main,
                    fontSize: '3rem'
                  }}
                >
                  {(!getProfilePicUrl() || imageError) && getInitials()}
                </Avatar>
                {isEditing && (
                  <Box
                    className="camera-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      opacity: 0,
                      transition: 'opacity 0.2s ease-in-out',
                      zIndex: 1
                    }}
                  >
                    <PhotoCameraIcon 
                      sx={{ 
                        color: 'white',
                        fontSize: '2rem'
                      }} 
              />
            </Box>
                )}
              </Box>
            </Tooltip>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%'
            }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              {isEditing && isAdmin ? (
                <>
                  <TextField
                    fullWidth
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <FormControl fullWidth size="small" sx={{ mb: 1 }} error={!!departmentsError}>
                    <InputLabel id="department-label">{t.department}</InputLabel>
                    <Select
                      labelId="department-label"
                      name="department"
                      value={editedUser.department}
                      onChange={handleInputChange}
                      label={t.department}
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
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                        ))
                      )}
                    </Select>
                    {departmentsError && (
                      <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>
                        {departmentsError}
                      </Typography>
                    )}
                  </FormControl>
                </>
              ) : (
                <>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email}
              </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                    {user.department}
                  </Typography>
                </>
              )}
            </Box>
            {!isEditing ? (
              <Button 
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {t.edit}
              </Button>
            ) : (
              <Box sx={{ 
                position: 'absolute', 
                right: 0, 
                top: 0, 
                display: 'flex', 
                gap: 2 
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
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
                  {t.save}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'rgba(211, 47, 47, 0.04)'
                    }
                  }}
                >
                  {t.cancel}
                </Button>
              </Box>
            )}
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error || t.failedToUpdateProfile}
            </Typography>
          )}

          <Divider sx={{ width: '100%', mb: 4 }} />

          {/* User Information Section */}
          <Grid container spacing={3} sx={{ width: '100%' }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography 
                gutterBottom 
                sx={{ 
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                  mb: 3
                }}
              >
                {t.basicInformation}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.firstName}
              </Typography>
          {isEditing ? (
                  <TextField
                    fullWidth
                    name="firstName"
                  value={editedUser.firstName}
                    onChange={handleInputChange}
                  size="small"
                  />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.firstName}
                </Typography>
              )}
                </Grid>

                <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.lastName}
              </Typography>
              {isEditing ? (
                  <TextField
                    fullWidth
                    name="lastName"
                  value={editedUser.lastName}
                    onChange={handleInputChange}
                  size="small"
                  />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.lastName}
                </Typography>
              )}
                </Grid>

                <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.birthDate}
              </Typography>
              {isEditing ? (
                  <TextField
                    fullWidth
                    type="date"
                    name="birthDate"
                    value={editedUser.birthDate}
                    onChange={handleInputChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {formatDate(user.birthDate)}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ width: '100%', my: 4 }} />

          {/* Additional Information */}
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item xs={12}>
              <Typography 
                gutterBottom 
                sx={{ 
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                  mb: 3
                }}
              >
                {t.additionalInformation}
              </Typography>
                </Grid>

                <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.bio}
              </Typography>
              {isEditing ? (
                  <TextField
                    fullWidth
                  multiline
                  rows={3}
                  name="bio"
                  value={editedUser.bio || ''}
                    onChange={handleInputChange}
                  size="small"
                  placeholder={t.tellUsAboutYourself}
                  />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.bio || '-'}
                </Typography>
              )}
                </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.phoneNumber}
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="phoneNumber"
                  value={editedUser.phoneNumber || ''}
                  onChange={handleInputChange}
                  size="small"
                  placeholder={t.phoneNumberPlaceholder}
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.phoneNumber || '-'}
                </Typography>
              )}
                </Grid>
              </Grid>

          <Divider sx={{ width: '100%', my: 4 }} />

          {/* Address Information */}
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item xs={12}>
              <Typography 
                gutterBottom 
                sx={{ 
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                  mb: 3
                }}
              >
                {t.address}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.street}
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="street"
                  value={editedUser.address?.street || ''}
                  onChange={handleAddressChange}
                  size="small"
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.address?.street || '-'}
                </Typography>
              )}
            </Grid>

                <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.city}
                  </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="city"
                  value={editedUser.address?.city || ''}
                  onChange={handleAddressChange}
                  size="small"
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.address?.city || '-'}
                  </Typography>
              )}
                </Grid>

                <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.state}
                  </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="state"
                  value={editedUser.address?.state || ''}
                  onChange={handleAddressChange}
                  size="small"
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.address?.state || '-'}
                  </Typography>
              )}
                </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.country}
                  </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="country"
                  value={editedUser.address?.country || ''}
                  onChange={handleAddressChange}
                  size="small"
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.address?.country || '-'}
                  </Typography>
              )}
                </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                {t.zipCode}
                  </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="zipCode"
                  value={editedUser.address?.zipCode || ''}
                  onChange={handleAddressChange}
                  size="small"
                />
              ) : (
                <Typography variant="body1" gutterBottom>
                  {user.address?.zipCode || '-'}
                  </Typography>
              )}
                </Grid>
              </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage; 