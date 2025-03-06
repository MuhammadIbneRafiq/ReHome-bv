// src/types/furniture.ts

export type FurnitureItem ={
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
}