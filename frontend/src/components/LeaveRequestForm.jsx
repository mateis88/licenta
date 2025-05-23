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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, isValid, startOfDay } from 'date-fns';
import { ro } from 'date-fns/locale'; // Import Romanian locale for proper date formatting
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useCalendar } from '../contexts/CalendarContext';

const LeaveRequestForm = ({ open, onClose }) => {
  const theme = useTheme();
  const { translations } = useSettings();
  const { user } = useAuth();
  const t = translations.common;
  const fileInputRef = useRef(null);
  const { refreshCalendar } = useCalendar();

  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Format date to DD/MM/YYYY for display
  const formatDate = (date) => {
    if (!date) return '';
    return format(startOfDay(new Date(date)), 'dd/MM/yyyy');
  };

  // Format date to YYYY-MM-DD for backend
  const formatDateForBackend = (date) => {
    if (!date) return '';
    const parsedDate = parseDate(date);
    if (!parsedDate) return '';
    return format(parsedDate, 'yyyy-MM-dd');
  };

  // Parse date from DD/MM/YYYY format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
      return isValid(parsed) ? startOfDay(parsed) : null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Let the required field validation handle empty dates
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const now = startOfDay(new Date());

    if (!start || !end) {
      setError(t.invalidDateFormat);
      return false;
    }

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
      const startDate = name === 'startDate' ? value : newFormData.startDate;
      const endDate = name === 'endDate' ? value : newFormData.endDate;
      
      if (startDate && endDate) {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (start && end) {
          validateDates(start, end);
        }
      }
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
    setError(null);
    setSuccess(null);

    console.log('[Frontend] Starting form submission with data:', {
      formData,
      documents: documents.length
    });

    // Validate required fields
    if (!formData.type) {
      setError(t.leaveTypeRequired);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError(t.datesRequired);
      return;
    }

    // Parse and validate dates
    const startDate = parseDate(formData.startDate);
    const endDate = parseDate(formData.endDate);

    console.log('[Frontend] Parsed dates:', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    if (!startDate || !endDate) {
      setError(t.invalidDateFormat);
      return;
    }

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

    // Convert dates to backend format before sending
    const requestData = {
      type: formData.type,
      startDate: formatDateForBackend(formData.startDate),
      endDate: formatDateForBackend(formData.endDate),
      email: user.email,
      documents: documents.map(doc => ({
        filename: doc.filename,
        path: doc.path
      }))
    };

    console.log('[Frontend] Prepared request data:', requestData);
    
    try {
      console.log('[Frontend] Sending request to:', 'http://localhost:3000/requests');
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

      setSuccess(t.requestSubmitted || 'Request submitted successfully!');
      
      // Reset form
      setFormData({
        type: '',
        startDate: '',
        endDate: ''
      });
      setDocuments([]);
      setError('');
      
      // Close the form after a short delay
      setTimeout(() => {
        onClose();
        // Refresh the calendar
        if (refreshCalendar?.current) {
          refreshCalendar.current();
        }
      }, 1500);
    } catch (err) {
      console.error('[Frontend] Request submission failed:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        requestData
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
          noValidate
          sx={{
            flex: 1,
            p: 3,
            overflow: 'auto'
          }}
        >
          <LocalizationProvider 
            dateAdapter={AdapterDateFns} 
            adapterLocale={ro}
            dateFormats={{
              keyboardDate: 'dd/MM/yyyy',
              keyboardDateTime: 'dd/MM/yyyy HH:mm',
              keyboardMonth: 'MM/yyyy',
              keyboardYear: 'yyyy'
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
                <DatePicker
                  label={t.startDate}
                  value={formData.startDate ? parseDate(formData.startDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const formattedDate = formatDate(newValue);
                      handleChange({
                        target: {
                          name: 'startDate',
                          value: formattedDate
                        }
                      });
                    } else {
                      handleChange({
                        target: {
                          name: 'startDate',
                          value: ''
                        }
                      });
                    }
                  }}
                  format="dd/MM/yyyy"
                  minDate={startOfDay(new Date())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      InputLabelProps: { shrink: true },
                      error: Boolean(error && error.includes('start date')),
                      helperText: error && error.includes('start date') ? error : ''
                    }
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-root': {
                      fontFamily: '"Roboto Slab", serif'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label={t.endDate}
                  value={formData.endDate ? parseDate(formData.endDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const formattedDate = formatDate(newValue);
                      handleChange({
                        target: {
                          name: 'endDate',
                          value: formattedDate
                        }
                      });
                    } else {
                      handleChange({
                        target: {
                          name: 'endDate',
                          value: ''
                        }
                      });
                    }
                  }}
                  format="dd/MM/yyyy"
                  minDate={formData.startDate ? parseDate(formData.startDate) : startOfDay(new Date())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      InputLabelProps: { shrink: true },
                      error: Boolean(error && error.includes('end date')),
                      helperText: error && error.includes('end date') ? error : ''
                    }
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiInputBase-root': {
                      fontFamily: '"Roboto Slab", serif'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!formData.type || !formData.startDate || !formData.endDate || (formData.type === 'sick' && documents.length === 0)}
                  onClick={(e) => {
                    console.log('[Frontend] Submit button clicked');
                    console.log('[Frontend] Current form state:', {
                      formData,
                      documents: documents.length,
                      error
                    });
                  }}
                >
                  {t.submitRequest}
                </Button>
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                </Grid>
              )}

              {success && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </LocalizationProvider>
        </Box>
      </Paper>
    </Slide>
  );
};

export default LeaveRequestForm; 