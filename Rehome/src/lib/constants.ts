import { supabase } from "./supabaseClient";

// {
const pricingConfigData = {
  "distancePricing": {
    "smallDistance": { "threshold": 10, "rate": 0 },
    "mediumDistance": { "threshold": 50, "rate": 0.7 },
    "longDistance": { "rate": 0.5 }
  },
  "carryingMultipliers": {
    "lowValue": { "threshold": 6, "multiplier": 0.015 },
    "highValue": { "multiplier": 0.040 }
  },
  "assemblyMultipliers": {
    "lowValue": { "threshold": 6, "multiplier": 1.80 },
    "highValue": { "multiplier": 4.2 }
  },
  "extraHelperPricing": {
    "smallMove": { "threshold": 30, "price": 30 },
    "bigMove": { "price": 60 }
  }
}

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

// Define furniture items with proper categorization and points
// Updated to match the exact specification provided - Total item value = Total points * €2
// export const furnitureItems = [
//   // Sofa's and Chairs
//   { id: 'sofa-2p', name: '2-Seater Sofa', category: 'Sofa\'s and Chairs', points: 10 },
//   { id: 'sofa-3p', name: '3-Seater Sofa', category: 'Sofa\'s and Chairs', points: 12 },
//   { id: 'armchair', name: 'Armchair', category: 'Sofa\'s and Chairs', points: 4 },
//   { id: 'office-chair', name: 'Office Chair', category: 'Sofa\'s and Chairs', points: 3 },
//   { id: 'chair', name: 'Chair', category: 'Sofa\'s and Chairs', points: 2 },
  
//   // Bed
//   { id: 'bed-1p', name: '1-Person Bed', category: 'Bed', points: 4 },
//   { id: 'bed-2p', name: '2-Person Bed', category: 'Bed', points: 8 },
//   { id: 'mattress-1p', name: '1-person Matress', category: 'Bed', points: 3 },
//   { id: 'mattress-2p', name: '2-Person Matress', category: 'Bed', points: 6 },
//   { id: 'bedside-table', name: 'Bedside Table', category: 'Bed', points: 2 },
  
//   // Storage
//   { id: 'closet-2d', name: '2-Doors Closet', category: 'Storage', points: 8 },
//   { id: 'closet-3d', name: '3-Doors Closet', category: 'Storage', points: 10 },
//   { id: 'cloth-rack', name: 'Cloth Rack', category: 'Storage', points: 3 },
//   { id: 'bookcase', name: 'Bookcase', category: 'Storage', points: 6 },
//   { id: 'dressoir', name: 'Drawer/ Dressoir', category: 'Storage', points: 5 },
//   { id: 'tv-table', name: 'TV Table', category: 'Storage', points: 4 },
  
//   // Tables
//   { id: 'office-table', name: 'Office Table', category: 'Tables', points: 5 },
//   { id: 'dining-table', name: 'Dining Table', category: 'Tables', points: 6 },
//   { id: 'side-table', name: 'Sidetable', category: 'Tables', points: 2 },
//   { id: 'coffee-table', name: 'Coffee Table', category: 'Tables', points: 3 },
  
//   // Appliances
//   { id: 'washing-machine', name: 'Washing Machine', category: 'Appliances', points: 12 },
//   { id: 'dryer', name: 'Dryer', category: 'Appliances', points: 8 },
//   { id: 'fridge-big', name: 'Big Fridge/ Freezer', category: 'Appliances', points: 8 },
//   { id: 'fridge-small', name: 'Small Fridge/ Freezer', category: 'Appliances', points: 4 },
  
//   // Others
//   { id: 'box', name: 'Box / Bag', category: 'Others', points: 0.3 },
//   { id: 'luggage', name: 'Luggage', category: 'Others', points: 0.5 },
//   { id: 'bike', name: 'Bike', category: 'Others', points: 6 },
//   { id: 'mirror', name: 'Mirror', category: 'Others', points: 2 },
//   { id: 'tv', name: 'TV', category: 'Others', points: 2 },
//   { id: 'computer', name: 'Computer', category: 'Others', points: 2 },
//   { id: 'standing-lamp', name: '(Standing) Lamp', category: 'Others', points: 2 },
//   { id: 'small-appliance', name: 'Small appliance', category: 'Others', points: 1 },
//   { id: 'small-household', name: 'Small household items', category: 'Others', points: 1 },
//   { id: 'small-furniture', name: 'Small Furniture', category: 'Others', points: 3 },
//   { id: 'big-furniture', name: 'Big Furniture', category: 'Others', points: 8 },
// ];

// Item categories for UI organization - now properly structured with item objects
// export const itemCategories = [
//   { 
//     name: "Sofa's and Chairs", 
//     items: [
//       { id: 'sofa-2p', name: '2-Seater Sofa' },
//       { id: 'sofa-3p', name: '3-Seater Sofa' },
//       { id: 'armchair', name: 'Armchair' },
//       { id: 'office-chair', name: 'Office Chair' },
//       { id: 'chair', name: 'Chair' }
//     ]
//   },
//   { 
//     name: "Bed", 
//     items: [
//       { id: 'bed-1p', name: '1-Person Bed' },
//       { id: 'bed-2p', name: '2-Person Bed' },
//       { id: 'mattress-1p', name: '1-person Matress' },
//       { id: 'mattress-2p', name: '2-Person Matress' },
//       { id: 'bedside-table', name: 'Bedside Table' }
//     ]
//   },
//   { 
//     name: "Storage", 
//     items: [
//       { id: 'closet-2d', name: '2-Doors Closet' },
//       { id: 'closet-3d', name: '3-Doors Closet' },
//       { id: 'cloth-rack', name: 'Cloth Rack' },
//       { id: 'bookcase', name: 'Bookcase' },
//       { id: 'dressoir', name: 'Drawer/ Dressoir' },
//       { id: 'tv-table', name: 'TV Table' }
//     ]
//   },
//   { 
//     name: "Tables", 
//     items: [
//       { id: 'office-table', name: 'Office Table' },
//       { id: 'dining-table', name: 'Dining Table' },
//       { id: 'side-table', name: 'Sidetable' },
//       { id: 'coffee-table', name: 'Coffee Table' }
//     ]
//   },
//   { 
//     name: "Appliances", 
//     items: [
//       { id: 'washing-machine', name: 'Washing Machine' },
//       { id: 'dryer', name: 'Dryer' },
//       { id: 'fridge-big', name: 'Big Fridge/ Freezer' },
//       { id: 'fridge-small', name: 'Small Fridge/ Freezer' }
//     ]
//   },
//   { 
//     name: "Others", 
//     items: [
//       { id: 'box', name: 'Box' },
//       { id: 'luggage', name: 'Luggage' },
//       { id: 'bike', name: 'Bike' },
//       { id: 'mirror', name: 'Mirror' },
//       { id: 'tv', name: 'TV' },
//       { id: 'computer', name: 'Computer' },
//       { id: 'standing-lamp', name: '(Standing) Lamp' },
//       { id: 'small-appliance', name: 'Small appliance' },
//       { id: 'small-household', name: 'Small household items' },
//       { id: 'small-furniture', name: 'Small Furniture' },
//       { id: 'big-furniture', name: 'Big Furniture' },
//     ]
//   }
// ];

// City base charges - These should be controlled from backend/admin panel
// Based on the pricing document - exact values from the table
// export const cityBaseCharges: { [key: string]: { normal: number, cityDay: number, dayOfWeek: number } } = {
//   Amsterdam: { normal: 119, cityDay: 39, dayOfWeek: 1 },
//   Utrecht: { normal: 119, cityDay: 35, dayOfWeek: 1 },
//   Almere: { normal: 129, cityDay: 44, dayOfWeek: 1 },
//   Haarlem: { normal: 119, cityDay: 44, dayOfWeek: 1 },
//   Zaanstad: { normal: 119, cityDay: 39, dayOfWeek: 1 },
//   Amersfoort: { normal: 129, cityDay: 49, dayOfWeek: 1 },
//   "s-Hertogenbosch": { normal: 89, cityDay: 39, dayOfWeek: 1 },
//   Hoofddorp: { normal: 119, cityDay: 39, dayOfWeek: 1 },
//   Rotterdam: { normal: 119, cityDay: 35, dayOfWeek: 2 },
//   "The Hague": { normal: 119, cityDay: 35, dayOfWeek: 2 },
//   Breda: { normal: 79, cityDay: 35, dayOfWeek: 2 },
//   Leiden: { normal: 129, cityDay: 39, dayOfWeek: 2 },
//   Dordrecht: { normal: 109, cityDay: 35, dayOfWeek: 2 },
//   Zoetermeer: { normal: 119, cityDay: 35, dayOfWeek: 2 },
//   Delft: { normal: 119, cityDay: 35, dayOfWeek: 2 },
//   Eindhoven: { normal: 89, cityDay: 34, dayOfWeek: 3 },
//   Maastricht: { normal: 149, cityDay: 34, dayOfWeek: 3 },
//   Tilburg: { normal: 29, cityDay: 29, dayOfWeek: 4 },
//   Groningen: { normal: 219, cityDay: 69, dayOfWeek: 5 },
//   Nijmegen: { normal: 149, cityDay: 59, dayOfWeek: 6 },
//   Enschede: { normal: 159, cityDay: 69, dayOfWeek: 6 },
//   Arnhem: { normal: 159, cityDay: 59, dayOfWeek: 6 },
//   Apeldoorn: { normal: 159, cityDay: 49, dayOfWeek: 6 },
//   Deventer: { normal: 159, cityDay: 99, dayOfWeek: 6 },
//   Zwolle: { normal: 179, cityDay: 119, dayOfWeek: 7 },
// };

// Types for dynamic data
export type FurnitureItem = { id: string; name: string; category: string; points: number };
export type ItemCategory = { name: string; items: { id: string; name: string }[] };
export type CityBaseCharge = { normal: number; cityDay: number; dayOfWeek: number };

// Fetch and return furnitureItems in the same format as the original constant
export async function getFurnitureItems(): Promise<FurnitureItem[]> {
  const { data: items } = await supabase.from('furniture_items').select('*');
  if (!items) return [];
  // Map to { id, name, category, points } with id generated from name
  return items.map(({ name, category, points }: any) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    category,
    points
  }));
}

// Fetch and return itemCategories in the same format as the original constant
export async function getItemCategories(): Promise<ItemCategory[]> {
  const { data: items } = await supabase.from('furniture_items').select('*');
  if (!items) return [];
  // Group by category
  const categoryMap: Record<string, { id: string; name: string }[]> = {};
  for (const item of items) {
    if (!categoryMap[item.category]) categoryMap[item.category] = [];
    categoryMap[item.category].push({ id: item.id, name: item.name });
  }
  return Object.entries(categoryMap).map(([name, items]) => ({ name, items }));
}

// Fetch and return cityBaseCharges in the same format as the original constant
export async function getCityBaseCharges(): Promise<Record<string, CityBaseCharge>> {
  const { data: cities } = await supabase.from('city_base_charges').select('*');
  if (!cities) return {};
  const cityBaseCharges: Record<string, CityBaseCharge> = {};
  for (const row of cities) {
    cityBaseCharges[row.city_name] = {
      normal: row.normal,
      cityDay: row.city_day,
      dayOfWeek: row.day_of_week
    };
  }
  return cityBaseCharges;
}

// --- DYNAMIC CONSTANTS INIT ---
// These will be populated at runtime by the internal call to initDynamicConstants()
export let furnitureItems: FurnitureItem[] = [];
export let itemCategories: ItemCategory[] = [];
export let cityBaseCharges: Record<string, CityBaseCharge> = {};

/**
 * This function is called ONCE at module load to populate the dynamic constants from Supabase.
 * Do not export or call this elsewhere.
 */
async function initDynamicConstants() {
  furnitureItems = await getFurnitureItems();
  itemCategories = await getItemCategories();
  cityBaseCharges = await getCityBaseCharges();
}

// Immediately invoke the initialization (fire and forget)
// Note: If you need to ensure these are populated before use, await this in your app entry point.
initDynamicConstants();

// Helper function to get item points (sync, using populated furnitureItems)
export const getItemPoints = (itemId: string): number => {
  const item = furnitureItems.find(item => item.id === itemId);
  return item ? item.points : 0;
};

// Helper function to check if a date is a city day (admin-booked in city_schedules)
export const isCityDay = async (city: string, date: Date): Promise<boolean> => {
  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('city_schedules')
    .select('id')
    .eq('city', city)
    .eq('date', dateStr)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[isCityDay] Error fetching city_schedules:', error);
    return false;
  }
  return !!data;
};
