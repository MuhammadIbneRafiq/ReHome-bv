// Marketplace Constants - Shared across SellPage, EditPage, and MarketplaceFilter
import { getMarketplaceCategories, MarketplaceCategory } from '../services/marketplaceItemDetailsService';

// Fallback categories in case API fails
export const FALLBACK_MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { 
    name: 'Bathroom Furniture', 
    subcategories: [] 
  },
  { 
    name: 'Sofa\'s and Chairs', 
    subcategories: [
      'Sofa',
      'Armchairs',
      'Office Chair/ Bureuaustoel',
      'Chairs',
      'Kussens'
    ] 
  },
  { 
    name: 'Storage Furniture', 
    subcategories: [
      'Closet (Kleidingkast)',
      'Bookcase (Boekenkast)',
      'Drawer/ Dressoir',
      'TV Tables'
    ] 
  },
  { 
    name: 'Bedroom', 
    subcategories: [] 
  },
  { 
    name: 'Tables', 
    subcategories: [
      'Office Table (Bureau)',
      'Dining Table',
      'Sidetables',
      'Coffee Table'
    ] 
  },
  { 
    name: 'Appliances', 
    subcategories: [
      'Washing Machine',
      'Fridge',
      'Freezer',
      'Others'
    ] 
  },
  { 
    name: 'Mirrors', 
    subcategories: [] 
  },
  { 
    name: 'Lamps', 
    subcategories: [] 
  },
  { 
    name: 'Carpets', 
    subcategories: [] 
  },
  { 
    name: 'Curtains', 
    subcategories: [] 
  },
  { 
    name: 'Plants', 
    subcategories: [] 
  },
  { 
    name: 'Kitchen equipment', 
    subcategories: [] 
  },
  { 
    name: 'Others', 
    subcategories: ['Vases'] 
  }
];

// Dynamic function to get marketplace categories from API
export const getMarketplaceCategoriesDynamic = async (): Promise<MarketplaceCategory[]> => {
  try {
    const categories = await getMarketplaceCategories();
    return categories;
  } catch (error) {
    console.error('Failed to fetch marketplace categories from API, using fallback:', error);
    return FALLBACK_MARKETPLACE_CATEGORIES;
  }
};

// For backward compatibility, export the fallback as the default
export const MARKETPLACE_CATEGORIES = FALLBACK_MARKETPLACE_CATEGORIES;

export const CONDITION_OPTIONS = [
  { value: '1', label: 'Like New - Almost no signs of use, very well maintained' },
  { value: '2', label: 'Excellent - Minimal wear, barely noticeable imperfections' },
  { value: '3', label: 'Good - Visible signs of wear (scratches, small dents), but fully functional' },
  { value: '4', label: 'Fair - Heavily used with noticeable wear, may need minor repairs' },
  { value: '5', label: 'Poor/Broken - Significant damage or functional issues, may require major repairs' }
];

// Type definitions
export type FurnitureCategory = string; // Changed to string since it's now dynamic
export type FurnitureCondition = typeof CONDITION_OPTIONS[number]['value'];

// Helper functions - updated to work with dynamic categories
export const getCategorySubcategories = async (categoryName: string): Promise<string[]> => {
  try {
    const categories = await getMarketplaceCategoriesDynamic();
    const category = categories.find(cat => cat.name === categoryName);
    return [...(category?.subcategories || [])];
  } catch (error) {
    console.error('Error getting category subcategories:', error);
    return [];
  }
};

export const getConditionLabel = (conditionValue: FurnitureCondition): string => {
    const condition = CONDITION_OPTIONS.find(cond => cond.value === conditionValue);
    return condition?.label || '';
}; 