import { API_ENDPOINTS } from "./api/config";

// Pricing configuration type
export type PricingConfig = {
  baseMultipliers: {
    houseMovingItemMultiplier: number;
    itemTransportMultiplier: number;
    addonMultiplier: number;
  };
  distancePricing: {
    smallDistance: { threshold: number; rate: number };
    mediumDistance: { threshold: number; rate: number };
    longDistance: { rate: number };
  };
  carryingMultipliers: {
    lowValue: { threshold: number; multiplier: number };
    highValue: { multiplier: number };
  };
  assemblyMultipliers: {
    lowValue: { threshold: number; multiplier: number };
    highValue: { multiplier: number };
  };
  extraHelperPricing: {
    smallMove: { threshold: number; price: number };
    bigMove: { price: number };
  };
  cityRange: {
    baseRadius: number;
    extraKmRate: number;
  };
  studentDiscount: number;
  weekendMultiplier: number;
  cityDayMultiplier: number;
  floorChargePerLevel: number;
  elevatorDiscount: number;
  assemblyChargePerItem: number;
  extraHelperChargePerItem: number;
  earlyBookingDiscount: number;
  minimumCharge: number;
};

// Default pricing config (fallback)
const defaultPricingConfig: PricingConfig = {
  baseMultipliers: {
    houseMovingItemMultiplier: 2.0,
    itemTransportMultiplier: 1.0,
    addonMultiplier: 3.0
  },
  distancePricing: {
    smallDistance: { threshold: 10, rate: 0 },
    mediumDistance: { threshold: 50, rate: 0.7 },
    longDistance: { rate: 0.5 }
  },
  carryingMultipliers: {
    lowValue: { threshold: 6, multiplier: 0.015 },
    highValue: { multiplier: 0.040 }
  },
  assemblyMultipliers: {
    lowValue: { threshold: 6, multiplier: 1.80 },
    highValue: { multiplier: 4.2 }
  },
  extraHelperPricing: {
    smallMove: { threshold: 30, price: 30 },
    bigMove: { price: 60 }
  },
  cityRange: {
    baseRadius: 8,
    extraKmRate: 3
  },
  studentDiscount: 0.1,
  weekendMultiplier: 1.2,
  cityDayMultiplier: 1.3,
  floorChargePerLevel: 25.0,
  elevatorDiscount: 0.8,
  assemblyChargePerItem: 30.0,
  extraHelperChargePerItem: 20.0,
  earlyBookingDiscount: 0.1,
  minimumCharge: 75.0
};

// Dynamic pricing config that will be populated from API
export let pricingConfig: PricingConfig = defaultPricingConfig;

// Types for dynamic data
export type FurnitureItem = { id: string; name: string; category: string; points: number };
export type ItemCategory = { name: string; items: { id: string; name: string }[] };
export type CityBaseCharge = { normal: number; cityDay: number; dayOfWeek: number };

// Fetch all constants from backend API endpoint in one request
async function fetchAllConstants(): Promise<{
  furnitureItems: FurnitureItem[];
  itemCategories: ItemCategory[];
  cityBaseCharges: Record<string, CityBaseCharge>;
  pricingConfig: PricingConfig;
}> {
  try {
    // Use the backend endpoint from config
    const baseUrl = API_ENDPOINTS.AUTH.LOGIN.split('/api/auth/login')[0];
    const response = await fetch(`${baseUrl}/api/constants`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch constants: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Backend error: ${result.error}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('[Constants] Error fetching from backend:', error);
    throw error;
  }
}


// --- DYNAMIC CONSTANTS INIT ---
// These will be populated at runtime by the internal call to initDynamicConstants()
export let furnitureItems: FurnitureItem[] = [];
export let itemCategories: ItemCategory[] = [];
export let cityBaseCharges: Record<string, CityBaseCharge> = {};

// Loading state to track when constants are ready
export let constantsLoaded = false;

/**
 * This function is called ONCE at module load to populate the dynamic constants from Supabase.
 * Export this function so it can be awaited in the app entry point.
 */
export async function initDynamicConstants() {
  
  try {
    const constants = await fetchAllConstants();
    
    furnitureItems = constants.furnitureItems;
    
    itemCategories = constants.itemCategories;
    
    cityBaseCharges = constants.cityBaseCharges;
    
    // Update pricing config with data from API
    if (constants.pricingConfig) {
      pricingConfig = constants.pricingConfig;
      console.log('[Constants] ✅ Pricing config loaded from API');
    } else {
      console.log('[Constants] ⚠️ Using default pricing config (no API data)');
    }
    
    constantsLoaded = true;
  } catch (error) {
    console.error('[Constants] ❌ Error loading constants:', error);
    constantsLoaded = false;
  }
}

// Immediately invoke the initialization (fire and forget)
// Note: If you need to ensure these are populated before use, await this in your app entry point.
initDynamicConstants();

// Helper function to get item points (sync, using populated furnitureItems)
export const getItemPoints = (itemId: string): number => {
  const item = furnitureItems.find(item => item.id === itemId);
  return item ? item.points : 0;
};

