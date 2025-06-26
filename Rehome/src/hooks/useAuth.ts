import { useEffect, useState } from "react";
import { UserData } from "@/types/UserData";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import useUserSessionStore from "@/services/state/useUserSessionStore";
import { toast } from "../components/ui/use-toast";

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

  const logout = (showToast = false, reason = '') => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("google_user_info");
    setIsAuthenticated(false);
    setUser(undefined);
    
    if (showToast) {
      toast({
        title: "🔐 Session Expired",
        description: reason || "Your login session has expired. Please sign in again to continue.",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  // Check if token is close to expiring (within 5 minutes)
  const isTokenExpiringSoon = (token: string): boolean => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        return (expirationTime - currentTime) < fiveMinutes;
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    return false;
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
        
        // Try to get user data from multiple sources
        let userData = null;
        let tokenExpired = false;
        
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
        
        // If no Google data, try to decode JWT token and check expiration
        if (!userData) {
          try {
            const decoded = jwtDecode(accessToken);
            
            // Check if token is expired
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              console.log("Access Token has expired");
              logout(true, "Your session has expired. Please sign in again.");
              setLoading(false);
              return;
            }

            // Check if token is expiring soon and warn user
            if (isTokenExpiringSoon(accessToken)) {
              toast({
                title: "⏰ Session Expiring Soon",
                description: "Your session will expire in less than 5 minutes. Please save your work and sign in again.",
                variant: "default",
                duration: 10000,
              });
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
        
        // Only set authenticated if token is not expired
        if (!tokenExpired) {
          setIsAuthenticated(true);
          console.log('✅ useAuth: isAuthenticated set to true');
        }
        
        // Set user data if available
        if (userData) {
          setUser(userData as UserData);
        }
        
      } catch (error) {
        console.error("❌ useAuth: Error in authentication:", error);
        // On error, consider user not authenticated for security
        logout(true, "Authentication error occurred. Please sign in again.");
      }
      
      setLoading(false);
      console.log('🏁 useAuth: Authentication check completed, loading set to false');
    }

    fetchUser();

    // Set up an interval to check authentication status more frequently
    const intervalId = setInterval(fetchUser, 30000); // Check every 30 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [location.pathname]);

  console.log('🔄 useAuth: Current state - isAuthenticated:', isAuthenticated, 'loading:', loading);
  return { isAuthenticated, loading, logout, isAdmin, user };
};

