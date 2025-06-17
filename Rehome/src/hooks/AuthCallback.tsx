import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supaBase';
import { toast } from 'react-toastify';
import useUserStore from '../services/state/useUserSessionStore';

function AuthCallback() {
    const navigate = useNavigate();
    const setUser = useUserStore((state) => state.setUser);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('Processing auth callback...');
                
                // Handle the auth callback
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Auth callback error:', error);
                    toast.error('Authentication failed. Please try again.');
                    navigate('/login');
                    return;
                }

                if (data.session?.access_token) {
                    const { user } = data.session;
                    
                    // Store the token
                    localStorage.setItem('accessToken', data.session.access_token);
                    
                    // Set user in store
                    if (user) {
                        setUser({
                            email: user.email!,
                            sub: user.id,
                            email_verified: user.email_confirmed_at ? true : false,
                            phone_verified: user.phone_confirmed_at ? true : false,
                            role: 'user' // Default role
                        });
                    }
                    
                    console.log('Google auth successful for:', user?.email);
                    toast.success(`Welcome, ${user?.email}!`);
                    
                    // Navigate to marketplace or intended destination
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTo = urlParams.get('redirect') || '/marketplace';
                    navigate(redirectTo);
                } else {
                    console.error('No session found in auth callback');
                    toast.error('Authentication failed. Please try again.');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error during authentication callback:', error);
                toast.error('Authentication failed. Please try again.');
                navigate('/login');
            }
        };

        handleAuthCallback();
    }, [navigate, setUser]);

    // Show loading state while processing
    return (
        <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Processing authentication...</p>
        </div>
    );
}

export default AuthCallback; 