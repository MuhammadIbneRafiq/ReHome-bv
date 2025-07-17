// Pricing Configuration - These values should be controlled from backend/admin panel
export const pricingConfig = {
  // Base multipliers
  houseMovingItemMultiplier: 2, // €2.3 per point for house moving
  itemTransportMultiplier: 1, // €1.5 per point for item transport
  addonMultiplier: 3, // €3 per point for add-ons
  
  // Distance pricing
  distancePricing: {
    smallDistance: { threshold: 10, rate: 0 }, // Below 10km = free
    mediumDistance: { threshold: 50, rate: 0.7 }, // 10-50km = €2.5/km
    longDistance: { rate: 0.5 } // Over 50km = €1.4/km
  },
  
  // Carrying multipliers (per floor)
  carryingMultipliers: {
    lowValue: { threshold: 6, multiplier: 0.2 }, // Items ≤6 points
    highValue: { multiplier: 0.4 } // Items ≥7 points
  },
  
  // Assembly multipliers
  assemblyMultipliers: {
    lowValue: { threshold: 6, multiplier: 0.5 }, // Items ≤6 points
    highValue: { multiplier: 0.7 } // Items ≥7 points
  },
  
  // Extra helper pricing
  extraHelperPricing: {
    smallMove: { threshold: 30, price: 30 }, // Up to 20 items = €30
    bigMove: { price: 60 } // Over 20 items = €60
  },
  
  // City range and extra distance pricing
  cityRange: {
    baseRadius: 8, // 8km from city center
    extraKmRate: 3 // €3 per extra km
  },
  
  // Early booking discount
  earlyBookingDiscount: 0.5, // 0% discount for empty calendar days
  
  // Student discount
  studentDiscount: 0.1 // 10% discount
};

// Define furniture items with proper categorization and points
// Updated to match the exact specification provided - Total item value = Total points * €2
export const furnitureItems = [
  // Sofa's and Chairs
  { id: 'sofa-2p', name: '2-Seater Sofa', category: 'Sofa\'s and Chairs', points: 10 },
  { id: 'sofa-3p', name: '3-Seater Sofa', category: 'Sofa\'s and Chairs', points: 12 },
  { id: 'armchair', name: 'Armchair', category: 'Sofa\'s and Chairs', points: 4 },
  { id: 'office-chair', name: 'Office Chair', category: 'Sofa\'s and Chairs', points: 3 },
  { id: 'chair', name: 'Chair', category: 'Sofa\'s and Chairs', points: 2 },
  
  // Bed
  { id: 'bed-1p', name: '1-Person Bed', category: 'Bed', points: 4 },
  { id: 'bed-2p', name: '2-Person Bed', category: 'Bed', points: 8 },
  { id: 'mattress-1p', name: '1-person Matress', category: 'Bed', points: 3 },
  { id: 'mattress-2p', name: '2-Person Matress', category: 'Bed', points: 6 },
  { id: 'bedside-table', name: 'Bedside Table', category: 'Bed', points: 2 },
  
  // Storage
  { id: 'closet-2d', name: '2-Doors Closet', category: 'Storage', points: 8 },
  { id: 'closet-3d', name: '3-Doors Closet', category: 'Storage', points: 10 },
  { id: 'cloth-rack', name: 'Cloth Rack', category: 'Storage', points: 3 },
  { id: 'bookcase', name: 'Bookcase', category: 'Storage', points: 6 },
  { id: 'dressoir', name: 'Drawer/ Dressoir', category: 'Storage', points: 5 },
  { id: 'tv-table', name: 'TV Table', category: 'Storage', points: 4 },
  
  // Tables
  { id: 'office-table', name: 'Office Table', category: 'Tables', points: 5 },
  { id: 'dining-table', name: 'Dining Table', category: 'Tables', points: 6 },
  { id: 'side-table', name: 'Sidetable', category: 'Tables', points: 2 },
  { id: 'coffee-table', name: 'Coffee Table', category: 'Tables', points: 3 },
  
  // Appliances
  { id: 'washing-machine', name: 'Washing Machine', category: 'Appliances', points: 12 },
  { id: 'dryer', name: 'Dryer', category: 'Appliances', points: 8 },
  { id: 'fridge-big', name: 'Big Fridge/ Freezer', category: 'Appliances', points: 8 },
  { id: 'fridge-small', name: 'Small Fridge/ Freezer', category: 'Appliances', points: 4 },
  
  // Others
  { id: 'box', name: 'Box / Bag', category: 'Others', points: 0.3 },
  { id: 'luggage', name: 'Luggage', category: 'Others', points: 0.5 },
  { id: 'bike', name: 'Bike', category: 'Others', points: 6 },
  { id: 'mirror', name: 'Mirror', category: 'Others', points: 2 },
  { id: 'tv', name: 'TV', category: 'Others', points: 2 },
  { id: 'computer', name: 'Computer', category: 'Others', points: 2 },
  { id: 'standing-lamp', name: '(Standing) Lamp', category: 'Others', points: 2 },
  { id: 'small-appliance', name: 'Small appliance', category: 'Others', points: 1 },
  { id: 'small-household', name: 'Small household items', category: 'Others', points: 1 },
  { id: 'small-furniture', name: 'Small Furniture', category: 'Others', points: 3 },
  { id: 'big-furniture', name: 'Big Furniture', category: 'Others', points: 8 },
];

// Item categories for UI organization - now properly structured with item objects
export const itemCategories = [
  { 
    name: "Sofa's and Chairs", 
    items: [
      { id: 'sofa-2p', name: '2-Seater Sofa' },
      { id: 'sofa-3p', name: '3-Seater Sofa' },
      { id: 'armchair', name: 'Armchair' },
      { id: 'office-chair', name: 'Office Chair' },
      { id: 'chair', name: 'Chair' }
    ]
  },
  { 
    name: "Bed", 
    items: [
      { id: 'bed-1p', name: '1-Person Bed' },
      { id: 'bed-2p', name: '2-Person Bed' },
      { id: 'mattress-1p', name: '1-person Matress' },
      { id: 'mattress-2p', name: '2-Person Matress' },
      { id: 'bedside-table', name: 'Bedside Table' }
    ]
  },
  { 
    name: "Storage", 
    items: [
      { id: 'closet-2d', name: '2-Doors Closet' },
      { id: 'closet-3d', name: '3-Doors Closet' },
      { id: 'cloth-rack', name: 'Cloth Rack' },
      { id: 'bookcase', name: 'Bookcase' },
      { id: 'dressoir', name: 'Drawer/ Dressoir' },
      { id: 'tv-table', name: 'TV Table' }
    ]
  },
  { 
    name: "Tables", 
    items: [
      { id: 'office-table', name: 'Office Table' },
      { id: 'dining-table', name: 'Dining Table' },
      { id: 'side-table', name: 'Sidetable' },
      { id: 'coffee-table', name: 'Coffee Table' }
    ]
  },
  { 
    name: "Appliances", 
    items: [
      { id: 'washing-machine', name: 'Washing Machine' },
      { id: 'dryer', name: 'Dryer' },
      { id: 'fridge-big', name: 'Big Fridge/ Freezer' },
      { id: 'fridge-small', name: 'Small Fridge/ Freezer' }
    ]
  },
  { 
    name: "Others", 
    items: [
      { id: 'box', name: 'Box' },
      { id: 'luggage', name: 'Luggage' },
      { id: 'bike', name: 'Bike' },
      { id: 'mirror', name: 'Mirror' },
      { id: 'tv', name: 'TV' },
      { id: 'computer', name: 'Computer' },
      { id: 'standing-lamp', name: '(Standing) Lamp' },
      { id: 'small-appliance', name: 'Small appliance' },
      { id: 'small-household', name: 'Small household items' },
      { id: 'small-furniture', name: 'Small Furniture' },
      { id: 'big-furniture', name: 'Big Furniture' }
    ]
  }
];

// City base charges - These should be controlled from backend/admin panel
// Based on the pricing document - exact values from the table
export const cityBaseCharges: { [key: string]: { normal: number, cityDay: number, dayOfWeek: number } } = {
  Amsterdam: { normal: 119, cityDay: 39, dayOfWeek: 1 },
  Utrecht: { normal: 119, cityDay: 35, dayOfWeek: 1 },
  Almere: { normal: 129, cityDay: 44, dayOfWeek: 1 },
  Haarlem: { normal: 119, cityDay: 44, dayOfWeek: 1 },
  Zaanstad: { normal: 119, cityDay: 39, dayOfWeek: 1 },
  Amersfoort: { normal: 129, cityDay: 49, dayOfWeek: 1 },
  "s-Hertogenbosch": { normal: 89, cityDay: 39, dayOfWeek: 1 },
  Hoofddorp: { normal: 119, cityDay: 39, dayOfWeek: 1 },
  Rotterdam: { normal: 119, cityDay: 35, dayOfWeek: 2 },
  "The Hague": { normal: 119, cityDay: 35, dayOfWeek: 2 },
  Breda: { normal: 79, cityDay: 35, dayOfWeek: 2 },
  Leiden: { normal: 129, cityDay: 39, dayOfWeek: 2 },
  Dordrecht: { normal: 109, cityDay: 35, dayOfWeek: 2 },
  Zoetermeer: { normal: 119, cityDay: 35, dayOfWeek: 2 },
  Delft: { normal: 119, cityDay: 35, dayOfWeek: 2 },
  Eindhoven: { normal: 89, cityDay: 34, dayOfWeek: 3 },
  Maastricht: { normal: 149, cityDay: 34, dayOfWeek: 3 },
  Tilburg: { normal: 29, cityDay: 29, dayOfWeek: 4 },
  Groningen: { normal: 219, cityDay: 69, dayOfWeek: 5 },
  Nijmegen: { normal: 149, cityDay: 59, dayOfWeek: 6 },
  Enschede: { normal: 159, cityDay: 69, dayOfWeek: 6 },
  Arnhem: { normal: 159, cityDay: 59, dayOfWeek: 6 },
  Apeldoorn: { normal: 159, cityDay: 49, dayOfWeek: 6 },
  Deventer: { normal: 159, cityDay: 99, dayOfWeek: 6 },
  Zwolle: { normal: 179, cityDay: 119, dayOfWeek: 7 },
};

// City Day Data - Days when cities are included in tours
// Numbers represent day of week: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
export const cityDayData: { [key: string]: number[] } = {
  Amsterdam: [1], // Monday
  Utrecht: [1], // Monday
  Almere: [1], // Monday
  Haarlem: [1], // Monday
  Zaanstad: [1], // Monday
  Amersfoort: [1], // Monday
  "s-Hertogenbosch": [1], // Monday
  Hoofddorp: [1], // Monday
  Rotterdam: [2], // Tuesday
  "The Hague": [2], // Tuesday
  Breda: [2], // Tuesday
  Leiden: [2], // Tuesday
  Dordrecht: [2], // Tuesday
  Zoetermeer: [2], // Tuesday
  Delft: [2], // Tuesday
  Eindhoven: [3], // Wednesday
  Maastricht: [3], // Wednesday
  Tilburg: [4], // Thursday
  Groningen: [5], // Friday
  Nijmegen: [6], // Saturday
  Enschede: [6], // Saturday
  Arnhem: [6], // Saturday
  Apeldoorn: [6], // Saturday
  Deventer: [6], // Saturday
  Zwolle: [7], // Sunday
};

// Helper function to get item by ID
export const getItemById = (itemId: string) => {
  return furnitureItems.find(item => item.id === itemId);
};

// Helper function to get item points
export const getItemPoints = (itemId: string): number => {
  const item = getItemById(itemId);
  return item ? item.points : 0;
};

// Helper function to get city from postal code (simplified)
export const getCityFromPostalCode = (postalCode: string): string | null => {
  const code = postalCode.replace(/\s/g, '').substring(0, 4);
  
  // Amsterdam area (1000-1999)
  if (code >= '1000' && code <= '1999') return 'Amsterdam';
  
  // Rotterdam area (3000-3999)
  if (code >= '3000' && code <= '3999') return 'Rotterdam';
  
  // The Hague area (2500-2799)
  if (code >= '2500' && code <= '2799') return 'The Hague';
  
  // Utrecht area (3500-3599)
  if (code >= '3500' && code <= '3599') return 'Utrecht';
  
  // Eindhoven area (5600-5699)
  if (code >= '5600' && code <= '5699') return 'Eindhoven';
  
  // Add more postal code mappings as needed
  return null;
};

// Helper function to check if a date is a city day
export const isCityDay = (city: string, date: Date): boolean => {
  if (!cityDayData[city]) return false;
  
  // JavaScript Date.getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  // Our system: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
  const jsDay = date.getDay();
  const ourDay = jsDay === 0 ? 7 : jsDay; // Convert Sunday from 0 to 7
  
  return cityDayData[city].includes(ourDay);
};
