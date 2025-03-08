export interface FurnitureItem {
    id: number;
    name: string;
    description: string;
    image_url: string[];
    price: number;
    created_at: string;
    seller_email: string;
    city_name: string;
    sold: boolean;
    isrehome?: boolean;
} 