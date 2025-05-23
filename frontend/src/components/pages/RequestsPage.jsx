import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import HomeHeader from '../HomeHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import axios from 'axios';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { format } from 'date-fns';

const RequestsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { translations } = useSettings();
  const t = translations.common;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  // Status chip colors
  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };

  // Status translations
  const statusTranslations = {
    pending: t.statusPending || 'Pending',
    approved: t.statusApproved || 'Approved',
    rejected: t.statusRejected || 'Rejected'
  };

  // Leave type translations
  const leaveTypeTranslations = {
    sick: t.sickLeave,
    paid: t.paidLeave,
    unpaid: t.unpaidLeave,
    study: t.studyLeave
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(
          `http://localhost:3000/requests/user/${user.email}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        console.log('[Frontend] Fetched requests:', response.data);
        setRequests(response.data.requests);
      } catch (err) {
        console.error('[Frontend] Error fetching requests:', err);
        setError(t.failedToLoadRequests || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchRequests();
    }
  }, [user?.email, t]);

  const handleDownloadDocument = (document) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = `http://localhost:3000/${document.path}`;
    link.download = document.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (err) {
      console.error('[Frontend] Error formatting date:', err);
      return dateString;
    }
  };

  const handleDeleteClick = (request) => {
    console.log('[Frontend] Delete button clicked for request:', {
      requestId: request._id,
      requestEmail: request.email,
      currentUserEmail: user.email,
      status: request.status
    });
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete || !requestToDelete._id) {
      console.error('[Frontend] No request selected for deletion');
      setError('No request selected for deletion');
      return;
    }

    const token = localStorage.getItem('token');
    console.log('[Frontend] Token state:', {
      exists: !!token,
      length: token?.length,
      firstChars: token ? `${token.substring(0, 10)}...` : 'none',
      user: user ? {
        email: user.email,
        id: user.id,
        status: user.status
      } : 'no user',
      isAuthenticated: !!user
    });

    if (!token) {
      console.error('[Frontend] No authentication token found');
      setError('Authentication required. Please log in again.');
      return;
    }

    try {
      console.log('[Frontend] Attempting to delete request:', {
        requestId: requestToDelete._id,
        requestEmail: requestToDelete.email,
        currentUserEmail: user.email,
        status: requestToDelete.status,
        token: token ? 'Token exists' : 'No token',
        headers: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        }
      });

      const response = await axios.delete(
        `http://localhost:3000/requests/${requestToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('[Frontend] Delete request response:', response.data);

      // Remove the deleted request from the state
      setRequests(prevRequests => 
        prevRequests.filter(request => request._id !== requestToDelete._id)
      );

      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('[Frontend] Error deleting request:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        requestId: requestToDelete._id,
        requestEmail: requestToDelete.email,
        currentUserEmail: user.email,
        token: token ? 'Token exists' : 'No token',
        headers: err.config?.headers ? {
          ...err.config.headers,
          'Authorization': 'Bearer [HIDDEN]'
        } : 'No headers'
      });
      
      // Show more specific error message
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.details || 
        t.failedToDeleteRequest || 
        'Failed to delete request';
      
      setError(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRequestToDelete(null);
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
      <HomeHeader />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Paid Leave Days Card */}
        <Card 
          elevation={3} 
          sx={{ 
            mb: 3,
            backgroundColor: theme.palette.background.paper,
            borderLeft: `4px solid ${theme.palette.primary.main}`
          }}
        >
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <EventAvailableIcon 
                  sx={{ 
                    fontSize: 40,
                    color: theme.palette.primary.main
                  }} 
                />
              </Grid>
              <Grid item xs>
                <Typography variant="h6" color="textPrimary" gutterBottom>
                  {t.remainingPaidLeave || 'Remaining Paid Leave Days'}
                </Typography>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {user?.paidLeaveDays || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t.lastUpdated || 'Last updated'}: {user?.lastLeaveUpdate ? format(new Date(user.lastLeaveUpdate), 'dd/MM/yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
            {t.myRequests}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : requests.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t.noRequestsFound || 'No requests found'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t.leaveType}</TableCell>
                    <TableCell>{t.startDate}</TableCell>
                    <TableCell>{t.endDate}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    <TableCell>{t.documents}</TableCell>
                    <TableCell>{t.submittedAt}</TableCell>
                    <TableCell align="right">{t.actions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>{leaveTypeTranslations[request.type]}</TableCell>
                      <TableCell>{formatDate(request.startDate)}</TableCell>
                      <TableCell>{formatDate(request.endDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusTranslations[request.status]}
                          color={statusColors[request.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.documents && request.documents.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {request.documents.map((doc, index) => (
                              <Tooltip key={index} title={doc.filename}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadDocument(doc)}
                                  color="primary"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t.noDocuments || 'No documents'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell align="right">
                        {request.status === 'pending' && (
                          <Tooltip title={t.deleteRequest}>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(request)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t.confirmDeleteRequest}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t.deleteRequestConfirmation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            {t.cancel}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestsPage; 