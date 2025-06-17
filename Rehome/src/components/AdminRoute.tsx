import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import useUserStore from '../services/state/useUserSessionStore';

interface AdminRouteProps {
  children: ReactNode;
}

// List of admin email addresses
const ADMIN_EMAILS = [
  'muhammadibnerafiq123@gmail.com',
  'testnewuser12345@gmail.com', // Test account with admin access
  'egzmanagement@gmail.com',
  'samuel.stroehle8@gmail.com',
  'info@rehomebv.com'
  // Add other admin emails here
];

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const { t } = useTranslation();

  // Debug logs
  console.log('AdminRoute - User:', user?.email);
  console.log('AdminRoute - Admin Access:', user && ADMIN_EMAILS.includes(user.email));
  console.log('AdminRoute - Authenticated:', isAuthenticated);
  console.log('AdminRoute - Loading:', loading);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  // Already logged in, check if admin
  if (isAuthenticated && user) {
    // Check if user email is in admin list
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    
    if (isAdmin) {
      // User is authenticated and admin, render the protected component
      return <>{children}</>;
    } else {
      // User is authenticated but not admin, redirect to home
      toast.error('Admin access required');
      return <Navigate to="/" replace />;
    }
  }
  
  // Not authenticated, redirect to login
  toast.error('Please sign in to continue');
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default AdminRoute; 