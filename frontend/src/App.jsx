import { useState } from 'react'
import LoginPage from './components/pages/LoginPage'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router'
import HomePage from './components/pages/HomePage'
import RegisterPage from './components/pages/RegisterPage'
import ProfilePage from './components/pages/ProfilePage'
import SettingsPage from './components/pages/SettingsPage'
import RequestsPage from './components/pages/RequestsPage'
import { SettingsProvider } from './contexts/SettingsContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={
              <div
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >
                <LoginPage/>
              </div> 
            }
          />
          <Route
            path="/home"
            element={<HomePage/>}
          />
          <Route
            path="/home/requests"
            element={<RequestsPage/>}
          />
          <Route
            path="/register"
            element={<RegisterPage/>}
          />
          <Route
            path="/profile"
            element={<ProfilePage/>}
          />
          <Route
            path="/settings"
            element={<SettingsPage/>}
          />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}

export default App
