/**
 * API Cache utility with request coalescing and timeout handling
 */

// Cache expiry time (5 minutes)
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
// Default timeout (600ms as recommended)
const DEFAULT_TIMEOUT = 600;

type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

type InFlightRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

/**
 * Request coalescer and cache manager
 */
class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private inFlightRequests: Map<string, InFlightRequest<any>> = new Map();
  
  /**
   * Get or fetch data with coalescing and caching
   * @param key Cache key
   * @param fetchFn Function that fetches the data
   * @param options Cache options
   * @returns Promise of the result
   */
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: { 
      ttl?: number; 
      timeout?: number;
      fallbackValue?: T;
    } = {}
  ): Promise<T> {
    const { ttl = DEFAULT_CACHE_TTL, timeout = DEFAULT_TIMEOUT, fallbackValue } = options;
    
    // 1. Check cache first
    const cachedEntry = this.cache.get(key);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < ttl) {
      return cachedEntry.value;
    }
    
    // 2. Check for in-flight requests to coalesce
    if (this.inFlightRequests.has(key)) {
      try {
        // Reuse existing request instead of creating a new one
        return await this.inFlightRequests.get(key)!.promise;
      } catch (error) {
        console.error(`Error from coalesced request for key ${key}:`, error);
        // If coalesced request fails, try again with a new request
        this.inFlightRequests.delete(key);
      }
    }
    
    // 3. No cached value and no in-flight request, make a new request
    const requestPromise = this.createTimedRequest(fetchFn, timeout, fallbackValue);
    this.inFlightRequests.set(key, {
      promise: requestPromise,
      timestamp: Date.now()
    });
    
    try {
      const result = await requestPromise;
      
      // Store in cache and clean up in-flight request
      this.cache.set(key, {
        value: result,
        timestamp: Date.now()
      });
      this.inFlightRequests.delete(key);
      
      return result;
    } catch (error) {
      // Clean up in-flight request on error
      this.inFlightRequests.delete(key);
      throw error;
    }
  }
  
  /**
   * Create a request with timeout
   */
  private createTimedRequest<T>(
    fetchFn: () => Promise<T>, 
    timeout: number,
    fallbackValue?: T
  ): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      // Create a timeout promise
      const timeoutPromise = new Promise<T>((_, reject) => {
        setTimeout(() => {
          if (fallbackValue !== undefined) {
            resolve(fallbackValue); // Resolve with fallback instead of timeout if provided
          } else {
            reject(new Error(`Request timed out after ${timeout}ms`));
          }
        }, timeout);
      });
      
      try {
        // Race between the actual request and the timeout
        const result = await Promise.race([fetchFn(), timeoutPromise]);
        resolve(result);
      } catch (error) {
        if (fallbackValue !== undefined) {
          console.warn(`Request failed, using fallback value. Error: ${error}`);
          resolve(fallbackValue);
        } else {
          reject(error);
        }
      }
    });
  }
  
  /**
   * Invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Prefetch and cache a value
   */
  async prefetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
    try {
      const value = await fetchFn();
      this.cache.set(key, {
        value,
        timestamp: Date.now() + ttl // Use ttl parameter for expiration
      });
    } catch (error) {
      console.error(`Failed to prefetch key ${key}:`, error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      inFlightRequests: this.inFlightRequests.size
    };
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();

export default apiCache;
