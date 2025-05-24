import { FurnitureItem } from "../types/furniture";
import sofaImage from "../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../assets/IMG-20250208-WA0013.jpg";
import wardrobeImage from "../assets/wardrobe.jpg";
import bedImage from "../assets/bed.jpg";
import fridgeImage from "../assets/fridge.jpg";
import lampImage from "../assets/lamp.jpg";
import deskImage from "../assets/desk.jpg";

// Sample data - in a real app, this would come from an API
const marketplaceItems: FurnitureItem[] = [
  // Bedroom category
  {
    id: 1,
    name: "Queen Size Bed",
    image_url: [bedImage],
    description: "Comfortable queen size bed with wooden frame.",
    price: 350,
    created_at: new Date().toISOString(),
    seller_email: "info@rehome.com",
    city_name: "Amsterdam",
    sold: false,
    isrehome: true,
    category: "Bedroom",
    subcategory: "Bed"
  },
  {
    id: 2,
    name: "Wooden Wardrobe",
    image_url: [wardrobeImage],
    description: "Spacious wooden wardrobe with three doors.",
    price: 280,
    created_at: new Date().toISOString(),
    seller_email: "info@rehome.com",
    city_name: "Utrecht",
    sold: false,
    isrehome: true,
    category: "Bedroom",
    subcategory: "Wardrobe"
  },
  // Sofas and Chairs category
  {
    id: 3,
    name: "Cozy Sofa",
    image_url: [sofaImage],
    description: "A comfortable and stylish sofa for your living room.",
    price: 299,
    created_at: new Date().toISOString(),
    seller_email: "user@example.com",
    city_name: "Rotterdam",
    sold: false,
    isrehome: false,
    category: "Sofas and Chairs",
    subcategory: "Sofa"
  },
  {
    id: 4,
    name: "Modern Office Chair",
    image_url: [chairImage],
    description: "An ergonomic office chair for maximum comfort.",
    price: 199,
    created_at: new Date().toISOString(),
    seller_email: "info@rehome.com",
    city_name: "Amsterdam",
    sold: false,
    isrehome: true,
    category: "Sofas and Chairs",
    subcategory: "Chair"
  },
  // Tables category
  {
    id: 5,
    name: "Wooden Dining Table",
    image_url: [tableImage],
    description: "A sturdy wooden dining table that seats 6 people.",
    price: 399,
    created_at: new Date().toISOString(),
    seller_email: "user2@example.com",
    city_name: "Groningen",
    sold: false,
    isrehome: false,
    category: "Tables",
    subcategory: "Dining Table"
  },
  {
    id: 6,
    name: "Office Desk",
    image_url: [deskImage],
    description: "Modern office desk with drawers for storage.",
    price: 220,
    created_at: new Date().toISOString(),
    seller_email: "info@rehome.com",
    city_name: "Amsterdam",
    sold: false,
    isrehome: true,
    category: "Tables",
    subcategory: "Desk"
  },
  // Appliances category
  {
    id: 7,
    name: "Refrigerator",
    image_url: [fridgeImage],
    description: "Energy-efficient refrigerator with freezer compartment.",
    price: 450,
    created_at: new Date().toISOString(),
    seller_email: "info@rehome.com",
    city_name: "Utrecht",
    sold: false,
    isrehome: true,
    category: "Appliances",
    subcategory: "Fridge"
  },
  // Others category
  {
    id: 8,
    name: "Table Lamp",
    image_url: [lampImage],
    description: "Elegant table lamp with adjustable brightness.",
    price: 75,
    created_at: new Date().toISOString(),
    seller_email: "user3@example.com",
    city_name: "Leiden",
    sold: false,
    isrehome: false,
    category: "Others",
    subcategory: "Lamp"
  }
];

// Available categories
export const categories = [
  "Bedroom",
  "Sofas and Chairs",
  "Tables",
  "Appliances",
  "Others"
];

// Get featured items with balanced category representation
export const getFeaturedItems = (count = 6, excludeCategories: string[] = []): FurnitureItem[] => {
  // Filter out excluded categories
  const availableItems = marketplaceItems.filter(item => 
    !excludeCategories.includes(item.category || '')
  );
  
  // Group items by category
  const itemsByCategory: Record<string, FurnitureItem[]> = {};
  availableItems.forEach(item => {
    if (item.category) {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    }
  });
  
  // Try to get an even distribution from each category
  const result: FurnitureItem[] = [];
  const categoriesArray = Object.keys(itemsByCategory);
  
  // First, get at least one item from each available category
  for (const category of categoriesArray) {
    if (itemsByCategory[category].length > 0) {
      // Get a random item from this category
      const randomIndex = Math.floor(Math.random() * itemsByCategory[category].length);
      result.push(itemsByCategory[category][randomIndex]);
      
      // Remove the selected item to avoid duplicates
      itemsByCategory[category].splice(randomIndex, 1);
      
      // Stop if we've reached the desired count
      if (result.length >= count) {
        break;
      }
    }
  }
  
  // If we still need more items, continue picking randomly from remaining items
  let remainingSlots = count - result.length;
  if (remainingSlots > 0) {
    // Create a flat array of all remaining items
    const remainingItems = categoriesArray.flatMap(category => itemsByCategory[category]);
    
    // Shuffle the remaining items
    for (let i = remainingItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingItems[i], remainingItems[j]] = [remainingItems[j], remainingItems[i]];
    }
    
    // Add as many as needed
    result.push(...remainingItems.slice(0, remainingSlots));
  }
  
  return result;
};

// Get all marketplace items
export const getAllItems = (): FurnitureItem[] => {
  return marketplaceItems;
};

// Get items by category
export const getItemsByCategory = (category: string): FurnitureItem[] => {
  return marketplaceItems.filter(item => item.category === category);
};

// Get ReHome verified items only
export const getReHomeItems = (): FurnitureItem[] => {
  return marketplaceItems.filter(item => item.isrehome);
}; 