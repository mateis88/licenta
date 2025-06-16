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
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge
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
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

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
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedRequestForDocs, setSelectedRequestForDocs] = useState(null);

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

  // Get file icon based on file extension
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon color="primary" />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon color="info" />;
      default:
        return <DescriptionIcon />;
    }
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
    try {
      const link = document.createElement('a');
      link.href = `http://localhost:3000/${document.path}`;
      link.download = document.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[Frontend] Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleViewDocuments = (request) => {
    setSelectedRequestForDocs(request);
    setDocumentsDialogOpen(true);
  };

  const handleCloseDocumentsDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedRequestForDocs(null);
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
          status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'pending'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('[Frontend] Request status updated successfully:', response.data);

      // Update user data if it was returned
      if (response.data.user) {
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
                        {request.documents && request.documents.length > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge badgeContent={request.documents.length} color="primary">
                              <Tooltip title={t.viewDocuments || 'View Documents'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDocuments(request)}
                                  color="primary"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Badge>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t.noDocuments || 'No documents'}
                          </Typography>
                        )}
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

      {/* Documents View Dialog */}
      <Dialog
        open={documentsDialogOpen}
        onClose={handleCloseDocumentsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {t.documents || 'Documents'} - {selectedRequestForDocs?.email?.firstName} {selectedRequestForDocs?.email?.lastName}
            </Typography>
            <IconButton onClick={handleCloseDocumentsDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequestForDocs?.documents && selectedRequestForDocs.documents.length > 0 ? (
            <List>
              {selectedRequestForDocs.documents.map((doc, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getFileIcon(doc.filename)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.filename}
                      secondary={doc.uploadDate ? format(new Date(doc.uploadDate), 'dd/MM/yyyy HH:mm') : ''}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={t.downloadDocument || 'Download Document'}>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadDocument(doc)}
                          color="primary"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < selectedRequestForDocs.documents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              {t.noDocuments || 'No documents available'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentsDialog} color="primary">
            {t.close || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageRequestsPage; 