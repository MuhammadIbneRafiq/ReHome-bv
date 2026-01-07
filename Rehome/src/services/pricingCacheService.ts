/**
 * PricingCacheService - High-performance caching layer for pricing calculations
 * 
 * Optimizations:
 * 1. Direct Supabase RPC calls (no HTTP hop)
 * 2. Aggressive caching with configurable TTL (5 min default)
 * 3. Pre-loading of month schedule data
 * 4. Batched lookups for multiple city/date pairs
 * 5. LRU eviction to prevent memory bloat
 */

import { supabase } from '../lib/supabaseClient';
import { cityBaseCharges } from '../lib/constants';

// Cache configuration
const CACHE_CONFIG = {
  SCHEDULE_TTL_MS: 5 * 60 * 1000,      // 5 minutes for schedule data
  CONSTANTS_TTL_MS: 30 * 60 * 1000,    // 30 minutes for constants
  MAX_CACHE_ENTRIES: 1000,             // Max entries before LRU eviction
  PRELOAD_MONTHS_AHEAD: 2,             // Pre-load 2 months of schedule data
};

// Types
interface ScheduleCacheEntry {
  isScheduled: boolean;
  isEmpty: boolean;
  updatedAt: number;
}

interface MonthScheduleCache {
  data: Map<string, { assignedCities: string[]; isEmpty: boolean }>;
  updatedAt: number;
  monthKey: string;
}

interface BatchScheduleResult {
  city: string;
  date: string;
  is_scheduled: boolean;
  is_empty: boolean;
}

// Cache stores
const scheduleCache = new Map<string, ScheduleCacheEntry>();
const monthScheduleCache = new Map<string, MonthScheduleCache>();
let cacheAccessOrder: string[] = []; // For LRU tracking

// Cache statistics for monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  rpcCalls: 0,
  batchedLookups: 0,
};

/**
 * Get cache key for a city/date pair
 */
function getCacheKey(city: string, date: Date | string): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return `${city}:${dateStr}`;
}

/**
 * Get month key for month-level caching
 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * LRU cache eviction - removes oldest entries when cache is full
 */
function evictIfNeeded(): void {
  while (scheduleCache.size > CACHE_CONFIG.MAX_CACHE_ENTRIES) {
    const oldestKey = cacheAccessOrder.shift();
    if (oldestKey) {
      scheduleCache.delete(oldestKey);
    }
  }
}

/**
 * Update cache access order for LRU
 */
function touchCache(key: string): void {
  const index = cacheAccessOrder.indexOf(key);
  if (index > -1) {
    cacheAccessOrder.splice(index, 1);
  }
  cacheAccessOrder.push(key);
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: ScheduleCacheEntry | undefined, ttlMs: number = CACHE_CONFIG.SCHEDULE_TTL_MS): boolean {
  if (!entry) return false;
  return Date.now() - entry.updatedAt < ttlMs;
}

/**
 * Pre-load schedule data for a month range using RPC
 * This dramatically reduces per-request lookups
 */
export async function preloadMonthSchedule(year: number, month: number): Promise<void> {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // Check if already cached and valid
  const cached = monthScheduleCache.get(monthKey);
  if (cached && Date.now() - cached.updatedAt < CACHE_CONFIG.SCHEDULE_TTL_MS) {
    return;
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  cacheStats.rpcCalls++;

  const { data, error } = await supabase.rpc('get_month_schedule', {
    start_date: startDateStr,
    end_date: endDateStr
  });

  if (error) {
    console.error('[PricingCache] Error preloading month schedule:', error);
    return;
  }

  const monthData = new Map<string, { assignedCities: string[]; isEmpty: boolean }>();
  
  if (data) {
    for (const row of data) {
      monthData.set(row.schedule_date, {
        assignedCities: row.assigned_cities || [],
        isEmpty: row.is_empty
      });
      
      // Also populate the per-date cache for each city
      const cities = row.assigned_cities || [];
      const dateStr = row.schedule_date;
      
      // For each known city, cache whether it's scheduled
      for (const city of Object.keys(cityBaseCharges)) {
        const cacheKey = `${city}:${dateStr}`;
        scheduleCache.set(cacheKey, {
          isScheduled: cities.includes(city),
          isEmpty: row.is_empty,
          updatedAt: Date.now()
        });
        touchCache(cacheKey);
      }
    }
  }

  monthScheduleCache.set(monthKey, {
    data: monthData,
    updatedAt: Date.now(),
    monthKey
  });

  evictIfNeeded();
}

/**
 * Get city schedule status - uses cache with RPC fallback
 * Direct Supabase RPC, no HTTP hop
 */
export async function getCityScheduleStatusCached(
  city: string,
  date: Date
): Promise<{ isScheduled: boolean; isEmpty: boolean }> {
  if (!date || isNaN(date.getTime())) {
    return { isScheduled: false, isEmpty: true };
  }

  const cacheKey = getCacheKey(city, date);
  
  // Check cache first
  const cached = scheduleCache.get(cacheKey);
  if (isCacheValid(cached)) {
    cacheStats.hits++;
    touchCache(cacheKey);
    return { isScheduled: cached!.isScheduled, isEmpty: cached!.isEmpty };
  }

  cacheStats.misses++;

  // Try to get from month cache
  const monthKey = getMonthKey(date);
  const monthCache = monthScheduleCache.get(monthKey);
  
  if (monthCache && Date.now() - monthCache.updatedAt < CACHE_CONFIG.SCHEDULE_TTL_MS) {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = monthCache.data.get(dateStr);
    
    if (dayData) {
      const result = {
        isScheduled: dayData.assignedCities.includes(city),
        isEmpty: dayData.isEmpty
      };
      
      // Update per-date cache
      scheduleCache.set(cacheKey, { ...result, updatedAt: Date.now() });
      touchCache(cacheKey);
      evictIfNeeded();
      
      return result;
    }
  }

  // Fallback to direct RPC call
  cacheStats.rpcCalls++;
  
  const dateStr = date.toISOString().split('T')[0];
  const { data, error } = await supabase.rpc('get_city_schedule_status', {
    check_city: city,
    check_date: dateStr
  });

  if (error) {
    console.error('[PricingCache] RPC error:', error);
    return { isScheduled: false, isEmpty: true };
  }

  const result = {
    isScheduled: data?.isScheduled ?? false,
    isEmpty: data?.isEmpty ?? true
  };

  // Cache the result
  scheduleCache.set(cacheKey, { ...result, updatedAt: Date.now() });
  touchCache(cacheKey);
  evictIfNeeded();

  return result;
}

/**
 * Batch lookup for multiple city/date pairs
 * Uses single RPC call for all lookups
 */
export async function getBatchScheduleStatus(
  lookups: Array<{ city: string; date: Date }>
): Promise<Map<string, { isScheduled: boolean; isEmpty: boolean }>> {
  const results = new Map<string, { isScheduled: boolean; isEmpty: boolean }>();
  const uncachedLookups: Array<{ city: string; date: string }> = [];

  // Check cache for each lookup
  for (const { city, date } of lookups) {
    const cacheKey = getCacheKey(city, date);
    const cached = scheduleCache.get(cacheKey);
    
    if (isCacheValid(cached)) {
      cacheStats.hits++;
      touchCache(cacheKey);
      results.set(cacheKey, { isScheduled: cached!.isScheduled, isEmpty: cached!.isEmpty });
    } else {
      cacheStats.misses++;
      uncachedLookups.push({ city, date: date.toISOString().split('T')[0] });
    }
  }

  // Batch fetch uncached lookups
  if (uncachedLookups.length > 0) {
    cacheStats.rpcCalls++;
    cacheStats.batchedLookups += uncachedLookups.length;

    const cities = uncachedLookups.map(l => l.city);
    const dates = uncachedLookups.map(l => l.date);

    const { data, error } = await supabase.rpc('get_batch_city_schedules', {
      cities,
      dates
    });

    if (!error && data) {
      for (const row of data as BatchScheduleResult[]) {
        const cacheKey = `${row.city}:${row.date}`;
        const result = {
          isScheduled: row.is_scheduled,
          isEmpty: row.is_empty
        };
        
        results.set(cacheKey, result);
        scheduleCache.set(cacheKey, { ...result, updatedAt: Date.now() });
        touchCache(cacheKey);
      }
    } else if (error) {
      console.error('[PricingCache] Batch RPC error:', error);
      // Set defaults for failed lookups
      for (const lookup of uncachedLookups) {
        const cacheKey = `${lookup.city}:${lookup.date}`;
        if (!results.has(cacheKey)) {
          results.set(cacheKey, { isScheduled: false, isEmpty: true });
        }
      }
    }

    evictIfNeeded();
  }

  return results;
}

/**
 * Check if all cities are empty on a date
 */
export async function checkAllCitiesEmptyCached(date: Date): Promise<boolean> {
  if (!date || isNaN(date.getTime())) {
    return false;
  }

  const cacheKey = `all:${date.toISOString().split('T')[0]}`;
  const cached = scheduleCache.get(cacheKey);
  
  if (isCacheValid(cached)) {
    cacheStats.hits++;
    touchCache(cacheKey);
    return cached!.isEmpty;
  }

  cacheStats.misses++;

  // Try month cache first
  const monthKey = getMonthKey(date);
  const monthCache = monthScheduleCache.get(monthKey);
  
  if (monthCache && Date.now() - monthCache.updatedAt < CACHE_CONFIG.SCHEDULE_TTL_MS) {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = monthCache.data.get(dateStr);
    
    if (dayData) {
      scheduleCache.set(cacheKey, { 
        isScheduled: false, 
        isEmpty: dayData.isEmpty, 
        updatedAt: Date.now() 
      });
      touchCache(cacheKey);
      return dayData.isEmpty;
    }
  }

  // Fallback to RPC
  cacheStats.rpcCalls++;
  
  const dateStr = date.toISOString().split('T')[0];
  const { data, error } = await supabase.rpc('get_city_schedule_status', {
    check_city: Object.keys(cityBaseCharges)[0] || 'Rotterdam', // Any city works for isEmpty
    check_date: dateStr
  });

  if (error) {
    console.error('[PricingCache] RPC error checking empty:', error);
    return false;
  }

  const isEmpty = data?.isEmpty ?? false;
  
  scheduleCache.set(cacheKey, { isScheduled: false, isEmpty, updatedAt: Date.now() });
  touchCache(cacheKey);
  evictIfNeeded();

  return isEmpty;
}

/**
 * Pre-warm cache for upcoming months
 * Call this on app initialization
 */
export async function prewarmCache(): Promise<void> {
  const now = new Date();
  const promises: Promise<void>[] = [];

  for (let i = 0; i <= CACHE_CONFIG.PRELOAD_MONTHS_AHEAD; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    promises.push(preloadMonthSchedule(targetDate.getFullYear(), targetDate.getMonth()));
  }

  await Promise.all(promises);
  console.log('[PricingCache] Cache pre-warmed for', CACHE_CONFIG.PRELOAD_MONTHS_AHEAD + 1, 'months');
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): typeof cacheStats & { cacheSize: number; hitRate: number } {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    ...cacheStats,
    cacheSize: scheduleCache.size,
    hitRate: total > 0 ? cacheStats.hits / total : 0
  };
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearCache(): void {
  scheduleCache.clear();
  monthScheduleCache.clear();
  cacheAccessOrder = [];
  cacheStats = { hits: 0, misses: 0, rpcCalls: 0, batchedLookups: 0 };
}

/**
 * Invalidate cache for a specific date (call when schedule changes)
 */
export function invalidateDate(date: Date): void {
  const dateStr = date.toISOString().split('T')[0];
  const monthKey = getMonthKey(date);
  
  // Remove all entries for this date
  for (const key of scheduleCache.keys()) {
    if (key.endsWith(`:${dateStr}`)) {
      scheduleCache.delete(key);
    }
  }
  
  // Invalidate month cache
  monthScheduleCache.delete(monthKey);
}
