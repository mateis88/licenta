import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router';
import {
  Box,
  Container,
  Paper,
  Typography,
  useTheme,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import HomeHeader from '../HomeHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const ManageDepartmentsPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { translations } = useSettings();
  const t = translations.common;
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    maxEmployeesOnLeave: ''
  });
  const [formError, setFormError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Only allow access to admin users
  if (!user || user.status !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDepartments(response.data.departments);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(err.response?.data?.message || 'Failed to fetch departments');
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      setFormError('');
      if (!newDepartment.name || !newDepartment.maxEmployeesOnLeave) {
        setFormError(t.fillAllFields);
        return;
      }

      const maxEmployees = parseInt(newDepartment.maxEmployeesOnLeave);
      if (isNaN(maxEmployees) || maxEmployees <= 0) {
        setFormError(t.maxEmployeesRequired);
        return;
      }

      await axios.post('http://localhost:3000/departments', 
        {
          name: newDepartment.name,
          maxEmployeesOnLeave: maxEmployees
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setOpenDialog(false);
      setNewDepartment({ name: '', maxEmployeesOnLeave: '' });
      fetchDepartments();
    } catch (err) {
      console.error('Error creating department:', err);
      setFormError(err.response?.data?.message === 'Department already exists' 
        ? t.departmentAlreadyExists 
        : t.failedToCreateDepartment);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      setDeleteLoading(true);
      setError('');

      await axios.delete(`http://localhost:3000/departments/${departmentToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDepartmentToDelete(null);
    setError('');
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1"
            color="text.primary"
            sx={{ fontWeight: 'medium' }}
          >
            {t.departments}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              backgroundColor: theme.palette.success.main,
              '&:hover': {
                backgroundColor: theme.palette.success.dark
              }
            }}
          >
            {t.createDepartment}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {departments.map((department) => (
              <Grid item xs={12} key={department.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    border: 1,
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate(`/department/${department.name}`)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      flex: 1
                  }}
                >
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="h6"
                      color="text.primary"
                    >
                      {department.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {department.numberOfEmployees} {t.employees}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventBusyIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {t.maxSimultaneousLeaves}: {department.maxEmployeesOnLeave}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Button>
                  <Tooltip 
                    title={department.numberOfEmployees > 0 
                      ? `Cannot delete department with ${department.numberOfEmployees} employee(s)` 
                      : 'Delete department'
                    }
                  >
                    <span>
                      <IconButton
                        onClick={() => openDeleteDialog(department)}
                        disabled={department.numberOfEmployees > 0}
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Create Department Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setFormError('');
          setNewDepartment({ name: '', maxEmployeesOnLeave: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t.createNewDepartment}
          <IconButton
            aria-label="close"
            onClick={() => {
              setOpenDialog(false);
              setFormError('');
              setNewDepartment({ name: '', maxEmployeesOnLeave: '' });
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t.departmentName}
              value={newDepartment.name}
              onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t.maxEmployeesOnLeave}
              type="number"
              value={newDepartment.maxEmployeesOnLeave}
              onChange={(e) => setNewDepartment(prev => ({ ...prev, maxEmployeesOnLeave: e.target.value }))}
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setFormError('');
              setNewDepartment({ name: '', maxEmployeesOnLeave: '' });
            }}
          >
            {t.cancel}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateDepartment}
            sx={{
              backgroundColor: theme.palette.success.main,
              '&:hover': {
                backgroundColor: theme.palette.success.dark
              }
            }}
          >
            {t.create}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Department Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t.deleteDepartment || 'Delete Department'}
          <IconButton
            aria-label="close"
            onClick={closeDeleteDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          <Typography sx={{ mt: 2 }}>
            {t.deleteDepartmentConfirmation || 'Are you sure you want to delete the department'} 
            <strong> {departmentToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t.deleteDepartmentWarning || 'This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={closeDeleteDialog}
            disabled={deleteLoading}
          >
            {t.cancel}
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteDepartment}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleteLoading ? (t.deleting || 'Deleting...') : (t.delete || 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDepartmentsPage; 