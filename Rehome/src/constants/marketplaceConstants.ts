// Marketplace Constants - Shared across SellPage, EditPage, and MarketplaceFilter

export const FURNITURE_CATEGORIES = [
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
        name: 'Kasten', 
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
        name: 'Vazes', 
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
] as const;

export const FURNITURE_CONDITIONS = [
    { value: '1', label: 'Like New - Almost no signs of use, very well maintained' },
    { value: '2', label: 'Excellent - Minimal wear, barely noticeable imperfections' },
    { value: '3', label: 'Good - Visible signs of wear (scratches, small dents), but fully functional' },
    { value: '4', label: 'Fair - Heavily used with noticeable wear, may need minor repairs' },
    { value: '5', label: 'Poor/Broken - Significant damage or functional issues, may require major repairs' }
] as const;

// Type definitions
export type FurnitureCategory = typeof FURNITURE_CATEGORIES[number]['name'];
export type FurnitureCondition = typeof FURNITURE_CONDITIONS[number]['value'];

// Helper functions
export const getCategorySubcategories = (categoryName: FurnitureCategory): string[] => {
    const category = FURNITURE_CATEGORIES.find(cat => cat.name === categoryName);
    return [...(category?.subcategories || [])];
};

export const getConditionLabel = (conditionValue: FurnitureCondition): string => {
    const condition = FURNITURE_CONDITIONS.find(cond => cond.value === conditionValue);
    return condition?.label || '';
}; 