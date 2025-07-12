import React from 'react';
import { useToast } from "./ui/use-toast";
import GoogleSignInButton from "./GoogleSignInButton";

interface CustomGoogleAuthProps {
  text: string;
  onSuccess?: (userData: any) => void;
}

export const CustomGoogleAuth: React.FC<CustomGoogleAuthProps> = ({ text }) => {
  const { toast } = useToast();

  // Generate a random state for CSRF protection
  const generateState = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleGoogleAuth = async () => {
    try {
      // Generate state for CSRF protection
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);

      // Google OAuth parameters
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      console.log('🔍 OAuth Debug Info:');
      console.log('Client ID:', clientId ? 'Configured' : 'Missing');
      console.log('Redirect URI:', redirectUri);
      console.log('Current Origin:', window.location.origin);
      
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
        access_type: 'offline',
        prompt: 'consent'
      });

      // Redirect to Google OAuth
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('🔑 Redirecting to Google OAuth:', googleAuthUrl);
      
      window.location.href = googleAuthUrl;

    } catch (error: any) {
      console.error('❌ Google OAuth initialization error:', error);
      
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to initialize Google authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div onClick={handleGoogleAuth}>
      <GoogleSignInButton googleMessage={text} />
    </div>
  );
};

export default CustomGoogleAuth; 