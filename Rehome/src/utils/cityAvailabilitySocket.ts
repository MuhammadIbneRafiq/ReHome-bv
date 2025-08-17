/**
 * WebSocket client for real-time city availability updates
 * 
 * This module provides a WebSocket client that connects to the server
 * for real-time updates on city availability, preventing race conditions
 * and ensuring all clients have the latest data.
 */

import API_ENDPOINTS from '../lib/api/config';
import apiCache from './apiCache';

// WebSocket connection
let socket: WebSocket | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

// Subscription callbacks
const subscriptions = new Map<string, Set<(isAvailable: boolean) => void>>();

// Batch request callbacks
const batchRequests = new Map<string, (results: Record<string, boolean>) => void>();

/**
 * Initialize WebSocket connection
 */
export function initWebSocket(): Promise<void> {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return Promise.resolve();
  }
  
  if (isConnecting) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  
  isConnecting = true;
  
  return new Promise((resolve, reject) => {
    try {
      // Extract base URL from API endpoints
      const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
      const wsUrl = baseUrl.replace(/^http/, 'ws');
      
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        isConnecting = false;
        reconnectAttempts = 0;
        resolve();
      };
      
      socket.onmessage = (event) => {
        handleWebSocketMessage(event.data);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnecting = false;
        reject(error);
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        isConnecting = false;
        socket = null;
        
        // Attempt reconnection
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(() => {
            initWebSocket().catch(console.error);
          }, RECONNECT_DELAY * reconnectAttempts);
        }
      };
    } catch (error) {
      isConnecting = false;
      reject(error);
    }
  });
}

/**
 * Handle WebSocket messages
 * @param data Message data
 */
function handleWebSocketMessage(data: string): void {
  try {
    const message = JSON.parse(data);
    const { type, payload } = message;
    
    switch (type) {
      case 'city_status':
        handleCityStatusUpdate(payload);
        break;
        
      case 'batch_result':
        handleBatchResult(payload);
        break;
        
      case 'error':
        console.error('WebSocket error from server:', payload.message);
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
}

/**
 * Handle city status update
 * @param payload Update payload
 */
function handleCityStatusUpdate(payload: any): void {
  const { city, date, isScheduled } = payload;
  const key = `${city}:${date}`;
  
  // Update cache
  apiCache.prefetch(`city:${city}:${date}`, () => Promise.resolve(isScheduled));
  
  // Notify subscribers
  if (subscriptions.has(key)) {
    for (const callback of subscriptions.get(key)!) {
      callback(isScheduled);
    }
  }
}

/**
 * Handle batch result
 * @param payload Batch result payload
 */
function handleBatchResult(payload: any): void {
  const { requestId, results } = payload;
  
  // Update cache for each result
  for (const [key, value] of Object.entries(results)) {
    const [_, city, date] = key.split(':');
    apiCache.prefetch(`city:${city}:${date}`, () => Promise.resolve(value.isScheduled));
  }
  
  // Notify batch request callback
  if (batchRequests.has(requestId)) {
    const callback = batchRequests.get(requestId)!;
    
    // Convert results to expected format
    const formattedResults: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(results)) {
      const [_, city, date] = key.split(':');
      formattedResults[`${city}:${date}`] = value.isScheduled;
    }
    
    callback(formattedResults);
    batchRequests.delete(requestId);
  }
}

/**
 * Subscribe to city availability updates
 * @param city City name
 * @param date Date string
 * @param callback Callback function
 * @returns Unsubscribe function
 */
export async function subscribeToCityAvailability(
  city: string,
  date: string,
  callback: (isAvailable: boolean) => void
): Promise<() => void> {
  await initWebSocket();
  
  const key = `${city}:${date}`;
  
  // Add subscription
  if (!subscriptions.has(key)) {
    subscriptions.set(key, new Set());
  }
  subscriptions.get(key)!.add(callback);
  
  // Send subscription message
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      payload: { city, date }
    }));
  }
  
  // Return unsubscribe function
  return () => {
    if (subscriptions.has(key)) {
      subscriptions.get(key)!.delete(callback);
      
      // Clean up empty subscriptions
      if (subscriptions.get(key)!.size === 0) {
        subscriptions.delete(key);
        
        // Send unsubscribe message
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'unsubscribe',
            payload: { city, date }
          }));
        }
      }
    }
  };
}

/**
 * Check city availability with WebSocket
 * @param city City name
 * @param date Date string
 * @returns Promise that resolves to availability status
 */
export async function checkCityAvailability(
  city: string,
  date: string
): Promise<boolean> {
  // Try to get from cache first
  const cacheKey = `city:${city}:${date}`;
  const cachedValue = apiCache.getCache(cacheKey);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Use WebSocket for real-time data
  try {
    await initWebSocket();
    
    return new Promise((resolve) => {
      // Create one-time subscription
      const unsubscribe = subscribeToCityAvailability(city, date, (isAvailable) => {
        unsubscribe(); // Remove subscription after first update
        resolve(isAvailable);
      });
    });
  } catch (error) {
    console.error(`Error checking city availability via WebSocket for ${city} on ${date}:`, error);
    
    // Fall back to REST API
    return apiCache.getOrFetch(
      cacheKey,
      async () => {
        const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
        const url = `${baseUrl}/api/city-schedule-status?city=${encodeURIComponent(city)}&date=${date}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const result = await response.json();
        return result.success ? result.data.isScheduled : false;
      },
      {
        timeout: 800,
        fallbackValue: false
      }
    );
  }
}

/**
 * Batch check city availability with WebSocket
 * @param requests Array of city/date requests
 * @returns Promise that resolves to availability results
 */
export async function batchCheckCityAvailability(
  requests: Array<{ city: string; date: string }>
): Promise<Record<string, boolean>> {
  // Check cache first for all requests
  const results: Record<string, boolean> = {};
  const missingRequests: Array<{ city: string; date: string }> = [];
  
  for (const req of requests) {
    const { city, date } = req;
    const key = `${city}:${date}`;
    const cacheKey = `city:${city}:${date}`;
    
    const cachedValue = apiCache.getCache(cacheKey);
    if (cachedValue !== undefined) {
      results[key] = cachedValue;
    } else {
      missingRequests.push(req);
    }
  }
  
  // Return early if all results were cached
  if (missingRequests.length === 0) {
    return results;
  }
  
  // Use WebSocket for real-time data
  try {
    await initWebSocket();
    
    return new Promise((resolve) => {
      // Generate request ID
      const requestId = Date.now().toString();
      
      // Store batch callback
      batchRequests.set(requestId, (batchResults) => {
        // Merge with cached results
        resolve({ ...results, ...batchResults });
      });
      
      // Send batch check message
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'batch_check',
          payload: {
            requestId,
            requests: missingRequests
          }
        }));
      }
    });
  } catch (error) {
    console.error('Error batch checking city availability via WebSocket:', error);
    
    // Fall back to REST API
    try {
      const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
      const url = `${baseUrl}/api/batch-city-availability`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: missingRequests })
      });
      
      if (!response.ok) {
        throw new Error(`Batch API returned status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Batch API error');
      }
      
      // Process and cache results
      for (const [key, value] of Object.entries(result.data)) {
        const [_, city, date] = key.split(':');
        const resultKey = `${city}:${date}`;
        results[resultKey] = value.isScheduled;
        
        // Cache result
        apiCache.prefetch(`city:${city}:${date}`, () => Promise.resolve(value.isScheduled));
      }
      
      return results;
    } catch (error) {
      console.error('Error batch checking city availability via REST API:', error);
      
      // Provide fallback results
      for (const req of missingRequests) {
        const { city, date } = req;
        results[`${city}:${date}`] = false;
      }
      
      return results;
    }
  }
}

// Define default cache TTL
const DEFAULT_CACHE_TTL = 60 * 1000; // 1 minute

// Add cache accessor method to apiCache
if (!('getCache' in apiCache)) {
  (apiCache as any).getCache = function(key: string) {
    const cache = (this as any).cache.get(key);
    if (cache && Date.now() - cache.timestamp < DEFAULT_CACHE_TTL) {
      return cache.value;
    }
    return undefined;
  };
}

// Initialize WebSocket connection when module is loaded
initWebSocket().catch(console.error);

/**
 * Check if all cities are empty on a specific date
 * @param date Date string
 * @returns Promise that resolves to true if all cities are empty
 */
export async function checkAllCitiesEmpty(date: string): Promise<boolean> {
  // Try to get from cache first
  const cacheKey = `empty:${date}`;
  const cachedValue = apiCache.getCache(cacheKey);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Use WebSocket for real-time data
  try {
    await initWebSocket();
    
    return new Promise((resolve) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const requestId = Date.now().toString();
        
        // Store callback
        batchRequests.set(requestId, (results) => {
          resolve(results.isEmpty || false);
        });
        
        // Send check empty message
        socket.send(JSON.stringify({
          type: 'check_empty',
          payload: { requestId, date }
        }));
        
        // Set timeout for response
        setTimeout(() => {
          if (batchRequests.has(requestId)) {
            batchRequests.delete(requestId);
            resolve(false); // Fallback to false if no response
          }
        }, 1000);
      } else {
        resolve(false); // Fallback if socket not ready
      }
    });
  } catch (error) {
    console.error(`Error checking if date ${date} is empty via WebSocket:`, error);
    
    // Fall back to REST API
    return apiCache.getOrFetch(
      cacheKey,
      async () => {
        const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
        const url = `${baseUrl}/api/check-all-cities-empty?date=${date}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const result = await response.json();
        return result.success ? result.data.isEmpty : false;
      },
      {
        timeout: 800,
        fallbackValue: false
      }
    );
  }
}

export default {
  initWebSocket,
  subscribeToCityAvailability,
  checkCityAvailability,
  batchCheckCityAvailability,
  checkAllCitiesEmpty
};
