import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ro, enUS } from 'date-fns/locale';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import HomePage from './components/pages/HomePage';
import ProfilePage from './components/pages/ProfilePage';
import SettingsPage from './components/pages/SettingsPage';
import RequestsPage from './components/pages/RequestsPage';
import ManageRequestsPage from './components/pages/ManageRequestsPage';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { CalendarProvider } from './contexts/CalendarContext';
import ManageEmployees from './components/ManageEmployees';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={localStorage.getItem('language') === 'ro' ? ro : enUS}>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <CalendarProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:id" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/requests" element={
                  <ProtectedRoute>
                    <RequestsPage />
                  </ProtectedRoute>
                } />
                <Route path="/requests/new" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/manage-requests" element={
                  <ProtectedRoute>
                    <ManageRequestsPage />
                  </ProtectedRoute>
                } />
                <Route path="/manage-employees" element={
                  <ProtectedRoute>
                    <ManageEmployees />
                  </ProtectedRoute>
                } />

                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Catch all other routes and redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </CalendarProvider>
          </SettingsProvider>
        </AuthProvider>
      </Router>
    </LocalizationProvider>
  );
}

export default App;
