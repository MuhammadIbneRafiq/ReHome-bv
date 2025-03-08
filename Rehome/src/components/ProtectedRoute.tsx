import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error(t('auth.authRequired'));
    }
  }, [isAuthenticated, loading, t]);

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  // If not authenticated, redirect to login page with the return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
