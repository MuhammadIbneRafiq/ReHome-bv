declare module '@react-google-maps/api' {
  import React from 'react';
  
  export interface GoogleMapProps {
    mapContainerStyle?: React.CSSProperties;
    center?: { lat: number; lng: number };
    zoom?: number;
    onClick?: (e: any) => void;
    onLoad?: (map: any) => void;
    onUnmount?: (map: any) => void;
    children?: React.ReactNode;
  }
  
  export interface StandaloneSearchBoxProps {
    onLoad?: (searchBox: any) => void;
    onPlacesChanged?: () => void;
    children?: React.ReactNode;
  }
  
  export interface LoadScriptProps {
    googleMapsApiKey: string;
    libraries?: string[];
    children?: React.ReactNode;
  }
  
  export interface UseJsApiLoaderOptions {
    googleMapsApiKey: string;
    libraries?: string[];
    id?: string;
  }
  
  export interface UseJsApiLoaderResult {
    isLoaded: boolean;
    loadError?: Error;
  }
  
  export const GoogleMap: React.FC<GoogleMapProps>;
  export const Marker: React.FC<any>;
  export const StandaloneSearchBox: React.FC<StandaloneSearchBoxProps>;
  export const LoadScript: React.FC<LoadScriptProps>;
  export const useJsApiLoader: (options: UseJsApiLoaderOptions) => UseJsApiLoaderResult;
} 