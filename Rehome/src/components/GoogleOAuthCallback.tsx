import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_ENDPOINTS from '../lib/api/config';

export const GoogleOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth Error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Verify state to prevent CSRF attacks
        const savedState = sessionStorage.getItem('oauth_state');
        
        if (!state) {
          console.warn('⚠️ No state parameter received from Google');
        } else if (!savedState) {
          console.warn('⚠️ No saved state found in sessionStorage');
        } else if (state !== savedState) {
          console.warn('⚠️ State mismatch - continuing anyway for development');
          // In production, you might want to throw an error here
          // throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Clean up state
        if (savedState) {
          sessionStorage.removeItem('oauth_state');
        }

        // Exchange code for tokens
        const response = await fetch(API_ENDPOINTS.AUTH.GOOGLE_CALLBACK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: `${window.location.origin}/auth/google/callback`,
            response_type: 'id_token token', // Request both ID token and access token
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Backend error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
          });
          
          let errorMessage = errorData.error || 'Failed to authenticate with Google';
          if (response.status === 500 && errorData.error?.includes('not configured')) {
            errorMessage = 'Backend Google OAuth not configured. Please check environment variables.';
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.accessToken) { // Using accessToken which is a JWT
          // Store the JWT token
          localStorage.setItem('accessToken', data.accessToken);
          
          // ID tokens have a standard exp claim we can decode
          try {
            const tokenParts = data.accessToken.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp) {
              localStorage.setItem('tokenExpiry', (payload.exp * 1000).toString());
            }
          } catch (e) {
            console.warn('Could not decode token expiry');
          }

          if (data.user) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
          }
                    
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = "/sell-dash";
          }, 1500);
          
        } 
      } catch (error: any) {
        console.error('❌ Google OAuth callback error:', error);
        
        // Redirect to login page after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 dark:border-t-blue-300 opacity-20"></div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Authenticating with Google
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please wait...
          </p>
        </div>
        
        {/* Animated Dots */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback; 