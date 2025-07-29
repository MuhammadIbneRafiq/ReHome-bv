import { API_ENDPOINTS } from '../lib/api/config';

export interface MarketplaceItemDetail {
  id: string;
  category: string;
  subcategory?: string;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItemPoints {
  category: string;
  subcategory?: string;
  points: number;
}

export interface MarketplaceCategory {
  name: string;
  subcategories: string[];
}

export interface PricingMultipliers {
  carrying: {
    lowPoints: {
      threshold: number;
      multiplier: number;
      cost: number;
    };
    highPoints: {
      threshold: number;
      multiplier: number;
      cost: number;
    };
  };
  assembly: {
    lowPoints: {
      threshold: number;
      multiplier: number;
      cost: number;
    };
    highPoints: {
      threshold: number;
      multiplier: number;
      cost: number;
    };
  };
  points: {
    min: number;
    max: number;
    average: number;
    threshold: number;
  };
}

// Fetch all marketplace item details
export const fetchMarketplaceItemDetails = async (): Promise<MarketplaceItemDetail[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.MARKETPLACE.ITEM_DETAILS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching marketplace item details:', error);
    throw error;
  }
};

// Fetch marketplace item details by category
export const fetchMarketplaceItemDetailsByCategory = async (): Promise<MarketplaceItemDetail[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.MARKETPLACE.ITEM_DETAILS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching marketplace item details by category:', error);
    throw error;
  }
};

// Fetch marketplace item points by category and subcategory
export const fetchMarketplaceItemPoints = async (category: string, subcategory?: string): Promise<MarketplaceItemPoints> => {
  try {
    const response = await fetch(API_ENDPOINTS.MARKETPLACE.ITEM_DETAILS);
    console.log('response of item points', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Filter the data to find the specific category and subcategory
    const itemDetails = data.data || [];
    const matchingItem = itemDetails.find((item: MarketplaceItemDetail) => 
      item.category === category && 
      (subcategory ? item.subcategory === subcategory : !item.subcategory)
    );
    
    if (matchingItem) {
      return {
        category: matchingItem.category,
        subcategory: matchingItem.subcategory,
        points: matchingItem.points
      };
    }
    
    // If no exact match found, try to find by category only (for items without subcategory)
    const categoryOnlyMatch = itemDetails.find((item: MarketplaceItemDetail) => 
      item.category === category && !item.subcategory
    );
    
    if (categoryOnlyMatch) {
      return {
        category: categoryOnlyMatch.category,
        subcategory: categoryOnlyMatch.subcategory,
        points: categoryOnlyMatch.points
      };
    }
    
    // Default fallback
    return {
      category,
      subcategory,
      points: 3
    };
  } catch (error) {
    console.error('Error fetching marketplace item points:', error);
    throw error;
  }
};

// Get marketplace categories with subcategories
export const getMarketplaceCategories = async (): Promise<MarketplaceCategory[]> => {
  try {
    const itemDetails = await fetchMarketplaceItemDetails();
    
    // Group by category and collect subcategories
    const categoryMap = new Map<string, string[]>();
    
    itemDetails.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      if (item.subcategory) {
        categoryMap.get(item.category)!.push(item.subcategory);
      }
    });
    
    // Convert to array format
    return Array.from(categoryMap.entries()).map(([name, subcategories]) => ({
      name,
      subcategories: [...new Set(subcategories)] // Remove duplicates
    }));
  } catch (error) {
    console.error('Error getting marketplace categories:', error);
    throw error;
  }
};

// Fetch dynamic pricing multipliers from backend
export const fetchPricingMultipliers = async (): Promise<PricingMultipliers> => {
  try {
    const response = await fetch(API_ENDPOINTS.MARKETPLACE.PRICING_MULTIPLIERS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching pricing multipliers:', error);
    // Return default multipliers if API fails
    return {
      carrying: {
        lowPoints: { threshold: 3, multiplier: 1.0, cost: 3 },
        highPoints: { threshold: 6, multiplier: 1.67, cost: 5 }
      },
      assembly: {
        lowPoints: { threshold: 3, multiplier: 1.0, cost: 60 },
        highPoints: { threshold: 6, multiplier: 1.33, cost: 80 }
      },
      points: {
        min: 1,
        max: 9,
        average: 3.5,
        threshold: 6
      }
    };
  }
};

// Admin functions for managing marketplace item details
export const adminFetchMarketplaceItemDetails = async (token: string): Promise<MarketplaceItemDetail[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN.MARKETPLACE_ITEM_DETAILS, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching admin marketplace item details:', error);
    throw error;
  }
};

export const adminCreateMarketplaceItemDetail = async (
  token: string,
  itemDetail: { category: string; subcategory?: string; points: number }
): Promise<MarketplaceItemDetail> => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN.MARKETPLACE_ITEM_DETAILS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(itemDetail),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating marketplace item detail:', error);
    throw error;
  }
};

export const adminUpdateMarketplaceItemDetail = async (
  token: string,
  id: string,
  itemDetail: Partial<{ category: string; subcategory?: string; points: number; is_active: boolean }>
): Promise<MarketplaceItemDetail> => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN.MARKETPLACE_ITEM_DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(itemDetail),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating marketplace item detail:', error);
    throw error;
  }
};

export const adminDeleteMarketplaceItemDetail = async (token: string, id: string): Promise<MarketplaceItemDetail> => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN.MARKETPLACE_ITEM_DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error deleting marketplace item detail:', error);
    throw error;
  }
};

// Helper function to get points for a marketplace item
export const getMarketplaceItemPoints = async (category: string, subcategory?: string): Promise<number> => {
  try {
    const pointsData = await fetchMarketplaceItemPoints(category, subcategory);
    return pointsData.points;
  } catch (error) {
    console.error('Error getting marketplace item points:', error);
    return 3; // Default fallback
  }
};

// Helper function to get all categories and their points
export const getMarketplaceCategoriesWithPoints = async (): Promise<Map<string, Map<string, number>>> => {
  try {
    const itemDetails = await fetchMarketplaceItemDetails();
    const categoryMap = new Map<string, Map<string, number>>();
    
    itemDetails.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Map());
      }
      const subcategoryMap = categoryMap.get(item.category)!;
      const key = item.subcategory || 'default';
      subcategoryMap.set(key, item.points);
    });
    
    return categoryMap;
  } catch (error) {
    console.error('Error getting marketplace categories with points:', error);
    throw error;
  }
}; 