import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from './helper/axiosInstance';
import { verifyRefreshToken, createAccessToken } from '../utils/jwt';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Check for stored tokens on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        try {
          const decoded = verifyRefreshToken(storedRefreshToken);
          if (decoded) {
            // Refresh access token
            const response = await axiosInstance.post('/api/refresh-token', { refreshToken: storedRefreshToken }, {
              headers: { 'x-api-key': 'refreshTokenCheck' }
            });
            if (response.status === 200) {
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setUser({ id: decoded.id, role: decoded.role });
              console.log('Auto-login successful with stored refresh token');
            } else {
              clearTokens();
            }
          } else {
            clearTokens();
          }
        } catch (error) {
          console.error('Error during auto-login:', error);
          clearTokens();
        }
      }
    };
    initializeAuth();
  }, []);

  const login = (newAccessToken, newRefreshToken, rememberMe) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    // Decode token to get user info (assuming JWT)
    const decoded = verifyRefreshToken(newRefreshToken);
    if (decoded) {
      setUser({ id: decoded.id, role: decoded.role });
    } else {
      console.error('Failed to decode refresh token during login');
      return;
    }
    
    // Store tokens based on rememberMe
    if (rememberMe) {
      localStorage.setItem('refreshToken', newRefreshToken);
      sessionStorage.removeItem('refreshToken');
    } else {
      sessionStorage.setItem('refreshToken', newRefreshToken);
      localStorage.removeItem('refreshToken');
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await axiosInstance.post('/api/logout', { re_token: refreshToken });
      }
      clearTokens();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('verifyEmail');
    localStorage.removeItem('otpMessage');
    localStorage.removeItem('rememberMe');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};