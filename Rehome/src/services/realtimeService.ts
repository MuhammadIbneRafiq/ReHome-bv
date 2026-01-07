import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { 
  pricingConfig, 
  furnitureItems, 
  itemCategories, 
  cityBaseCharges,
  PricingConfig,
  FurnitureItem,
  ItemCategory,
  // CityBaseCharge
} from '../lib/constants';

// Types for subscription handlers
type ConstantsSubscriptionHandler = () => void;
type CityScheduleHandler = (city: string, date: string, status: { isScheduled: boolean; isEmpty: boolean }) => void;

// Subscription trackers
let constantsChannel: RealtimeChannel | null = null;
let cityScheduleChannel: RealtimeChannel | null = null;
let isConstantsSubscribed = false;
let isCityScheduleSubscribed = false;

// Subscriber lists
const constantsSubscribers: ConstantsSubscriptionHandler[] = [];
const cityScheduleSubscribers: CityScheduleHandler[] = [];

// Cache for city schedule status with version control
interface CityScheduleCache {
  [key: string]: {
    isScheduled: boolean;
    isEmpty: boolean;
    version: number;
    updatedAt: number;
  };
}

const cityScheduleCache: CityScheduleCache = {};

/**
 * Subscribe to constants changes
 * This will update the local constants when they change in the database
 */
export function subscribeToConstants(onUpdate?: ConstantsSubscriptionHandler): () => void {
  if (!isConstantsSubscribed) {
    constantsChannel = supabase
      .channel('constants_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pricing_config' 
        }, 
        (payload) => {
          console.log('[RealtimeService] Pricing config updated:', payload);
          
          // Update local pricingConfig
          if (payload.new) {
            const updatedRow = payload.new as any;
            const updatedConfig = updatedRow?.config;
            if (updatedConfig) {
              Object.assign(pricingConfig, updatedConfig as PricingConfig);
            }
            
            // Notify all subscribers
            constantsSubscribers.forEach(handler => handler());
          }
        })
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'furniture_items'
        },
        (payload) => {
          console.log('[RealtimeService] Furniture items updated:', payload);
          
          // Handle item update
          if (payload.eventType === 'INSERT' && payload.new) {
            furnitureItems.push(payload.new as FurnitureItem);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const index = furnitureItems.findIndex(item => item.id === (payload.new as FurnitureItem).id);
            if (index >= 0) {
              furnitureItems[index] = payload.new as FurnitureItem;
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const index = furnitureItems.findIndex(item => item.id === (payload.old as FurnitureItem).id);
            if (index >= 0) {
              furnitureItems.splice(index, 1);
            }
          }
          
          // Notify all subscribers
          constantsSubscribers.forEach(handler => handler());
        })
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_categories'
        },
        (payload) => {
          console.log('[RealtimeService] Item categories updated:', payload);
          
          // Update furniture categories (simplified - in a real implementation you might need more complex merging)
          if (payload.eventType === 'INSERT' && payload.new) {
            itemCategories.push(payload.new as ItemCategory);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const index = itemCategories.findIndex(cat => cat.name === (payload.new as ItemCategory).name);
            if (index >= 0) {
              itemCategories[index] = payload.new as ItemCategory;
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const index = itemCategories.findIndex(cat => cat.name === (payload.old as ItemCategory).name);
            if (index >= 0) {
              itemCategories.splice(index, 1);
            }
          }
          
          // Notify all subscribers
          constantsSubscribers.forEach(handler => handler());
        })
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'city_base_charges'
        },
        (payload) => {
          console.log('[RealtimeService] City base charges updated:', payload);
          
          // Update city base charges
          if (payload.new) {
            const cityData = payload.new as any;
            if (cityData.city && cityData) {
              cityBaseCharges[cityData.city] = {
                normal: cityData.normal_rate,
                cityDay: cityData.city_day_rate,
                dayOfWeek: cityData.day_of_week
              };
            }
          }
          
          // Notify all subscribers
          constantsSubscribers.forEach(handler => handler());
        })
      .subscribe();
      
    isConstantsSubscribed = true;
    console.log('[RealtimeService] Subscribed to constants changes');
  }
  
  // Add the callback to subscribers if provided
  if (onUpdate) {
    constantsSubscribers.push(onUpdate);
  }
  
  // Return unsubscribe function
  return () => {
    if (onUpdate) {
      const index = constantsSubscribers.indexOf(onUpdate);
      if (index >= 0) {
        constantsSubscribers.splice(index, 1);
      }
    }
  };
}

/**
 * Subscribe to city schedule changes
 * This will update the local cache when city schedules change
 */
export function subscribeToCitySchedules(onUpdate?: CityScheduleHandler): () => void {
  if (!isCityScheduleSubscribed) {
    cityScheduleChannel = supabase
      .channel('city_schedules_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'city_schedules'
        },
        (payload) => {
          console.log('[RealtimeService] City schedule updated:', payload);
          
          if (payload.new) {
            const scheduleData = payload.new as any;
            if (scheduleData.city && scheduleData.date) {
              const cacheKey = `${scheduleData.city}:${scheduleData.date}`;
              const currentVersion = cityScheduleCache[cacheKey]?.version || 0;
              
              // Only update if new version is higher (optimistic concurrency control)
              if (!cityScheduleCache[cacheKey] || scheduleData.version > currentVersion) {
                const newStatus = {
                  isScheduled: scheduleData.is_scheduled,
                  isEmpty: scheduleData.is_empty,
                  version: scheduleData.version,
                  updatedAt: Date.now()
                };
                
                cityScheduleCache[cacheKey] = newStatus;
                
                // Notify subscribers
                cityScheduleSubscribers.forEach(handler => 
                  handler(scheduleData.city, scheduleData.date, {
                    isScheduled: newStatus.isScheduled,
                    isEmpty: newStatus.isEmpty
                  })
                );
              }
            }
          }
        })
      .subscribe();
    
    isCityScheduleSubscribed = true;
    console.log('[RealtimeService] Subscribed to city schedule changes');
  }
  
  // Add the callback to subscribers if provided
  if (onUpdate) {
    cityScheduleSubscribers.push(onUpdate);
  }
  
  // Return unsubscribe function
  return () => {
    if (onUpdate) {
      const index = cityScheduleSubscribers.indexOf(onUpdate);
      if (index >= 0) {
        cityScheduleSubscribers.splice(index, 1);
      }
    }
  };
}

/**
 * Get city schedule status from cache or fetch it
 */
export async function getCityScheduleStatus(
  city: string,
  date: Date,
  baseUrl: string
): Promise<{ isScheduled: boolean; isEmpty: boolean }> {
  // Validate date
  if (!date || isNaN(date.getTime())) {
    console.warn('[getCityScheduleStatus] Invalid date provided:', date);
    return { isScheduled: false, isEmpty: true };
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const cacheKey = `${city}:${dateStr}`;
  
  // Check cache first
  if (cityScheduleCache[cacheKey]) {
    const cachedData = cityScheduleCache[cacheKey];
    // Use cache if it's fresh (less than 60s old)
    if (Date.now() - cachedData.updatedAt < 60_000) {
      return { 
        isScheduled: cachedData.isScheduled,
        isEmpty: cachedData.isEmpty
      };
    }
  }
  
  try {
    // Fetch from API if not in cache or cache is stale
    const url = `${baseUrl}/api/city-schedule-status?city=${encodeURIComponent(city)}&date=${dateStr}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Backend error');
    }
    
    const status = { 
      isScheduled: result.data.isScheduled,
      isEmpty: result.data.isEmpty,
      version: result.data.version || (cityScheduleCache[cacheKey]?.version || 0) + 1,
      updatedAt: Date.now()
    };
    
    // Update cache
    cityScheduleCache[cacheKey] = status;
    
    return { 
      isScheduled: status.isScheduled,
      isEmpty: status.isEmpty
    };
  } catch (error) {
    console.error('[getCityScheduleStatus] Error:', error);
    
    // If we have a cache entry, use it even if stale
    if (cityScheduleCache[cacheKey]) {
      return {
        isScheduled: cityScheduleCache[cacheKey].isScheduled,
        isEmpty: cityScheduleCache[cacheKey].isEmpty
      };
    }
    
    // Default fallback
    return { isScheduled: false, isEmpty: true };
  }
}

/**
 * Check if all cities are empty on a specific date
 */
export async function checkAllCitiesEmpty(date: Date, baseUrl: string): Promise<boolean> {
  try {
    if (!date || isNaN(date.getTime())) {
      console.warn('[checkAllCitiesEmpty] Invalid date provided:', date);
      return false;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `all:${dateStr}`;
    
    // Check cache first
    if (cityScheduleCache[cacheKey]) {
      const cachedData = cityScheduleCache[cacheKey];
      // Use cache if it's fresh (less than 60s old)
      if (Date.now() - cachedData.updatedAt < 60_000) {
        return cachedData.isEmpty;
      }
    }
    
    const url = `${baseUrl}/api/check-all-cities-empty?date=${dateStr}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to check all cities empty: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Backend error');
    }
    
    // Update cache
    cityScheduleCache[cacheKey] = {
      isScheduled: false, // Not relevant for this endpoint
      isEmpty: result.data.isEmpty,
      version: result.data.version || (cityScheduleCache[cacheKey]?.version || 0) + 1,
      updatedAt: Date.now()
    };
    
    return result.data.isEmpty;
  } catch (error) {
    console.error('[checkAllCitiesEmpty] Error:', error);
    
    // If we have a cache entry, use it even if stale
    if (cityScheduleCache[`all:${date.toISOString().split('T')[0]}`]) {
      return cityScheduleCache[`all:${date.toISOString().split('T')[0]}`].isEmpty;
    }
    
    // Default fallback
    return false;
  }
}

/**
 * Initialize all subscriptions
 */
export function initRealtimeService(): void {
  subscribeToConstants();
  subscribeToCitySchedules();
}

// Cleanup function to unsubscribe all channels
export function cleanupRealtimeService(): void {
  if (constantsChannel) {
    constantsChannel.unsubscribe();
    constantsChannel = null;
    isConstantsSubscribed = false;
  }
  
  if (cityScheduleChannel) {
    cityScheduleChannel.unsubscribe();
    cityScheduleChannel = null;
    isCityScheduleSubscribed = false;
  }
  
  // Clear subscribers
  constantsSubscribers.length = 0;
  cityScheduleSubscribers.length = 0;
}
