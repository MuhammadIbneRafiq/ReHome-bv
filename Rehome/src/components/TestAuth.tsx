import React from 'react';
import { useToast } from './ui/use-toast';
import { ThirdPartyAuth } from '../hooks/ThirdPartyAuth';

const TestAuth: React.FC = () => {
    const { toast } = useToast();

    const clearOldData = () => {
        // Clear all authentication-related data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('google_user_info');
        
        toast({
            title: "Data Cleared",
            description: "Old authentication data has been cleared. Please sign in again.",
            className: "bg-yellow-50 border-yellow-200",
        });
        
        // Force a page reload to clear any cached state
        window.location.reload();
    };

    return (
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🔐 Authentication</h3>
            <p className="text-sm text-blue-600 mb-3">
                Sign in with your Google account to access the marketplace
            </p>
            <div className="space-y-3">
                <ThirdPartyAuth text="Sign in with Google" />
                <button
                    onClick={clearOldData}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                >
                    Clear Old Data & Refresh
                </button>
            </div>
        </div>
    );
};

export default TestAuth; 