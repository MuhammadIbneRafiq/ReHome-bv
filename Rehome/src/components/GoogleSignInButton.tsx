import React from 'react';
import googleLogo from '../assets/googleLogo.png';

interface GoogleInterface {
    googleMessage: string;
}

const GoogleSignInButton: React.FC<GoogleInterface> = ({ googleMessage }) => {
    return (
        <div className="flex items-center justify-center w-full">
            <button className="w-full max-w-[300px] h-[46px] bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2">
                <img src={googleLogo} className="h-[20px]" alt="Google logo" />
                <span>{googleMessage}</span>
            </button>
        </div>
    );
};

export default GoogleSignInButton;
