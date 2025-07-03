import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

export const SessionStatus: React.FC = () => {
  const { isAuthenticated, sessionTimeLeft, formatTimeRemaining } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const getSessionInfo = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp) {
        const expirationDate = new Date(decoded.exp * 1000);
        const issuedDate = decoded.iat ? new Date(decoded.iat * 1000) : null;
        
        return {
          expirationDate,
          issuedDate,
          timeLeft: sessionTimeLeft
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return null;
  };

  const sessionInfo = getSessionInfo();
  
  if (!sessionInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Session Status</h3>
        <p className="text-sm text-gray-600">Unable to determine session details</p>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!sessionInfo.timeLeft) return 'text-gray-600';
    
    const oneHour = 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (sessionInfo.timeLeft <= thirtyMinutes) return 'text-red-600';
    if (sessionInfo.timeLeft <= oneHour) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!sessionInfo.timeLeft) return '❓';
    
    const oneHour = 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (sessionInfo.timeLeft <= thirtyMinutes) return '🔴';
    if (sessionInfo.timeLeft <= oneHour) return '🟡';
    return '🟢';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-800">Session Status</h3>
        <span className="text-lg">{getStatusIcon()}</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {sessionInfo.timeLeft && sessionInfo.timeLeft > 0 ? 'Active' : 'Expired'}
          </span>
        </div>
        
        {sessionInfo.timeLeft && sessionInfo.timeLeft > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Time remaining:</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {formatTimeRemaining || 'Unknown'}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Expires at:</span>
          <span className="font-medium text-gray-800">
            {sessionInfo.expirationDate.toLocaleString()}
          </span>
        </div>
        
        {sessionInfo.issuedDate && (
          <div className="flex justify-between">
            <span className="text-gray-600">Logged in:</span>
            <span className="text-gray-600">
              {sessionInfo.issuedDate.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      
      {sessionInfo.timeLeft && sessionInfo.timeLeft > 0 && sessionInfo.timeLeft <= 60 * 60 * 1000 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
          >
            Extend Session
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionStatus; 