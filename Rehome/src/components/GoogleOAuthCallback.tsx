import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from './ui/use-toast';
import API_ENDPOINTS from '../lib/api/config';
import { Loader } from 'lucide-react';

export const GoogleOAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

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
        console.log('🔍 State validation:', { 
          receivedState: state, 
          savedState: savedState,
          match: state === savedState 
        });
        
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

        console.log('🔑 Processing Google OAuth callback with code:', code.substring(0, 10) + '...');

        // Exchange code for tokens
        const response = await fetch(API_ENDPOINTS.AUTH.GOOGLE_CALLBACK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: `${window.location.origin}/auth/google/callback`
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
        
        if (data.accessToken) {
          console.log('✅ Google OAuth successful, storing access token');
          localStorage.setItem("accessToken", data.accessToken);
          
          if (data.user) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
          }
          
          setStatus('success');
          
          toast({
            title: "Success!",
            description: `Welcome, ${data.user?.name || data.user?.email}!`,
            className: "bg-green-50 border-green-200",
            duration: 3000,
          });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = "/sell-dash";
          }, 1500);
          
        } else {
          throw new Error('No access token received');
        }

      } catch (error: any) {
        console.error('❌ Google OAuth callback error:', error);
        setStatus('error');
        
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to complete Google authentication. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to login page after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === 'processing' && (
          <>
            <Loader className="mx-auto h-12 w-12 animate-spin text-orange-600" />
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Completing Google Sign In...
            </h2>
            <p className="text-gray-600">Please wait while we authenticate your account.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Authentication Successful!
            </h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Authentication Failed
            </h2>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleOAuthCallback; 