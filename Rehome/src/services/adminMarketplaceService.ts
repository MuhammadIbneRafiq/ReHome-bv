import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../lib/api/config';

const ADMIN_MARKETPLACE_API_BASE_URL = `${API_BASE_URL}/api/admin/marketplace`;

// Get auth token
const getAuthToken = async () => {
  const { data: session } = await supabase.auth.getSession();
  return session?.session?.access_token;
};

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const response = await fetch(`${ADMIN_MARKETPLACE_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string[];
  image_urls?: string[]; // supabase uses image_urls; keep both for compatibility
  city_name: string;
  seller_email: string;
  sold: boolean;
  status?: string;
  isrehome?: boolean;
  category?: string;
  subcategory?: string;
  condition_rating?: number;
  inventory_number?: string;
  created_at: string;
  updated_at?: string;
  views_count?: number;
}

export interface MarketplaceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'available' | 'reserved' | 'sold';
  type?: 'all' | 'rehome' | 'user';
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MarketplaceResponse {
  success: boolean;
  data: MarketplaceListing[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkActionRequest {
  action: 'delete' | 'update_status' | 'update_category';
  ids: string[];
  updates?: {
    status?: string;
    category?: string;
  };
}

export interface MarketplaceStats {
  total: number;
  available: number;
  sold: number;
  reserved: number;
  rehome_items: number;
  user_items: number;
  recent_listings: number;
  categories: Record<string, number>;
}

export const adminMarketplaceService = {
  // Get all marketplace furniture with filters
  async getMarketplaceFurniture(filters: MarketplaceFilters = {}): Promise<MarketplaceResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/furniture${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Get single furniture item
  async getFurnitureItem(id: string): Promise<{ success: boolean; data: MarketplaceListing }> {
    return apiRequest(`/furniture/${id}`);
  },

  // Create new furniture item
  async createFurnitureItem(item: Partial<MarketplaceListing>): Promise<{ success: boolean; data: MarketplaceListing; message: string }> {
    return apiRequest('/furniture', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // Update furniture item
  async updateFurnitureItem(id: string, updates: Partial<MarketplaceListing>): Promise<{ success: boolean; data: MarketplaceListing; message: string }> {
    return apiRequest(`/furniture/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete furniture item
  async deleteFurnitureItem(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/furniture/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk operations
  async bulkAction(request: BulkActionRequest): Promise<{ success: boolean; message: string; data?: any }> {
    return apiRequest('/furniture/bulk-action', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Get marketplace statistics
  async getMarketplaceStats(): Promise<{ success: boolean; data: MarketplaceStats }> {
    return apiRequest('/stats');
  },
};

export default adminMarketplaceService; 