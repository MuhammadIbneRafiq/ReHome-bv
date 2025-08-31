import { supabase } from "./supabaseClient";

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
export const defaultPricingConfig: PricingConfig = {
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
export type ItemCategory = { name: string; subcategories: string[]; is_active: boolean };
export type CityBaseCharge = { normal: number; cityDay: number; dayOfWeek: number };

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
    // First try to load data directly from Supabase tables
    try {
      // Load pricing config
      const { data: configData, error: configError } = await supabase
        .from('pricing_config')
        .select('*')
        .limit(1)
        .single();
        
      if (configError) {
        console.warn('[Constants] ⚠️ Pricing config error:', configError);
        throw configError;
      }
      if (configData) {
        pricingConfig = configData as PricingConfig;
        console.log('[Constants] ✅ Pricing config loaded from Supabase');
      } else {
        console.log('[Constants] ⚠️ No pricing config data found');
      }
      
      // Load furniture items
      const { data: itemsData, error: itemsError } = await supabase
        .from('furniture_items')
        .select('*');
        
      if (itemsError) {
        console.warn('[Constants] ⚠️ Furniture items error:', itemsError);
        throw itemsError;
      }
      if (itemsData) {
        furnitureItems = itemsData as FurnitureItem[];
        console.log(`[Constants] ✅ Furniture items loaded from Supabase: ${itemsData.length} items`);
      } else {
        console.log('[Constants] ⚠️ No furniture items data found');
      }
      
      // Load item categories from furniture_item table
      console.log('[Constants] 📋 Loading item categories from furniture_item...');
      const { data: categoriesData, error: categoriesItemError } = await supabase
        .from('furniture_items')
        .select('*');
        
      if (categoriesItemError) {
        console.warn('[Constants] ⚠️ Furniture item error:', categoriesItemError);
        throw categoriesItemError;
      }
      if (categoriesData) {
        // Transform the furniture_item data to match our ItemCategory type
        itemCategories = categoriesData.map(cat => ({
          name: cat.name,
          subcategories: [cat.name], // The category name itself is the subcategory to match
          is_active: cat.is_active !== false // default to true if not specified
        })) as ItemCategory[];
        console.log(`[Constants] ✅ Furniture item loaded from Supabase: ${categoriesData.length} categories`);
        console.log('[Constants] 🔍 Furniture item structure:', categoriesData);
        console.log('[Constants] 🔍 Transformed item:', itemCategories);
      } else {
        console.log('[Constants] ⚠️ No furniture item data found');
        itemCategories = [];
      }

      // Load city base charges
      const { data: cityChargesData, error: cityChargesError } = await supabase
        .from('city_base_charges')
        .select('*');
        
      if (cityChargesError) throw cityChargesError;
      if (cityChargesData) {
        // Transform from array to record
        cityBaseCharges = cityChargesData.reduce((acc, city) => {
          acc[city.city_name] = {
            normal: city.normal,
            cityDay: city.city_day,
            dayOfWeek: city.day_of_week
          };
          return acc;
        }, {} as Record<string, CityBaseCharge>);
        console.log('[Constants] ✅ City base charges loaded from Supabase');
        console.log('[Constants] 📊 City base charges sample:', Object.keys(cityBaseCharges).slice(0, 3).map(city => ({
          city,
          data: cityBaseCharges[city]
        })));
      }
      
      constantsLoaded = true;
      console.log(`[Constants] 🎉 Constants initialization complete!`);
      console.log(`[Constants] 📊 Summary: ${furnitureItems.length} items, ${itemCategories.length} categories, ${Object.keys(cityBaseCharges).length} cities`);
      
    } catch (supabaseError) {
      console.warn('[Constants] ⚠️ Error loading from Supabase:', supabaseError);
    }
    
    // Set up Realtime subscriptions after initial load
    import('../services/realtimeService').then(({ initRealtimeService }) => {
      initRealtimeService();
      console.log('[Constants] ✅ Realtime subscriptions initialized');
    });
    
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

