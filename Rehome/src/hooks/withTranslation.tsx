import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Higher-Order Component that provides translation capabilities to a component
 * @param Component The component to wrap
 * @returns A new component with translation capabilities
 */
export const withTranslation = <P extends object>(
  Component: React.ComponentType<P & { t: (key: string, options?: any) => string }>
) => {
  const WithTranslation = (props: P) => {
    const { t } = useTranslation();
    return <Component {...props} t={t} />;
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithTranslation.displayName = `withTranslation(${displayName})`;

  return WithTranslation;
}; 