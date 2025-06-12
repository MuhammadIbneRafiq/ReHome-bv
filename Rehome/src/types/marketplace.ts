// Marketplace TypeScript Interfaces

export interface MarketplaceFurnitureItem {
    id: number | string;
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    condition_rating?: number; // 1-5 scale
    
    // Dimensions (optional)
    height_cm?: number;
    width_cm?: number;
    depth_cm?: number;
    
    // Pricing options
    pricing_type: 'fixed' | 'bidding' | 'negotiable';
    price?: number; // For fixed price
    starting_bid?: number; // For bidding
    
    // Flexible date options
    has_flexible_dates?: boolean;
    flexible_date_start?: string; // ISO date string
    flexible_date_end?: string;   // ISO date string
    preferred_date?: string;      // ISO date string
    
    image_url: string[]; // Array of image URLs
    city_name: string;
    postcode?: string;
    seller_email: string;
    sold: boolean;
    is_rehome?: boolean;
    base_charge?: number; // For flexible pricing
    created_at: string;
    updated_at: string;
    views_count?: number;
    featured?: boolean;
    latitude?: number;
    longitude?: number;
    distance_km?: number; // Calculated field for distance searches
}

export interface CategoryStructure {
    name: string;
    subcategories: string[];
}

export interface ConditionOption {
    value: string;
    label: string;
}

export interface MarketplaceFilters {
    category?: string;
    subcategory?: string;
    condition?: string;
    priceRange?: [number, number];
    city?: string;
    distance?: number;
    location?: {
        lat: number;
        lon: number;
    };
    isRehomeOnly?: boolean;
    flexibleDate?: boolean;
}

export interface SearchParameters {
    query?: string;
    filters?: MarketplaceFilters;
    sortBy?: 'price' | 'created_at' | 'distance' | 'views_count';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export interface MarketplaceSearchResult {
    items: MarketplaceFurnitureItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

export interface CreateListingRequest {
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    conditionRating?: number;
    
    // Dimensions (optional)
    height?: number;
    width?: number;
    depth?: number;
    
    // Pricing
    pricingType: 'fixed' | 'bidding' | 'negotiable';
    price?: number;
    startingBid?: number;
    
    imageUrl: string[];
    cityName: string;
    latitude?: number;
    longitude?: number;
}

export interface UpdateListingRequest extends CreateListingRequest {
    // Same fields as create
}

// API Response interfaces
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface MarketplaceApiResponse extends ApiResponse<MarketplaceFurnitureItem[]> {
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

export interface SingleItemApiResponse extends ApiResponse<MarketplaceFurnitureItem> {}

export interface CategoriesApiResponse extends ApiResponse<CategoryStructure[]> {}

// Location interfaces
export interface LocationSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    place_id: string;
    address?: {
        house_number?: string;
        road?: string;
        city?: string;
        postcode?: string;
        country?: string;
    };
}

export interface LocationCache {
    [key: string]: {
        lat: number;
        lon: number;
        postcode?: string;
        city?: string;
        verified: boolean;
    };
}

// Form interfaces
export interface MarketplaceFormData {
    name: string;
    description: string;
    category: string;
    subcategory: string;
    conditionRating: string;
    price: string;
    cityName: string;
    photos: File[];
}

export interface EditFormData extends MarketplaceFormData {
    existingImages: string[];
}

// Component prop interfaces
export interface MarketplaceFilterProps {
    items: MarketplaceFurnitureItem[];
    onFilterChange: (filteredItems: MarketplaceFurnitureItem[]) => void;
}

export interface ItemCardProps {
    item: MarketplaceFurnitureItem;
    onEdit?: (item: MarketplaceFurnitureItem) => void;
    onDelete?: (id: number | string) => void;
    onView?: (item: MarketplaceFurnitureItem) => void;
    showActions?: boolean;
}

export interface ItemDetailsModalProps {
    item: MarketplaceFurnitureItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart?: (item: MarketplaceFurnitureItem) => void;
}

// Utility type for partial updates
export type PartialMarketplaceItem = Partial<MarketplaceFurnitureItem> & {
    id: number | string;
};

// Pricing type options
export const PRICING_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'bidding', label: 'Bidding/Auction' },
    { value: 'negotiable', label: 'Price Negotiable' }
] as const;

// Pricing types for ReHome listings (no bidding allowed)
export const REHOME_PRICING_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'negotiable', label: 'Price Negotiable' }
] as const;

export type PricingType = typeof PRICING_TYPES[number]['value']; 