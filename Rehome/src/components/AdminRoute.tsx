import { ReactNode, useEffect, useRef } from 'react';
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
  'muhammadibnerafiq@gmail.com',
  // Add other admin emails here
];

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const user = useUserStore((state) => state.user);
  // const location = useLocation();
  const { t } = useTranslation();
  
  // Ref to track if toast has been shown
  // const toastShownRef = useRef(false);

  // Check if the user's email is in the admin emails list
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  
  // For debugging
  console.log('AdminRoute - User:', user?.email);
  console.log('AdminRoute - Is Admin:', isAdmin);
  console.log('AdminRoute - Is Authenticated:', isAuthenticated);
  console.log('AdminRoute - Loading:', loading);

  // useEffect(() => {
  //   // Only show toast if it hasn't been shown already
  //   if (toastShownRef.current) return;
    
  //   if (!loading) {
  //     if (!isAuthenticated) {
  //       toast.error(t('Please sign in to continue'));
  //       toastShownRef.current = true;
  //     } else if (!isAdmin) {
  //       toast.error(t('Admin access required'));
  //       toastShownRef.current = true;
  //     }
  //   }
  // }, [isAuthenticated, loading, t, isAdmin]);

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  // // If not authenticated, redirect to login page with the return URL
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  // // If authenticated but not admin, redirect to home page
  // if (!isAdmin) {
  //   return <Navigate to="/" replace />;
  // }

  // If authenticated and admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute; 