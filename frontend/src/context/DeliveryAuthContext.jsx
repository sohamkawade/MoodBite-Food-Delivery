import React, { createContext, useContext, useState, useEffect } from 'react';
import { deliveryAuthAPI } from '../services/api';

const DeliveryAuthContext = createContext();

export const useDeliveryAuth = () => {
  const context = useContext(DeliveryAuthContext);
  if (!context) {
    throw new Error('useDeliveryAuth must be used within a DeliveryAuthProvider');
  }
  return context;
};

export const DeliveryAuthProvider = ({ children }) => {
  const [deliveryUser, setDeliveryUser] = useState(null);
  const [isDeliveryLoggedIn, setIsDeliveryLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('deliveryToken');
      if (token) {
        const response = await deliveryAuthAPI.getProfile();
        if (response.success) {
          setDeliveryUser(response.data);
          setIsDeliveryLoggedIn(true);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('deliveryToken');
          localStorage.removeItem('deliveryData');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('deliveryToken');
      localStorage.removeItem('deliveryData');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await deliveryAuthAPI.login(credentials);
      
      if (response.success) {
        if (response.data?.requiresApproval) {
          // Handle pending approval case
          setIsDeliveryLoggedIn(false);
          setDeliveryUser(null);
          return { 
            success: true, 
            requiresApproval: true,
            message: response.message || 'Account is pending approval. You will be notified once approved.'
          };
        } else if (response.data?.token) {
          // Normal successful login
          localStorage.setItem('deliveryToken', response.data.token);
          localStorage.setItem('deliveryData', JSON.stringify(response.data.deliveryBoy));
          setDeliveryUser(response.data.deliveryBoy);
          setIsDeliveryLoggedIn(true);
          return { success: true };
        } else {
          return { success: false, message: response.message || 'Login failed' };
        }
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await deliveryAuthAPI.register(userData);
      
      if (response.success) {
        return { success: true, message: 'Registration successful! Please wait for admin approval.' };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await deliveryAuthAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('deliveryToken');
      localStorage.removeItem('deliveryData');
      setDeliveryUser(null);
      setIsDeliveryLoggedIn(false);
    }
  };

  const updateDeliveryUser = (updatedUser) => {
    setDeliveryUser(updatedUser);
    localStorage.setItem('deliveryData', JSON.stringify(updatedUser));
  };

  const value = {
    deliveryUser,
    isDeliveryLoggedIn,
    isLoading,
    login,
    register,
    logout,
    updateDeliveryUser,
  };

  return (
    <DeliveryAuthContext.Provider value={value}>
      {children}
    </DeliveryAuthContext.Provider>
  );
};
