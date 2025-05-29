import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import {
    Box,
    Container,
    Paper,
    Typography,
    useTheme,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Chip,
    Button,
    Fade
} from '@mui/material';
import HomeHeader from '../HomeHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PersonIcon from '@mui/icons-material/Person';

const DepartmentInfoPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const { translations } = useSettings();
    const t = translations.common;
    const { departmentName } = useParams();
    const navigate = useNavigate();

    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Only allow access to admin users
    if (!user || user.status !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    useEffect(() => {
        const fetchDepartmentDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/departments/${departmentName}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setDepartment(response.data.department);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching department details:', err);
                setError(err.response?.data?.message || 'Failed to fetch department details');
                setLoading(false);
            }
        };

        fetchDepartmentDetails();
    }, [departmentName]);

    return (
        <Box sx={{
            width: '100vw',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.default,
        }}>
            <HomeHeader />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/manage-departments')}
                    sx={{ mb: 3 }}
                >
                    Back to Departments
                </Button>

                <Fade in={!loading} timeout={500}>
                    <Box>
                        {error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        ) : loading ? (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                minHeight: '400px'
                            }}>
                                <CircularProgress />
                            </Box>
                        ) : department && (
                            <Paper elevation={3} sx={{ p: 4 }}>
                                <Typography variant="h4" component="h1" gutterBottom>
                                    {department.name} Department
                                </Typography>

                                <Grid container spacing={3} sx={{ mt: 2 }}>
                                    {/* Department Stats */}
                                    <Grid item xs={12} md={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Department Statistics
                                                </Typography>
                                                <Box sx={{ mt: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <PeopleIcon sx={{ mr: 1 }} />
                                                        <Typography>
                                                            Total Employees: {department.numberOfEmployees}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <EventBusyIcon sx={{ mr: 1 }} />
                                                        <Typography>
                                                            Max Employees on Leave: {department.maxEmployeesOnLeave}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PersonIcon sx={{ mr: 1 }} />
                                                        <Typography>
                                                            Current Employees on Leave: {department.currentEmployeesOnLeave}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* Employee List */}
                                    <Grid item xs={12} md={8}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Department Employees
                                                </Typography>
                                                <List>
                                                    {department.employees.map((employee, index) => (
                                                        <React.Fragment key={employee.email}>
                                                            {index > 0 && <Divider />}
                                                            <ListItem>
                                                                <ListItemAvatar>
                                                                    <Avatar
                                                                        src={employee.profilePicture}
                                                                        alt={`${employee.firstName} ${employee.lastName}`}
                                                                    >
                                                                        {employee.firstName[0]}
                                                                    </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={`${employee.firstName} ${employee.lastName}`}
                                                                    secondary={employee.email}
                                                                />
                                                                <Chip
                                                                    label={employee.status}
                                                                    color={employee.status === 'admin' ? 'primary' : 'default'}
                                                                    size="small"
                                                                />
                                                            </ListItem>
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
};

export default DepartmentInfoPage; 