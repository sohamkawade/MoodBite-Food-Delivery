import React, { createContext, useContext, useState, useEffect } from "react";
import { adminAPI } from "../services/api";

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const adminToken = localStorage.getItem("adminToken");
      const adminData = localStorage.getItem("adminData");

      if (adminToken && adminData) {
        try {
          const admin = JSON.parse(adminData);

          const response = await adminAPI.getProfile();

          if (response.success) {
            // Token is valid, restore session
            setAdminUser(admin);
            setIsAdminLoggedIn(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminData");
            setAdminUser(null);
            setIsAdminLoggedIn(false);
          }
        } catch (error) {
          // Error occurred, clear storage
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          setAdminUser(null);
          setIsAdminLoggedIn(false);
        }
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await adminAPI.login(credentials);

      if (response.success) {
        // Store admin data in localStorage
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminData", JSON.stringify(response.data.admin));
        
        try {
          const profileResponse = await adminAPI.getProfile();
          if (profileResponse.success) {
            setAdminUser(profileResponse.data.admin);
            setIsAdminLoggedIn(true);
            return { success: true, user: profileResponse.data.admin };
          }
        } catch (profileError) {
          console.log("Could not fetch full profile, using basic user data");
        }

        setAdminUser(response.data.admin);
        setIsAdminLoggedIn(true);
        return { success: true, user: response.data.admin };
      } else {
        // Handle OTP challenge
        if (response.data?.challenge === 'otp_required') {
          return { success: false, message: response.message, data: response.data };
        }
        console.error("Login failed:", response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminAPI.logout();
    } catch (error) {
      console.log("Logout API call failed, but clearing local data");
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      setAdminUser(null);
      setIsAdminLoggedIn(false);
    }
  };

  const value = {
    isAdminLoggedIn,
    adminUser,
    isLoading,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
