import React, { createContext, useState, useEffect,useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (localStorage.getItem('token')) {
        try {
          const res = await axios.get('/api/auth/user', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          setUser(res.data);
          setIsAuthenticated(true);
          setError(null);
        } catch (err) {
          console.error('Error checking authentication:', err);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          setError('Authentication failed. Please log in again.');
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials');
      return { success: false, error: err.response?.data?.message || 'Invalid credentials' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUser(res.data);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Profile update failed');
      return { success: false, error: err.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    // Return safe defaults so destructuring doesn't break the app during SSR
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      register: async () => ({ success: false }),
      login: async () => ({ success: false }),
      logout: () => {},
      updateProfile: async () => ({ success: false }),
    };
  }

  return context;
};