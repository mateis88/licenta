import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Slide,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const LeaveRequestForm = ({ open, onClose }) => {
  const theme = useTheme();
  const { translations } = useSettings();
  const { user } = useAuth();
  const t = translations.common;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Let the required field validation handle empty dates
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time part for date comparison

    if (start < now) {
      setError(t.startDateInPast);
      return false;
    }

    if (end < start) {
      setError(t.endDateBeforeStart);
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }

    // Validate dates when either date changes
    if (name === 'startDate' || name === 'endDate') {
      validateDates(
        name === 'startDate' ? value : newFormData.startDate,
        name === 'endDate' ? value : newFormData.endDate
      );
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    console.log('[Frontend] Selected files:', files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));
    
    if (files.length === 0) {
      setError(t.noFilesSelected);
      return;
    }

    // Validate file types before upload
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const invalidFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return !allowedTypes.includes(ext);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.`);
      return;
    }

    // Validate file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 5MB.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        console.log('[Frontend] Appending file:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
        formData.append('documents', file);
      });

      console.log('[Frontend] Sending upload request...');
      const response = await axios.post(
        'http://localhost:3000/api/upload/documents',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('[Frontend] Upload progress:', percentCompleted + '%');
          }
        }
      );

      console.log('[Frontend] Upload response:', response.data);
      setDocuments(prev => [...prev, ...response.data.documents]);
    } catch (err) {
      console.error('[Frontend] Upload error:', err);
      console.error('[Frontend] Error response:', err.response);
      
      let errorMessage = 'Failed to upload documents. ';
      if (err.response?.data?.details) {
        errorMessage += err.response.data.details;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate dates before submission
    if (!validateDates(formData.startDate, formData.endDate)) {
      console.log('[Frontend] Date validation failed:', {
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      return;
    }

    if (formData.type === 'sick' && documents.length === 0) {
      console.log('[Frontend] Sick leave validation failed: No documents provided');
      setError(t.sickLeaveDocumentsRequired);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[Frontend] No authentication token found');
      setError('Authentication required. Please log in again.');
      return;
    }

    const requestData = {
      ...formData,
      email: user.email,
      documents: documents.map(doc => ({
        filename: doc.filename,
        path: doc.path
      }))
    };

    console.log('[Frontend] Sending request to:', 'http://localhost:3000/requests');
    console.log('[Frontend] Request data:', JSON.stringify(requestData, null, 2));
    
    try {
      const response = await axios.post(
        'http://localhost:3000/requests',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[Frontend] Request submission successful:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        onClose();
      }
    } catch (err) {
      // Log the complete error object
      console.error('[Frontend] Request submission failed:', {
        error: {
          message: err.message,
          name: err.name,
          stack: err.stack
        },
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        } : 'No response received',
        request: {
          url: err.config?.url,
          method: err.config?.method,
          headers: {
            ...err.config?.headers,
            'Authorization': 'Bearer [HIDDEN]'
          },
          data: requestData
        }
      });
      
      let errorMessage = t.failedToSubmitRequest;
      if (err.response?.data?.details) {
        if (Array.isArray(err.response.data.details)) {
          errorMessage += ': ' + err.response.data.details.map(d => d.msg).join(', ');
        } else {
          errorMessage += ': ' + err.response.data.details;
        }
      } else if (err.response?.data?.message) {
        errorMessage += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '40%',
          height: '100vh',
          backgroundColor: theme.palette.background.paper,
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h6">
            {t.newLeaveRequest}
          </Typography>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            flex: 1,
            p: 3,
            overflow: 'auto'
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>{t.leaveType}</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label={t.leaveType}
                >
                  <MenuItem value="sick">{t.sickLeave}</MenuItem>
                  <MenuItem value="paid">{t.paidLeave}</MenuItem>
                  <MenuItem value="unpaid">{t.unpaidLeave}</MenuItem>
                  <MenuItem value="study">{t.studyLeave}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.type === 'sick' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t.sickLeaveDisclaimer}
                </Alert>
                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? t.uploading : t.uploadDocuments}
                  </Button>
                </Box>
                {documents.length > 0 && (
                  <List>
                    {documents.map((doc, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemText
                          primary={doc.filename}
                          secondary={new Date(doc.uploadDate).toLocaleString()}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteDocument(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="startDate"
                label={t.startDate}
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: today // Prevent selecting dates before today
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="endDate"
                label={t.endDate}
                value={formData.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: formData.startDate || today // Prevent selecting dates before start date
                }}
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Typography color="error">
                  {error}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
              >
                {t.submitRequest}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Slide>
  );
};

export default LeaveRequestForm; 