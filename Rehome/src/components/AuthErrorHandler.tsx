import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from './ui/use-toast';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ children }) => {
  const { isAuthenticated, sessionTimeLeft, formatTimeRemaining } = useAuth();

  useEffect(() => {
    // Global error handler for fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for auth errors in API responses
        if (response.status === 401 || response.status === 403) {
          const responseData = await response.clone().json().catch(() => ({}));
          
          if (responseData.error && 
              (responseData.error.includes('token') || 
               responseData.error.includes('expired') || 
               responseData.error.includes('unauthorized'))) {
            
            // Clear tokens and show message
            localStorage.removeItem("accessToken");
            localStorage.removeItem("token");
            localStorage.removeItem("google_user_info");
            
            toast({
              title: "🔐 Session Expired",
              description: "Your session has expired during this request. Please sign in again to continue.",
              variant: "destructive",
              duration: 8000,
            });
            
            // Redirect to login after a short delay
            setTimeout(() => {
              const currentPath = window.location.pathname + window.location.search;
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }, 2000);
          }
        }
        
        return response;
      } catch (error) {
        // Handle network errors that might be auth-related
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.log('Network error occurred, might be auth-related');
        }
        throw error;
      }
    };

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Show session countdown when user is authenticated and time is running low
  useEffect(() => {
    if (isAuthenticated && sessionTimeLeft && sessionTimeLeft > 0) {
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      // Show different warnings based on time left
      if (sessionTimeLeft <= fiveMinutes && sessionTimeLeft > 0) {
        // Critical warning - session expires in 5 minutes
        const timeDisplay = formatTimeRemaining || '5 minutes';
        toast({
          title: "🚨 Session Expiring VERY Soon!",
          description: `Your session will expire in ${timeDisplay}. Please save your work immediately and sign in again.`,
          variant: "destructive",
          duration: 15000, // Show longer for critical warning
        });
      } else if (sessionTimeLeft <= thirtyMinutes && sessionTimeLeft > fiveMinutes) {
        // Warning - session expires in 30 minutes
        const timeDisplay = formatTimeRemaining || '30 minutes';
        toast({
          title: "⏰ Session Expiring Soon",
          description: `Your session will expire in ${timeDisplay}. Please save your work and consider signing in again.`,
          variant: "default",
          duration: 10000,
        });
      } else if (sessionTimeLeft <= oneHour && sessionTimeLeft > thirtyMinutes) {
        // Info - session expires in 1 hour
        const timeDisplay = formatTimeRemaining || '1 hour';
        toast({
          title: "ℹ️ Session Status",
          description: `Your session will expire in ${timeDisplay}. You'll be reminded again as it gets closer.`,
          variant: "default",
          duration: 5000,
        });
      }
    }
  }, [isAuthenticated, sessionTimeLeft, formatTimeRemaining]);

  return <>{children}</>;
};

export default AuthErrorHandler; 