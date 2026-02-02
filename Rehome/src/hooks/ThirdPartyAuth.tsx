import { supabase } from "../lib/supabaseClient";
import { useForm } from "react-hook-form";
import { useToast } from "../components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GoogleSignInButton from "../components/GoogleSignInButton";
import React from "react";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
// import useUserSessionStore from "../services/state/useUserSessionStore";

const formSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(20, "Password cannot be longer than 20 characters"),
});

interface ThirdPartyInterface {
    text: string;
}

export const ThirdPartyAuth: React.FC<ThirdPartyInterface> = ({ text }) => {
    const { toast } = useToast();
    // const setUser = useUserSessionStore((state) => state.setUser);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Primary Supabase OAuth method (since you have it already configured)
    async function supabaseGoogleAuth() {
        try {
            console.log('🔑 Using Supabase Google OAuth (Primary method)...');
            
            // Get current origin for dynamic redirect URL
            const currentOrigin = window.location.origin;
            const redirectUrl = `${currentOrigin}/auth/callback`;
            
            console.log('🔗 Redirect URL:', redirectUrl);
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            
            if (error) {
                console.error('❌ Supabase Google OAuth error:', error);
                throw error;
            }
            
            console.log('✅ Supabase OAuth request initiated successfully');
        } catch (error: any) {
            console.error('❌ Error in supabaseGoogleAuth:', error);
            
            // Try fallback method if available
            if (import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com') {
                console.log('🔄 Trying fallback method...');
                directGoogleAuth();
                return;
            }
            
            form.setError("root", {
                message: error.message || "Authentication failed",
            });
            
            toast({
                title: "Authentication Error",
                description: error.message || "Failed to authenticate with Google. Please try again.",
                variant: "destructive",
            });
        }
    }

    // Fallback: Direct Google OAuth (only if Client ID is configured)
    const googleLogin = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            try {
                console.log('🔑 Direct Google login success:', codeResponse);
                
                // Get user info using access token
                const userInfoResponse = await axios.get(
                    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${codeResponse.access_token}`,
                    {
                        headers: {
                            Authorization: `Bearer ${codeResponse.access_token}`,
                            Accept: "application/json",
                        },
                    }
                );

                const userInfo = userInfoResponse.data;
                console.log('👤 User info from Google:', userInfo);

                // SIMPLIFIED: Just use the Google access token directly
                console.log('Google login successful, storing access token');
                localStorage.setItem('accessToken', codeResponse.access_token);
                localStorage.setItem('google_user_info', JSON.stringify(userInfo));
                
                console.log('Access token and user info stored');
                
                toast({
                    title: "Success!",
                    description: `Welcome, ${userInfo.name || userInfo.email}!`,
                    className: "bg-green-50 border-green-200",
                });

                // Force a page reload to trigger authentication check
                window.location.href = '/sell-dash';

            } catch (error: any) {
                console.error('❌ Direct Google auth error:', error);
                toast({
                    title: "Authentication Error",
                    description: error.message || "Failed to authenticate with Google. Please try again.",
                    variant: "destructive",
                });
            }
        },
        onError: (error) => {
            console.error('❌ Google OAuth error:', error);
            // Fallback to Supabase method
            supabaseGoogleAuth();
        }
    });

    const directGoogleAuth = () => {
        try {
            console.log('🔑 Attempting direct Google OAuth...');
            googleLogin();
        } catch (error) {
            console.log('❌ Direct Google auth not available, using Supabase OAuth');
            supabaseGoogleAuth();
        }
    };

    const handleGoogleAuth = () => {      
        supabaseGoogleAuth();
    
    };

    return (
        <div onClick={handleGoogleAuth}>
            <GoogleSignInButton googleMessage={text} />
        </div>
    );
};

export default ThirdPartyAuth;
