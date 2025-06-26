import React, { useState, useEffect } from 'react';

interface StableLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  minLoadingTime?: number; // Minimum time to show loading state
}

const StableLoader: React.FC<StableLoaderProps> = ({
  isLoading,
  children,
  loadingComponent,
  minLoadingTime = 200
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setLoadingStartTime(Date.now());
    } else {
      // If loading was very quick, maintain loading state for minimum time
      if (loadingStartTime) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, minLoadingTime - elapsed);
        
        setTimeout(() => {
          setShowLoading(false);
          setLoadingStartTime(null);
        }, remaining);
      } else {
        setShowLoading(false);
      }
    }
  }, [isLoading, loadingStartTime, minLoadingTime]);

  if (showLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default StableLoader; 