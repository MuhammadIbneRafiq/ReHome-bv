// src/types/furniture.ts

export type FurnitureItem = {
    id: number; // You may want to add this if you have an ID for each item
    name: string;
    description: string;
    image_url: string[];
    price: number;
    created_at: string;
    seller_email: string;
    city_name: string;
    sold: boolean;
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