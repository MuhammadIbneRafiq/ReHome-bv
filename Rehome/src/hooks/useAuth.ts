import { useEffect, useState } from "react";
import { UserData } from "@/types/UserData";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import useUserSessionStore from "@/services/state/useUserSessionStore";

export const useAuth = () => {
  const setUser = useUserSessionStore((state) => state.setUser);
  const user = useUserSessionStore((state) => state.user);
  // return true or false if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Check if user is admin - you can modify this logic based on your needs
  const isAdmin = user?.email === 'admin@rehome.com' || 
                  user?.email?.includes('admin') || 
                  user?.role === 'admin';

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("google_user_info");
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
        // First check if we have Google user info stored
        const googleUserInfo = localStorage.getItem("google_user_info");
        console.log('Using Google user data:', googleUserInfo);

        if (googleUserInfo) {
          // Use Google user info if available
          const userData = JSON.parse(googleUserInfo);
          console.log('Using Google user data:', userData);
          
          const userForStore: UserData = {
            email: userData.email,
            sub: userData.id,
            email_verified: userData.verified_email || true,
            phone_verified: false,
            role: 'user'
          };
          
          setUser(userForStore);
          console.log('User authenticated with Google data');
          setIsAuthenticated(true);
        } else {
          // Try to decode JWT token for other auth methods
          try {
            const decoded = jwtDecode(accessToken);

            if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
              console.log("Access Token has expired");
              logout();
              setLoading(false);
              return;
            }

            // Handle different token structures
            const userMetadata = (decoded as any).user_metadata || (decoded as any);
            setUser(userMetadata as UserData);
            console.log('User authenticated with JWT token');
            setIsAuthenticated(true);
          } catch (jwtError) {
            console.error("Error decoding JWT token:", jwtError);
            console.log("Token might be a direct Google OAuth token, clearing old data...");
            logout();
          }
        }
      } catch (error) {
        console.error("Error in authentication:", error);
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

  return { isAuthenticated, loading, logout, isAdmin, user };
};
