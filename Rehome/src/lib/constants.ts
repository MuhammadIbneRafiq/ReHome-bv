// Pricing Configuration - These values should be controlled from backend/admin panel
export const pricingConfig = {
  // Base multipliers
  houseMovingItemMultiplier: 2, // €2 per point for house moving
  itemTransportMultiplier: 1, // €1 per point for item transport
  addonMultiplier: 3, // €3 per point for add-ons
  
  // Distance pricing
  distancePricing: {
    smallDistance: { threshold: 10, rate: 0 }, // Below 10km = free
    mediumDistance: { threshold: 50, rate: 0.7 }, // 10-50km = €0.7/km
    longDistance: { rate: 0.5 } // Over 50km = €0.5/km
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
    smallMove: { threshold: 30, price: 45 }, // Up to 30 points = €45
    bigMove: { price: 60 } // Over 30 points = €60
  },
  
  // City range and extra distance pricing
  cityRange: {
    baseRadius: 8, // 8km from city center
    extraKmRate: 3 // €3 per extra km
  },
  
  // Early booking discount
  earlyBookingDiscount: 0.5, // 50% discount for empty calendar days
  
  // Student discount
  studentDiscount: 0.1 // 10% discount
};

// Define furniture items with proper categorization and points
export const furnitureItems = [
  // Sofa's and Chairs (Banken en Stoelen)
  { id: 'sofa-2p', name: '2-Seater Sofa', category: 'Sofa\'s and Chairs', points: 10 },
  { id: 'sofa-3p', name: '3-Seater Sofa', category: 'Sofa\'s and Chairs', points: 12 },
  { id: 'armchair', name: 'Armchair', category: 'Sofa\'s and Chairs', points: 4 },
  { id: 'office-chair', name: 'Office Chair', category: 'Sofa\'s and Chairs', points: 3 },
  { id: 'chair', name: 'Chair', category: 'Sofa\'s and Chairs', points: 2 },
  
  // Bed (Bed)
  { id: 'bed-1p', name: '1-Person Bed', category: 'Bed', points: 4 },
  { id: 'bed-2p', name: '2-Person Bed', category: 'Bed', points: 8 },
  { id: 'mattress-1p', name: '1-Person Mattress', category: 'Bed', points: 3 },
  { id: 'mattress-2p', name: '2-Person Mattress', category: 'Bed', points: 6 },
  { id: 'bedside-table', name: 'Bedside Table', category: 'Bed', points: 2 },
  
  // Storage (Kasten & Opbergen)
  { id: 'closet-2d', name: '2-Doors Closet', category: 'Storage', points: 8 },
  { id: 'closet-3d', name: '3-Doors Closet', category: 'Storage', points: 10 },
  { id: 'cloth-rack', name: 'Cloth Rack', category: 'Storage', points: 3 },
  { id: 'bookcase', name: 'Bookcase', category: 'Storage', points: 6 },
  { id: 'dressoir', name: 'Drawer/Dressoir', category: 'Storage', points: 5 },
  { id: 'tv-table', name: 'TV Table', category: 'Storage', points: 4 },
  
  // Tables (Tafels)
  { id: 'office-table', name: 'Office Table', category: 'Tables', points: 5 },
  { id: 'dining-table', name: 'Dining Table', category: 'Tables', points: 6 },
  { id: 'side-table', name: 'Side Table', category: 'Tables', points: 2 },
  { id: 'coffee-table', name: 'Coffee Table', category: 'Tables', points: 3 },
  
  // Appliances (Apparaten)
  { id: 'washing-machine', name: 'Washing Machine', category: 'Appliances', points: 12 },
  { id: 'dryer', name: 'Dryer', category: 'Appliances', points: 8 },
  { id: 'fridge-big', name: 'Big Fridge/Freezer', category: 'Appliances', points: 8 },
  { id: 'fridge-small', name: 'Small Fridge/Freezer', category: 'Appliances', points: 4 },
  { id: 'microwave', name: 'Microwave', category: 'Appliances', points: 1 },
  
  // Others (Overige Items)
  { id: 'box', name: 'Box', category: 'Others', points: 0.3 },
  { id: 'luggage', name: 'Luggage', category: 'Others', points: 0.5 },
  { id: 'bike', name: 'Bike', category: 'Others', points: 6 },
  { id: 'mirror', name: 'Mirror', category: 'Others', points: 2 },
  { id: 'tv', name: 'TV', category: 'Others', points: 2 },
  { id: 'computer', name: 'Computer', category: 'Others', points: 2 },
  { id: 'standing-lamp', name: 'Standing Lamp', category: 'Others', points: 2 },
  { id: 'small-appliance', name: 'Small Appliance', category: 'Others', points: 1 },
  { id: 'small-household', name: 'Small Household Items', category: 'Others', points: 1 },
  { id: 'small-furniture', name: 'Small Furniture', category: 'Others', points: 3 },
  { id: 'big-furniture', name: 'Big Furniture', category: 'Others', points: 8 },
];

// Item categories for UI organization
export const itemCategories = [
  { 
    name: "Sofa's and Chairs", 
    items: ["2-Seater Sofa", "3-Seater Sofa", "Armchair", "Office Chair", "Chair"] 
  },
  { 
    name: "Bed", 
    items: ["1-Person Bed", "2-Person Bed", "1-Person Mattress", "2-Person Mattress", "Bedside Table"] 
  },
  { 
    name: "Storage", 
    items: ["2-Doors Closet", "3-Doors Closet", "Cloth Rack", "Bookcase", "Drawer/Dressoir", "TV Table"] 
  },
  { 
    name: "Tables", 
    items: ["Office Table", "Dining Table", "Side Table", "Coffee Table"] 
  },
  { 
    name: "Appliances", 
    items: ["Washing Machine", "Dryer", "Big Fridge/Freezer", "Small Fridge/Freezer", "Microwave"] 
  },
  { 
    name: "Others", 
    items: ["Box", "Luggage", "Bike", "Mirror", "TV", "Computer", "Standing Lamp", "Small Appliance", "Small Household Items", "Small Furniture", "Big Furniture"] 
  }
];

// City base charges - These should be controlled from backend/admin panel
export const cityBaseCharges: { [key: string]: { normal: number, cityDay: number } } = {
  Amsterdam: { normal: 119, cityDay: 35 },
  Rotterdam: { normal: 109, cityDay: 35 },
  TheHague: { normal: 115, cityDay: 35 },
  Utrecht: { normal: 125, cityDay: 35 },
  Almere: { normal: 130, cityDay: 35 },
  Haarlem: { normal: 120, cityDay: 35 },
  Zaanstad: { normal: 125, cityDay: 35 },
  Amersfoort: { normal: 135, cityDay: 35 },
  "s-Hertogenbosch": { normal: 140, cityDay: 35 },
  Hoofddorp: { normal: 125, cityDay: 35 },
  Breda: { normal: 135, cityDay: 35 },
  Leiden: { normal: 120, cityDay: 35 },
  Dordrecht: { normal: 130, cityDay: 35 },
  Zoetermeer: { normal: 120, cityDay: 35 },
  Delft: { normal: 115, cityDay: 35 },
  Eindhoven: { normal: 145, cityDay: 35 },
  Maastricht: { normal: 149, cityDay: 35 },
  Tilburg: { normal: 140, cityDay: 35 },
  Groningen: { normal: 155, cityDay: 35 },
  Nijmegen: { normal: 140, cityDay: 35 },
  Enschede: { normal: 150, cityDay: 35 },
  Arnhem: { normal: 135, cityDay: 35 },
  Apeldoorn: { normal: 140, cityDay: 35 },
  Deventer: { normal: 145, cityDay: 35 },
  Zwolle: { normal: 145, cityDay: 35 },
};

// City Day Data - Days when cities are included in tours
export const cityDayData: { [key: string]: string[] } = {
  Amsterdam: ["Monday", "Wednesday", "Friday"],
  Rotterdam: ["Tuesday", "Thursday"],
  TheHague: ["Saturday", "Sunday"],
  Utrecht: ["Monday"],
  Almere: ["Tuesday"],
  Haarlem: ["Wednesday"],
  Zaanstad: ["Thursday"],
  Amersfoort: ["Friday"],
  "s-Hertogenbosch": ["Saturday"],
  Hoofddorp: ["Sunday"],
  Breda: ["Monday", "Wednesday"],
  Leiden: ["Tuesday", "Thursday"],
  Dordrecht: ["Friday", "Sunday"],
  Zoetermeer: ["Saturday"],
  Delft: ["Monday", "Wednesday"],
  Eindhoven: ["Tuesday", "Thursday"],
  Maastricht: ["Friday", "Sunday"],
  Tilburg: ["Saturday"],
  Groningen: ["Monday", "Wednesday"],
  Nijmegen: ["Tuesday", "Thursday"],
  Enschede: ["Friday", "Sunday"],
  Arnhem: ["Saturday"],
  Apeldoorn: ["Monday", "Wednesday"],
  Deventer: ["Tuesday", "Thursday"],
  Zwolle: ["Friday", "Sunday"],
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
  if (code >= '2500' && code <= '2799') return 'TheHague';
  
  // Utrecht area (3500-3599)
  if (code >= '3500' && code <= '3599') return 'Utrecht';
  
  // Eindhoven area (5600-5699)
  if (code >= '5600' && code <= '5699') return 'Eindhoven';
  
  // Add more postal code mappings as needed
  return null;
};
