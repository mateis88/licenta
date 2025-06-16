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
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import HomeHeader from './HomeHeader';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import BusinessIcon from '@mui/icons-material/Business';

const ManageEmployees = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { translations } = useSettings();
  const { user } = useAuth();
  const t = translations.common;

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  // Only allow access to admin users
  if (!user || user.status !== 'admin') {
    return <Navigate to="/home" replace />;
  }

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

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:3000/employees', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setEmployees(response.data.employees);
        setFilteredEmployees(response.data.employees);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError(err.response?.data?.message || 'Failed to fetch employees');
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Filter employees based on search query and department
  useEffect(() => {
    let filtered = employees;

    // Apply department filter
    if (selectedDepartment) {
      filtered = filtered.filter(employee => employee.department === selectedDepartment);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(employee => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const email = employee.email.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, selectedDepartment, employees]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
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
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ color: theme.palette.text.primary }}>
              {t.manageEmployees}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                placeholder={t.searchByNameOrEmail || "Search by name or email..."}
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }} error={!!departmentsError}>
                <InputLabel id="department-filter-label">{t.department}</InputLabel>
                <Select
                  labelId="department-filter-label"
                  value={selectedDepartment}
                  label={t.department}
                  onChange={handleDepartmentChange}
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">
                    <em>{t.allDepartments || "All Departments"}</em>
                  </MenuItem>
                  {departmentsLoading ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">Loading...</Typography>
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
            </Box>
          </Box>

          {departmentsError && (
            <Alert severity="error" sx={{ mb: 2 }}>{departmentsError}</Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : filteredEmployees.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {searchQuery || selectedDepartment ? t.noMatchingEmployeesFound || "No matching employees found" : t.noEmployeesFound || "No employees found"}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t.employee}</TableCell>
                    <TableCell>{t.email}</TableCell>
                    <TableCell align="center">{t.department}</TableCell>
                    <TableCell align="center">{t.remainingPaidLeaveDays}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow 
                      key={employee.id}
                      hover
                      onClick={() => navigate(`/profile/${employee.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={employee.profilePicture ? `http://localhost:3000${employee.profilePicture}` : null}
                            alt={`${employee.firstName} ${employee.lastName}`}
                          >
                            {employee.firstName.charAt(0)}
                          </Avatar>
                          <Typography>
                            {employee.firstName} {employee.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell align="center">{employee.department}</TableCell>
                      <TableCell align="center">{employee.paidLeaveDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ManageEmployees; 