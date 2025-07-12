import { useEffect, useState } from "react";
import { UserData } from "@/types/UserData";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";
import { toast } from "../components/ui/use-toast";
import { useUserSessionStore } from "@/services/state/useUserSessionStore";

export const useAuth = () => {
  const setUser = useUserSessionStore((state) => state.setUser);
  const user = useUserSessionStore((state) => state.user);
  // return true or false if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);

  const location = useLocation();

  // Check if user is admin - you can modify this logic based on your needs
  const isAdmin = user?.email === 'admin@rehome.com';

  const logout = (showToast = false, reason = '') => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("google_user_info");
    setIsAuthenticated(false);
    setUser(undefined);
    setSessionTimeLeft(null);
    
    if (showToast) {
      toast({
        title: "🔐 Session Expired",
        description: reason || "Your login session has expired. Please sign in again to continue.",
        variant: "destructive",
        duration: 8000,
      });
      
      // Redirect to login after showing toast
      setTimeout(() => {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }, 2000);
    }
  };

  // Check if token is close to expiring (within 30 minutes for 48hr tokens)
  const isTokenExpiringSoon = (token: string): boolean => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        return (expirationTime - currentTime) < thirtyMinutes;
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    return false;
  };

  // Get time remaining until token expires
  const getTimeUntilExpiration = (token: string): number | null => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        return Math.max(0, expirationTime - currentTime);
      }
    } catch (error) {
    }
    return null;
  };

  // Format time remaining for display
  const formatTimeRemaining = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {return `${hours}h ${minutes}m`;}
    return `${minutes}m`;
  };

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      // Check for both token names to ensure backward compatibility
      const accessToken = localStorage.getItem("accessToken") 
      console.log('accessToken', accessToken);
      if (!accessToken) {
        logout();
        setLoading(false);
        return;
      }

      try {       
        let userData = null;
        let tokenExpired = false;
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

            // Update session time left
            const timeLeft = getTimeUntilExpiration(accessToken);
            if (timeLeft !== null) {
              setSessionTimeLeft(timeLeft);
            }

            // Check if token is expiring soon and warn user
            if (isTokenExpiringSoon(accessToken)) {
              const timeRemaining = formatTimeRemaining(timeLeft || 0);
              toast({
                title: "⏰ Session Expiring Soon",
                description: `Your session will expire in ${timeRemaining}. Please save your work and sign in again.`,
                variant: "default",
                duration: 10000,
              });
            }
            console.log('decoded loojs like this', decoded);
            // Extract user data from token
            const tokenData = (decoded as any);
            console.log('tokenData', tokenData);
            userData = {
              email: tokenData.email,
              sub: tokenData.sub,
              email_verified: tokenData.email_verified,
              phone_verified: tokenData.phone_verified || true,
              role: tokenData.role || 'user'
            };
            console.log('Using JWT token data:', userData);
          } catch (jwtError) {
            console.error("Error decoding JWT token:", jwtError);
          }
        }
        if (!tokenExpired) {
          setIsAuthenticated(true);
        }
        setUser(userData as UserData);
      } catch (error) {
        logout(true, "Authentication error occurred. Please sign in again.");
      }
      setLoading(false);
    }
    fetchUser();
    // Set up an interval to check authentication status more frequently
    const intervalId = setInterval(() => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
      const timeLeft = getTimeUntilExpiration(accessToken);
      if (timeLeft !== null) {
        setSessionTimeLeft(timeLeft);
        
        if (timeLeft <= 0) {
          logout(true, "Your session has expired automatically. Please sign in again.");
        }
      }
      }
    }, 30000); // Check every 30 seconds
    return () => {
      clearInterval(intervalId);
    };
  }, [location.pathname]);

  return { 
    isAuthenticated, loading, logout, isAdmin, 
    user, sessionTimeLeft,
    formatTimeRemaining: sessionTimeLeft ? formatTimeRemaining(sessionTimeLeft) : null
  };
};