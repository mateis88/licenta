import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
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
  TextField,
  InputAdornment
} from '@mui/material';
import HomeHeader from '../HomeHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Navigate } from 'react-router';
import axios from 'axios';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import RestoreIcon from '@mui/icons-material/Restore';

const ManageRequestsPage = () => {
  const theme = useTheme();
  const { user, setUser } = useAuth();
  const { translations } = useSettings();
  const t = translations.common;

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject' or 'reverse'

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

  // Filter requests based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = requests.filter(request => {
      const fullName = `${request.email?.firstName || ''} ${request.email?.lastName || ''}`.toLowerCase();
      return fullName.includes(query);
    });
    setFilteredRequests(filtered);
  }, [searchQuery, requests]);

  // Update filtered requests when requests change
  useEffect(() => {
    setFilteredRequests(requests);
  }, [requests]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(
          'http://localhost:3000/requests/all',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        console.log('[Frontend] Fetched all requests:', response.data);
        setRequests(response.data.requests);
      } catch (err) {
        console.error('[Frontend] Error fetching requests:', err);
        setError(err.response?.data?.message || t.failedToLoadRequests || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchRequests();
    }
  }, [user?.email, t]);

  const handleDownloadDocument = (document) => {
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

  const getActionButtons = (request) => {
    if (request.status === 'pending') {
      return (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t.approve || 'Approve'}>
            <IconButton
              size="small"
              color="success"
              onClick={() => handleActionClick(request, 'approve')}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.reject || 'Reject'}>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleActionClick(request, 'reject')}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    } else if (request.status === 'approved' || request.status === 'rejected') {
      return (
        <Tooltip title={t.reverseDecision || 'Reverse Decision'}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleActionClick(request, 'reverse')}
          >
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    return null;
  };

  const handleActionClick = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    try {
      console.log('[Frontend] About to update request status:', {
        requestId: selectedRequest._id,
        actionType,
        newStatus: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'pending',
        requestType: selectedRequest.type,
        startDate: selectedRequest.startDate,
        endDate: selectedRequest.endDate
      });

      const response = await axios.patch(
        `http://localhost:3000/requests/${selectedRequest._id}/status`,
        { 
          status: actionType === 'approve' ? 'approved' : 
                 actionType === 'reject' ? 'rejected' : 
                 'pending' 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('[Frontend] Request status update response:', {
        status: response.status,
        data: response.data,
        user: response.data.user,
        paidLeaveDays: response.data.user?.paidLeaveDays,
        request: response.data.request
      });

      // Update the user state with the new paid leave days
      if (response.data.user) {
        console.log('[Frontend] Updating user state with:', response.data.user);
        setUser(response.data.user);
      } else {
        console.warn('[Frontend] No user data in response:', response.data);
      }

      // Update the requests list
      setRequests(prevRequests => {
        const updatedRequests = prevRequests.map(request => 
          request._id === selectedRequest._id 
            ? { 
                ...request, 
                status: actionType === 'approve' ? 'approved' : 
                       actionType === 'reject' ? 'rejected' : 
                       'pending' 
              }
            : request
        );
        console.log('[Frontend] Updated requests list:', updatedRequests);
        return updatedRequests;
      });

      setActionDialogOpen(false);
      setSelectedRequest(null);
      setActionType('');
    } catch (error) {
      console.error('[Frontend] Error updating request status:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestId: selectedRequest._id,
        actionType
      });
      setError(error.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleActionCancel = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType('');
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Protect the route - redirect if not admin
  if (!user || user.status !== 'admin') {
    return <Navigate to="/home" replace />;
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ color: theme.palette.text.primary }}>
              {t.manageRequests || 'Manage Requests'}
            </Typography>
            <TextField
              placeholder={t.searchByName || 'Search by name...'}
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : filteredRequests.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {searchQuery ? t.noMatchingRequests || 'No matching requests found' : t.noRequestsFound || 'No requests found'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t.employee || 'Employee'}</TableCell>
                    <TableCell>{t.email || 'Email'}</TableCell>
                    <TableCell>{t.leaveType || 'Leave Type'}</TableCell>
                    <TableCell>{t.startDate || 'Start Date'}</TableCell>
                    <TableCell>{t.endDate || 'End Date'}</TableCell>
                    <TableCell>{t.status || 'Status'}</TableCell>
                    <TableCell>{t.documents || 'Documents'}</TableCell>
                    <TableCell>{t.actions || 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        {request.email?.firstName} {request.email?.lastName}
                      </TableCell>
                      <TableCell>{request.email?.email}</TableCell>
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
                        {request.documents?.map((doc, index) => (
                          <Tooltip key={index} title={t.downloadDocument || 'Download Document'}>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(doc)}
                              sx={{ ml: index > 0 ? 1 : 0 }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ))}
                      </TableCell>
                      <TableCell>
                        {getActionButtons(request)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={handleActionCancel}
      >
        <DialogTitle>
          {actionType === 'approve' 
            ? t.approveRequest || 'Approve Request'
            : actionType === 'reject'
            ? t.rejectRequest || 'Reject Request'
            : t.reverseDecision || 'Reverse Decision'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'approve'
              ? t.confirmApproveRequest || 'Are you sure you want to approve this request?'
              : actionType === 'reject'
              ? t.confirmRejectRequest || 'Are you sure you want to reject this request?'
              : t.confirmReverseDecision || 'Are you sure you want to reverse this decision and set the request back to pending?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleActionCancel} color="primary">
            {t.cancel || 'Cancel'}
          </Button>
          <Button 
            onClick={handleActionConfirm} 
            color={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'error' : 'primary'}
            variant="contained"
          >
            {actionType === 'approve'
              ? t.approve || 'Approve'
              : actionType === 'reject'
              ? t.reject || 'Reject'
              : t.reverse || 'Reverse'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRequestsPage; 