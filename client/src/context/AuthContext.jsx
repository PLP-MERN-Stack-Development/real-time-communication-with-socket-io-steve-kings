import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          
          // If user data doesn't have role, refresh from server
          if (!userData.role && storedToken) {
            console.log('User data missing role, refreshing from server...');
            try {
              const response = await axios.get('/auth/me', {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              const freshUserData = response.data.user;
              localStorage.setItem('user', JSON.stringify(freshUserData));
              setUser(freshUserData);
              console.log('Refreshed user data:', freshUserData);
            } catch (error) {
              console.error('Error refreshing user data:', error);
              setUser(userData); // Use stored data as fallback
            }
          } else {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      console.log('Login response user data:', userData); // Debug log
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      // Different welcome message for admin
      if (userData.role === 'admin') {
        toast.success(`Welcome back, Admin ${userData.username}! 🛡️`);
      } else {
        toast.success(`Welcome back, ${userData.username}!`);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password, adminCode) => {
    try {
      const response = await axios.post('/auth/register', { 
        username, 
        email, 
        password,
        adminCode 
      });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Welcome to Stephen's Chat, ${userData.username}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const loginAsGuest = (username) => {
    const guestUser = {
      username,
      isGuest: true,
      _id: `guest_${Date.now()}`
    };
    
    setUser(guestUser);
    toast.success(`Welcome, ${username}!`);
    return { success: true };
  };

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If refresh fails, logout
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginAsGuest,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};