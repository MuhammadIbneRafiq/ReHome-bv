import React from 'react';
import GoogleSignInButton from "./GoogleSignInButton";

interface GoogleAuthButtonProps {
  text: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ text }) => {
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
      console.log('clientId', clientId);
      
      // Use domain-based environment detection
      const currentDomain = window.location.hostname;
      let redirectUri;
      
      if (currentDomain === 'localhost' || currentDomain.includes('127.0.0.1')) {
        // Local development
        redirectUri = `${window.location.origin}/auth/google/callback`;
        console.log('Using development redirect URI:', redirectUri);
      } else if (currentDomain === 'www.rehomebv.com' || currentDomain === 'rehomebv.com') {
        // Production
        redirectUri = 'https://www.rehomebv.com/auth/google/callback';
        console.log('Using production redirect URI:', redirectUri);
      } else {
        // Unknown domain - use current origin but log a warning
        redirectUri = `${window.location.origin}/auth/google/callback`;
        console.warn('Unknown domain detected:', currentDomain);
        console.warn('Falling back to current origin redirect URI:', redirectUri);
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

      // Log the full auth URL in development
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      if (currentDomain === 'localhost' || currentDomain.includes('127.0.0.1')) {
        console.log('Full Google Auth URL:', googleAuthUrl);
      }
      
      window.location.href = googleAuthUrl;

    } catch (error: any) {
      console.error('Google Auth Error:', error);
    }
  };

  return (
    <div onClick={handleGoogleAuth}>
      <GoogleSignInButton googleMessage={text} />
    </div>
  );
};

export default GoogleAuthButton; 