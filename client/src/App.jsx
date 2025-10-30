import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Stephen's Chat...</p>
      </div>
    );
  }

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (!user) return "/login";
    return user.role === 'admin' ? "/admin" : "/chat";
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={getRedirectPath()} /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to={getRedirectPath()} /> : <Register />} 
      />
      <Route 
        path="/chat" 
        element={user ? <Chat /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/admin" 
        element={user ? <AdminDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={getRedirectPath()} />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;