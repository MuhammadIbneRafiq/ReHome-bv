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
      console.log('import.meta.env.MODE', import.meta.env.MODE);
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      // Use environment-specific redirect URI
      let redirectUri;
      if (import.meta.env.MODE === 'development') {
        redirectUri = `${window.location.origin}/auth/google/callback`;
      } else {
        // In production, always use https://www.rehomebv.com
        redirectUri = 'https://www.rehomebv.com/auth/google/callback';
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