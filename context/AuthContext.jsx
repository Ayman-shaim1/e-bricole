import React, { createContext, useState, useContext, useEffect } from "react";
import { checkSession } from "../services/authService";

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Store the user role

  // Check if the user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const session = await checkSession();
        if (session.loggedIn) {
          // Store the complete user object including serviceType
          const userWithData = {
            ...session.user,
            isClient: session.isClient,
            // Make sure serviceType is included if it exists
            serviceType: session.user.serviceType || null,
          };
          setUser(userWithData);
          setUserRole(session.isClient);
          setIsAuthenticated(true);

          // Debug log to verify the data
        } else {
          setUser(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Function to determine if the user is a client
  const isClient = () => {
    return userRole === true;
  };

  // Function to determine if the user is an artisan
  const isArtisan = () => {
    return userRole === false;
  };

  // The value that will be provided to consumers of this context
  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    userRole,
    setUserRole,
    isClient,
    isArtisan,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
