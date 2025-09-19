import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UserAuthContext = createContext();

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

export const UserAuthProvider = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      
      const response = await userAPI.login({ email, password });
      
      if (response.success) {
        try {
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data.user);
            setIsUserLoggedIn(true);
            return { success: true, user: profileResponse.data.user };
          }
        } catch (profileError) {
          console.log('Could not fetch full profile, using basic user data');
        }
        
        setUser(response.data.user);
        setIsUserLoggedIn(true);
        return { success: true, user: response.data.user };
      } else {
        console.error('Login failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    try {
      
      const response = await userAPI.signup(userData);
      
      if (response.success) {
        // Get full user profile after signup
        try {
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data.user);
            setIsUserLoggedIn(true);
            return { success: true, user: profileResponse.data.user };
          }
        } catch (profileError) {
          console.log('Could not fetch full profile, using basic user data');
        }
        
        setUser(response.data.user);
        setIsUserLoggedIn(true);
        return { success: true, user: response.data.user };
      } else {
        console.error('Signup failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await userAPI.logout();
    setUser(null);
    setIsUserLoggedIn(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Auto-login on app start if token exists
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          const profileResponse = await userAPI.getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.data.user);
            setIsUserLoggedIn(true);
          } else {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
          }
        }
      } catch (error) {
        console.log('Auto-login failed:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const value = {
    isUserLoggedIn,
    user,
    isLoading,
    login,
    signup,
    logout,
    updateUser
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};
