/**
 * MonthPricingService - Centralized pricing cache for calendar display
 * 
 * This service fetches and caches base pricing for each day of a month,
 * ensuring calendar prices match the backend pricing API.
 * 
 * Features:
 * - 5-minute TTL cache per month/city combo
 * - Single API call per month instead of per-day
 * - Consistent pricing between calendar and estimate sidebar
 */

import API_ENDPOINTS from '../lib/api/config';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Types
export interface DayPricing {
  date: string;
  basePrice: number;
  isCityDay: boolean;
  isEmpty: boolean;
  priceType: string;
  assignedCities: string[];
  isBlocked: boolean;
  colorCode: 'green' | 'orange' | 'red' | 'grey';
}

interface MonthPricingCache {
  data: Map<string, DayPricing>;
  updatedAt: number;
  cacheKey: string;
}

// In-memory cache
const monthPricingCache = new Map<string, MonthPricingCache>();

/**
 * Generate cache key for month/cities combination
 */
function getCacheKey(year: number, month: number, pickupCity: string, dropoffCity: string): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${pickupCity}-${dropoffCity}`;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get base URL from API endpoints
 */
function getBaseUrl(): string {
  return API_ENDPOINTS.AUTH.LOGIN.replace('/api/auth/login', '');
}

/**
 * Fetch month pricing from backend API
 */
async function fetchMonthPricingFromBackend(
  year: number,
  month: number,
  pickupCity: string,
  dropoffCity: string
): Promise<Map<string, DayPricing>> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const response = await fetch(`${getBaseUrl()}/api/transport/month-pricing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      year,
      month: month + 1, // Backend expects 1-indexed month
      pickupCity,
      dropoffCity,
      startDate: formatISO(startDate),
      endDate: formatISO(endDate)
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch month pricing');
  }

  const data = await response.json();
  const pricingMap = new Map<string, DayPricing>();

  if (data.data?.days) {
    for (const day of data.data.days) {
      pricingMap.set(day.date, {
        date: day.date,
        basePrice: day.basePrice,
        isCityDay: day.isCityDay,
        isEmpty: day.isEmpty,
        priceType: day.priceType,
        assignedCities: day.assignedCities || [],
        isBlocked: day.isBlocked || false,
        colorCode: day.colorCode || (day.isBlocked ? 'grey' : day.isCityDay ? 'green' : day.isEmpty ? 'orange' : 'red')
      });
    }
  }

  return pricingMap;
}

/**
 * Get cached month pricing, fetching from backend if needed
 */
export async function getMonthPricing(
  year: number,
  month: number,
  pickupCity: string,
  dropoffCity: string
): Promise<Map<string, DayPricing>> {
  const cacheKey = getCacheKey(year, month, pickupCity, dropoffCity);
  
  // Check cache
  const cached = monthPricingCache.get(cacheKey);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    console.log('[MonthPricing] Cache hit for', cacheKey);
    return cached.data;
  }

  console.log('[MonthPricing] Cache miss, fetching from backend for', cacheKey);
  
  try {
    const pricingData = await fetchMonthPricingFromBackend(year, month, pickupCity, dropoffCity);
    
    // Store in cache
    monthPricingCache.set(cacheKey, {
      data: pricingData,
      updatedAt: Date.now(),
      cacheKey
    });
    
    return pricingData;
  } catch (error) {
    console.error('[MonthPricing] Error fetching month pricing:', error);
    // Return empty map on error, caller can handle fallback
    return new Map();
  }
}

/**
 * Get pricing for a specific day
 */
export async function getDayPricing(
  date: Date,
  pickupCity: string,
  dropoffCity: string
): Promise<DayPricing | null> {
  const monthPricing = await getMonthPricing(
    date.getFullYear(),
    date.getMonth(),
    pickupCity,
    dropoffCity
  );
  
  const dateStr = formatISO(date);
  return monthPricing.get(dateStr) || null;
}

/**
 * Pre-warm cache for upcoming months
 */
export async function prewarmMonthPricing(
  pickupCity: string,
  dropoffCity: string,
  monthsAhead: number = 2
): Promise<void> {
  const now = new Date();
  const promises: Promise<Map<string, DayPricing>>[] = [];

  for (let i = 0; i <= monthsAhead; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    promises.push(getMonthPricing(targetDate.getFullYear(), targetDate.getMonth(), pickupCity, dropoffCity));
  }

  await Promise.all(promises);
  console.log('[MonthPricing] Cache pre-warmed for', monthsAhead + 1, 'months');
}

/**
 * Clear all cached pricing data
 */
export function clearMonthPricingCache(): void {
  monthPricingCache.clear();
  console.log('[MonthPricing] Cache cleared');
}

/**
 * Invalidate cache for a specific month
 */
export function invalidateMonth(year: number, month: number): void {
  for (const [key] of monthPricingCache) {
    if (key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      monthPricingCache.delete(key);
    }
  }
  console.log('[MonthPricing] Invalidated cache for', year, month + 1);
}

export default {
  getMonthPricing,
  getDayPricing,
  prewarmMonthPricing,
  clearMonthPricingCache,
  invalidateMonth
};
