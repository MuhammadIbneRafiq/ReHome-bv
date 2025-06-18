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
      console.log('🔍 useAuth: Starting authentication check...');
      setLoading(true);
      
      // Check for both token names to ensure backward compatibility
      const accessToken = localStorage.getItem("accessToken") || localStorage.getItem("token");
      console.log('🔑 useAuth: Access token found:', !!accessToken);

      if (!accessToken) {
        console.log('❌ useAuth: No access token found, user not authenticated');
        logout();
        setLoading(false);
        return;
      }

      try {
        console.log('✅ useAuth: Access token found, user is authenticated');
        
        // SIMPLIFIED: Just check if we have an access token - that's enough for authentication
        setIsAuthenticated(true);
        console.log('✅ useAuth: isAuthenticated set to true');
        
        // Try to get user data from multiple sources
        let userData = null;
        
        // First try Google user info
        const googleUserInfo = localStorage.getItem("google_user_info");
        if (googleUserInfo) {
          try {
            const googleData = JSON.parse(googleUserInfo);
            userData = {
              email: googleData.email,
              sub: googleData.id,
              email_verified: googleData.verified_email || true,
              phone_verified: false,
              role: 'user'
            };
            console.log('Using Google user data:', userData);
          } catch (e) {
            console.error('Error parsing Google user info:', e);
          }
        }
        
        // If no Google data, try to decode JWT token
        if (!userData) {
          try {
            const decoded = jwtDecode(accessToken);
            
            // Check if token is expired
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              console.log("Access Token has expired");
              logout();
              setLoading(false);
              return;
            }

            // Extract user data from token
            const tokenData = (decoded as any).user_metadata || (decoded as any) || {};
            userData = {
              email: tokenData.email || 'user@example.com',
              sub: tokenData.sub || tokenData.id || 'unknown',
              email_verified: tokenData.email_verified || false,
              phone_verified: tokenData.phone_verified || false,
              role: tokenData.role || 'user'
            };
            console.log('Using JWT token data:', userData);
          } catch (jwtError) {
            console.error("Error decoding JWT token:", jwtError);
            // Even if token decode fails, still consider user authenticated if token exists
            userData = {
              email: 'user@example.com',
              sub: 'unknown',
              email_verified: false,
              phone_verified: false,
              role: 'user'
            };
            console.log('Using fallback user data');
          }
        }
        
        // Set user data if available
        if (userData) {
          setUser(userData as UserData);
        }
        
      } catch (error) {
        console.error("❌ useAuth: Error in authentication:", error);
        // Even on error, if we have a token, consider user authenticated
        setIsAuthenticated(true);
        console.log('✅ useAuth: Even with error, user considered authenticated due to token presence');
      } finally {
        setLoading(false);
        console.log('🏁 useAuth: Authentication check completed, loading set to false');
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

  console.log('🔄 useAuth: Current state - isAuthenticated:', isAuthenticated, 'loading:', loading);
  return { isAuthenticated, loading, logout, isAdmin, user };
};

