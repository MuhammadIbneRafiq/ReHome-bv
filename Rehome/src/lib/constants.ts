import pricingConfigData from "./pricingConfig.json";
import { API_ENDPOINTS } from "./api/config";
// // {
// const pricingConfigData = {
//   "distancePricing": {
//     "smallDistance": { "threshold": 10, "rate": 0 },
//     "mediumDistance": { "threshold": 50, "rate": 0.7 },
//     "longDistance": { "rate": 0.5 }
//   },
//   "carryingMultipliers": {
//     "lowValue": { "threshold": 6, "multiplier": 0.015 },
//     "highValue": { "multiplier": 0.040 }
//   },
//   "assemblyMultipliers": {
//     "lowValue": { "threshold": 6, "multiplier": 1.80 },
//     "highValue": { "multiplier": 4.2 }
//   },
//   "extraHelperPricing": {
//     "smallMove": { "threshold": 30, "price": 30 },
//     "bigMove": { "price": 60 }
//   }
// }

export const pricingConfig = {
  // Base multipliers
  houseMovingItemMultiplier: 2, // €2.3 per point for house moving
  itemTransportMultiplier: 1, // €1.5 per point for item transport
  addonMultiplier: 3, // €3 per point for add-ons
  
  // Distance pricing
  distancePricing: pricingConfigData.distancePricing,
  
  // Carrying multipliers (per floor)
  carryingMultipliers: pricingConfigData.carryingMultipliers,
  
  // Assembly multipliers
  assemblyMultipliers: pricingConfigData.assemblyMultipliers,
  
  // Extra helper pricing
  extraHelperPricing: pricingConfigData.extraHelperPricing,
  
  // City range and extra distance pricing
  cityRange: {
    baseRadius: 8, // 8km from city center
    extraKmRate: 3 // €3 per extra km
  },
  // Student discount
  studentDiscount: 0.1 // 10% discount
};

// Types for dynamic data
export type FurnitureItem = { id: string; name: string; category: string; points: number };
export type ItemCategory = { name: string; items: { id: string; name: string }[] };
export type CityBaseCharge = { normal: number; cityDay: number; dayOfWeek: number };

// Fetch all constants from backend API endpoint in one request
async function fetchAllConstants(): Promise<{
  furnitureItems: FurnitureItem[];
  itemCategories: ItemCategory[];
  cityBaseCharges: Record<string, CityBaseCharge>;
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

