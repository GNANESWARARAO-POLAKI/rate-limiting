import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import apiClient, { setLogoutFunction } from './utils/apiClient';
import { saveUserSession, getUserSession, clearUserSession, extendSession } from './utils/sessionManager';
import { ToastProvider } from './contexts/ToastContext';
import Navigation from './components/Navigation';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token by making a test request
  const validateToken = async (userData) => {
    try {
      // Try to get user stats to validate the token
      if (userData.api_key) {
        await apiClient.get(`/stats/${userData.api_key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Token validation failed:', error);
      return false;
    }
  };

  // Load user data from session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const userData = getUserSession();
      
      if (userData) {
        // Validate the token is still valid
        const isValid = await validateToken(userData);
        
        if (isValid) {
          setUser(userData);
          setIsLoggedIn(true);
          // Extend session on successful validation
          extendSession();
        } else {
          // Token is invalid, clear session
          clearUserSession();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    
    // Save to session storage
    saveUserSession(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    
    // Clear session storage
    clearUserSession();
  };

  // Set up the logout function for API client
  useEffect(() => {
    setLogoutFunction(handleLogout);
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/register" replace />
            } 
          />
          
          <Route 
            path="/login" 
            element={
              isLoggedIn ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              isLoggedIn ? 
                <Navigate to="/dashboard" replace /> : 
                <RegisterPage onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? 
                <Dashboard user={user} /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
