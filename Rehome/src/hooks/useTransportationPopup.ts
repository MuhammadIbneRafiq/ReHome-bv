import { useState } from 'react';

interface UseTransportationPopupOptions {
  minIntervalHours?: number; // Minimum time between popups
  maxShowsPerDay?: number; // Maximum times to show per day
  showAfterSeconds?: number; // Delay before showing popup
}

const useTransportationPopup = (options: UseTransportationPopupOptions = {}) => {
  const {
    minIntervalHours = 4, // Show at most once every 4 hours
    maxShowsPerDay = 3, // Maximum 3 times per day
    showAfterSeconds = 30 // Show after 30 seconds of browsing
  } = options;

  const [shouldShow, setShouldShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Check if we should show the popup based on timing rules
  const checkShouldShow = () => {
    const now = new Date();
    const today = now.toDateString();
    
    // Get stored data
    const lastShown = localStorage.getItem('transportationPopup_lastShown');
    const dontShowAgain = localStorage.getItem('transportationPopup_dontShowAgain');
    
    // If user chose not to show again, don't show
    if (dontShowAgain === 'true') {
      return false;
    }
    
    // Check if it's a new day and reset daily count if needed
    const lastShownDate = lastShown ? new Date(parseInt(lastShown)).toDateString() : null;
    let showsToday = localStorage.getItem('transportationPopup_showsToday');
    
    if (lastShownDate !== today) {
      // Reset daily count for new day
      localStorage.setItem('transportationPopup_showsToday', '0');
      showsToday = '0';
    }
    
    // Check daily limit
    const todayShows = parseInt(showsToday || '0');
    if (todayShows >= maxShowsPerDay) {
      return false;
    }
    
    // Check minimum interval
    if (lastShown) {
      const timeSinceLastShow = now.getTime() - parseInt(lastShown);
      const minIntervalMs = minIntervalHours * 60 * 60 * 1000;
      if (timeSinceLastShow < minIntervalMs) {
        return false;
      }
    }
    
    return true;
  };

  // Mark popup as shown
  const markAsShown = () => {
    const now = new Date();
    
    // Update last shown time
    localStorage.setItem('transportationPopup_lastShown', now.getTime().toString());
    
    // Update daily count
    const showsToday = localStorage.getItem('transportationPopup_showsToday') || '0';
    const newShowsToday = parseInt(showsToday) + 1;
    localStorage.setItem('transportationPopup_showsToday', newShowsToday.toString());
    
    setHasShown(true);
    setShouldShow(false);
  };

  // Mark as don't show again
  const markAsDontShowAgain = () => {
    localStorage.setItem('transportationPopup_dontShowAgain', 'true');
    setShouldShow(false);
  };

  // Start the popup timer
  const startPopupTimer = () => {
    if (hasShown) return; // Don't start if already shown in this session
    
    const timer = setTimeout(() => {
      if (checkShouldShow()) {
        setShouldShow(true);
      }
    }, showAfterSeconds * 1000);
    
    return () => clearTimeout(timer);
  };

  // Reset popup state (useful for testing or manual reset)
  const resetPopup = () => {
    localStorage.removeItem('transportationPopup_lastShown');
    localStorage.removeItem('transportationPopup_showsToday');
    localStorage.removeItem('transportationPopup_dontShowAgain');
    setHasShown(false);
    setShouldShow(false);
  };

  return {
    shouldShow,
    hasShown,
    markAsShown,
    markAsDontShowAgain,
    startPopupTimer,
    resetPopup
  };
};

export default useTransportationPopup; 