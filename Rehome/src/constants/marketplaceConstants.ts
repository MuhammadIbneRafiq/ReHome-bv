// Marketplace Constants - Shared across SellPage, EditPage, and MarketplaceFilter

export const MARKETPLACE_CATEGORIES = [
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
    name: 'Vases', 
    subcategories: [] 
  },
  { 
    name: 'Kitchen equipment', 
    subcategories: [] 
  },
  { 
    name: 'Others', 
    subcategories: [] 
  }
];

export const CONDITION_OPTIONS = [
  { value: '1', label: 'Like New - Almost no signs of use, very well maintained' },
  { value: '2', label: 'Excellent - Minimal wear, barely noticeable imperfections' },
  { value: '3', label: 'Good - Visible signs of wear (scratches, small dents), but fully functional' },
  { value: '4', label: 'Fair - Heavily used with noticeable wear, may need minor repairs' },
  { value: '5', label: 'Poor/Broken - Significant damage or functional issues, may require major repairs' }
];

// Type definitions
export type FurnitureCategory = typeof MARKETPLACE_CATEGORIES[number]['name'];
export type FurnitureCondition = typeof CONDITION_OPTIONS[number]['value'];

// Helper functions
export const getCategorySubcategories = (categoryName: FurnitureCategory): string[] => {
    const category = MARKETPLACE_CATEGORIES.find(cat => cat.name === categoryName);
    return [...(category?.subcategories || [])];
};

export const getConditionLabel = (conditionValue: FurnitureCondition): string => {
    const condition = CONDITION_OPTIONS.find(cond => cond.value === conditionValue);
    return condition?.label || '';
}; 