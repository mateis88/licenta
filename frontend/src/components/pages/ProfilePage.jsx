import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Paper, Box, Avatar, TextField, Button, Grid, useTheme, IconButton, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router';
import HomeHeader from '../HomeHeader';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

const ProfilePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [user, setUser] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    profilePicture: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // TODO: Replace with actual user ID from auth context
      const userId = '1'; // Temporary for testing
      console.log('Fetching profile for user:', userId);
      
      const response = await axios.get(`http://localhost:3000/profile/${userId}`);
      console.log('Profile fetch response:', response.data);
      
      if (response.data && response.data.user) {
        setUser({
          id: response.data.user._id,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          email: response.data.user.email,
          birthDate: response.data.user.birthDate,
          profilePicture: response.data.user.profilePicture ? `http://localhost:3000/${response.data.user.profilePicture}` : ''
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching profile:', error.response || error);
      setError(error.response?.data?.message || 'Failed to fetch profile data');
    }
  };

  const handleEdit = () => {
    setEditedUser({ ...user });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('Sending update request with data:', {
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        email: editedUser.email,
        birthDate: editedUser.birthDate
      });

      const response = await axios.put(
        `http://localhost:3000/profile/${user.id}`,
        {
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          email: editedUser.email,
          birthDate: editedUser.birthDate
        }
      );
      
      console.log('Update response:', response.data);
      
      if (response.data && response.data.user) {
        setUser(prev => ({
          ...prev,
          ...response.data.user
        }));
        setIsEditing(false);
        setSuccess('Profile updated successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error updating profile:', error.response || error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.put(
          `http://localhost:3000/profile/${user.id}/picture`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        setUser(prev => ({
          ...prev,
          profilePicture: `http://localhost:3000/${response.data.profilePicture}`
        }));
        setSuccess('Profile picture updated successfully');
      } catch (error) {
        setError('Failed to upload profile picture');
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

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
        <Snackbar 
          open={!!error || !!success} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={error ? 'error' : 'success'} 
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', mr: 3 }}>
              <Avatar
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mr: 3,
                  cursor: isEditing ? 'pointer' : 'default',
                  '&:hover': {
                    opacity: isEditing ? 0.8 : 1
                  }
                }}
                alt={`${user.firstName} ${user.lastName}`}
                src={user.profilePicture}
                onClick={handleImageClick}
              />
              {isEditing && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                    width: 32,
                    height: 32,
                    padding: 0,
                    boxShadow: 2,
                  }}
                  onClick={handleImageClick}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            {!isEditing && (
              <Button 
                variant="contained" 
                onClick={handleEdit}
                startIcon={<EditIcon />}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          {isEditing ? (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={editedUser.firstName || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={editedUser.lastName || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={editedUser.email || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Birth Date"
                    name="birthDate"
                    type="date"
                    value={editedUser.birthDate || ''}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    First Name
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {user.firstName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {user.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {user.email}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Birth Date
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : ''}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage; 