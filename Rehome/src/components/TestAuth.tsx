import React from 'react';
import { useToast } from './ui/use-toast';

const TestAuth: React.FC = () => {
    const { toast } = useToast();

    const handleTestLogin = () => {
        // Simulate a successful login for testing
        const testUser = {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            picture: 'https://via.placeholder.com/150'
        };

        // Store test user info
        localStorage.setItem('google_user_info', JSON.stringify(testUser));
        localStorage.setItem('accessToken', 'test-token-123');

        toast({
            title: "Test Login Successful!",
            description: `Welcome, ${testUser.name}!`,
            className: "bg-green-50 border-green-200",
        });

        // Redirect to marketplace
        setTimeout(() => {
            window.location.href = '/marketplace';
        }, 1000);
    };

    return (
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🧪 Test Authentication</h3>
            <p className="text-sm text-blue-600 mb-3">
                Use this to test the app without Google OAuth setup
            </p>
            <button
                onClick={handleTestLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
                Test Login (Skip OAuth)
            </button>
        </div>
    );
};

export default TestAuth; 