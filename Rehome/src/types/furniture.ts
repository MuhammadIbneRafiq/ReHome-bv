// src/types/furniture.ts

export type FurnitureItem = {
    id: string; // Always UUID string now
    name: string;
    description: string;
    image_url?: string[]; // Legacy field name
    image_urls?: string[]; // New database field name
    price: number;
    created_at: string;
    seller_email: string;
    city_name: string;
    sold: boolean;
    status?: string; // New status field: available, reserved, sold
    isrehome: boolean;
    condition?: string; // Condition rating (1-5)
    category?: string; // Main category (Furniture, Electronics, etc.)
    subcategory?: string; // Subcategory (Sofa, Table, etc.)
    dimensions?: {
        height?: number;
        width?: number;
        depth?: number;
    };
    listing_type?: 'free' | 'fixed' | 'bid'; // Price type
}