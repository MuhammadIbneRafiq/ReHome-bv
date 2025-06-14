import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FurnitureItem } from '../types/furniture';

// Define cart item type with quantity
export interface CartItem extends FurnitureItem {
  quantity: number;
}

// Define cart context type
interface CartContextType {
  items: CartItem[];
  addItem: (item: FurnitureItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

// Create cart context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  totalPrice: 0,
});

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// Cart provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Initialize cart from localStorage or empty array
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const storedItems = localStorage.getItem('cart');
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // Calculate total item count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  // Add item to cart
  const addItem = (newItem: FurnitureItem) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(item => item.id === newItem.id);

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Add new item with quantity 1
        return [...currentItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(currentItems => 
      currentItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 