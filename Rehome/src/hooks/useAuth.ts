import { useEffect, useState } from "react";
import { UserData } from "../types/UserData";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import useUserSessionStore from "../services/state/useUserSessionStore";
import axios from "axios";

export const useAuth = () => {
  const setUser = useUserSessionStore((state: { setUser: any; }) => state.setUser);
  const setRole = useUserSessionStore((state: { setRole: any; }) => state.setRole);
  // return true or false if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null); // New state for user's email

  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserEmail(null); // Clear the email on logout
    setUser(undefined);
  };

  useEffect(() => {
    const checkAuthentication = () => {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        try {
          const decoded = jwtDecode(accessToken);
          // Assuming your token has an 'email' claim.  Adjust if needed.
          setUserEmail((decoded as any).email || null);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid (expired, etc.)
          handleLogout(); // Clear invalid token
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      } else {
        handleLogout(); // Clear everything
        setIsAuthenticated(false);
        setUserEmail(null);
      }
      setLoading(false);
    };

    checkAuthentication();
  }, [location.pathname]);

  return { isAuthenticated, loading, userEmail, handleLogout }; // Return the email and logout function
};