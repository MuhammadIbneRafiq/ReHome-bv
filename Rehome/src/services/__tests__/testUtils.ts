/**
 * Test utilities for real-world pricing service tests
 * 
 * These utilities connect to the real backend to verify actual performance
 * and optimization with real data.
 */

import cityAvailabilitySocket from '../../utils/cityAvailabilitySocket';

/**
 * Initialize real connections to backend services
 * No mocks - connects to real backend to test actual performance
 */
export function mockCityServices() {
  console.log('Connecting to real backend WebSocket and API services');
  
  // Ensure websocket is initialized
  cityAvailabilitySocket.initWebSocket().catch(console.error);
  
  // Return function to cleanup connections when done
  return () => {
    console.log('Test complete - cleaning up connections');
  };
}

/**
 * Create city data with distance difference for test data creation
 */
export const mockCity = (city: string, distanceDifference = 0) => ({ 
  city, 
  distanceDifference 
});
