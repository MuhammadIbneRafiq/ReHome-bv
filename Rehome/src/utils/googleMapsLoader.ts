/**
 * Singleton Google Maps API Loader
 * 
 * This utility ensures the Google Maps API is loaded only once
 * and follows the recommended best practice of using loading=async
 * as per Google documentation: https://goo.gle/js-api-loading
 */

// Track loading state
let isLoading = false;
let isLoaded = false;

// Store callbacks for when API loads
const callbacks: Array<() => void> = [];

// Load the Google Maps API using the proper async pattern
export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.google && window.google.maps) {
      isLoaded = true;
      resolve();
      return;
    }

    // If currently loading, add to callbacks
    if (isLoading) {
      callbacks.push(() => resolve());
      return;
    }

    // Start loading
    isLoading = true;

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
    if (!apiKey) {
      reject(new Error('Google Maps API key not found'));
      return;
    }

    // Create callback name for the global callback
    const callbackName = `googleMapsInitialized_${Date.now()}`;
    
    // Create global callback function
    (window as any)[callbackName] = () => {
      isLoaded = true;
      isLoading = false;
      
      // Resolve this promise
      resolve();
      
      // Call any queued callbacks
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
      
      // Clean up global callback
      delete (window as any)[callbackName];
    };

    // Create script with proper async loading pattern
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    // Append to head
    document.head.appendChild(script);
  });
};

// Check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded;
};
