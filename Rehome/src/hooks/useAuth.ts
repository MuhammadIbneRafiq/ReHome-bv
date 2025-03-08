import { useEffect, useState } from "react";
import { UserData } from "@/types/UserData";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import useUserSessionStore from "@/services/state/useUserSessionStore";

export const useAuth = () => {
  const setUser = useUserSessionStore((state) => state.setUser);
  // return true or false if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(undefined);
  };

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      // Check for both token names to ensure backward compatibility
      const accessToken = localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!accessToken) {
        logout();
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(accessToken);

        if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
          console.log("Access Token has expired");
          logout();
          setLoading(false);
          return;
        }

        setUser((decoded as any).user_metadata as UserData);
        console.log('User authenticated');
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error decoding token:", error);
        logout();
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    // Set up an interval to check authentication status
    const intervalId = setInterval(fetchUser, 60000); // 60000 ms = 1 minute

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [location.pathname]);

  return { isAuthenticated, loading, logout };
};
