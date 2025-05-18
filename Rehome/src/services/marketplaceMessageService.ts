import axios from 'axios';
import { toast } from 'react-toastify';
import { io, Socket } from 'socket.io-client';

// Define the API base URL - adjust based on your environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create socket instance
let socket: Socket | null = null;

// Interface for marketplace message
export interface MarketplaceMessage {
  id?: string;
  item_id: number;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  created_at?: string;
  read?: boolean;
}

// Initialize socket connection
const initializeSocket = () => {
  if (!socket) {
    socket = io(API_URL);
    socket.on('connect', () => {
      console.log('Connected to messaging service');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from messaging service');
    });
  }
  return socket;
};

// Fetch messages for a specific item
export const getMessagesByItemId = async (itemId: number): Promise<MarketplaceMessage[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    toast.error('Failed to fetch conversation messages');
    return [];
  }
};

// Fetch messages for a specific user (conversations they're part of)
export const getMessagesByUserId = async (userId: string): Promise<MarketplaceMessage[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user messages:', error);
    toast.error('Failed to fetch your messages');
    return [];
  }
};

// Send a new message
export const sendMessage = async (message: MarketplaceMessage): Promise<MarketplaceMessage | null> => {
  try {
    const response = await axios.post(`${API_URL}/api/messages`, message);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (itemId: number, userId: string): Promise<any> => {
  try {
    const response = await axios.put(`${API_URL}/api/messages/read`, { itemId, userId });
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // Silent error - don't show to user since this is not critical
    return null;
  }
};

// Subscribe to new messages for a specific item
export const subscribeToItemMessages = (itemId: number, callback: (message: MarketplaceMessage) => void) => {
  try {
    const socketInstance = initializeSocket();
    
    // Join the item-specific room
    socketInstance.emit('join_item', itemId);
    
    // Listen for new messages
    socketInstance.on('new_message', (message: MarketplaceMessage) => {
      if (message.item_id === itemId) {
        callback(message);
      }
    });
    
    // Return a cleanup function
    return () => {
      socketInstance.off('new_message');
    };
  } catch (error) {
    console.error('Error subscribing to item messages:', error);
    toast.error('Failed to connect to real-time messages');
    return () => {};
  }
};

// Subscribe to new messages for a specific user
export const subscribeToUserMessages = (userId: string, callback: (message: MarketplaceMessage) => void) => {
  try {
    const socketInstance = initializeSocket();
    
    // Join the user-specific room
    socketInstance.emit('join_user', userId);
    
    // Listen for new messages
    socketInstance.on('new_message', (message: MarketplaceMessage) => {
      if (message.receiver_id === userId) {
        callback(message);
      }
    });
    
    // Return a cleanup function
    return () => {
      socketInstance.off('new_message');
    };
  } catch (error) {
    console.error('Error subscribing to user messages:', error);
    toast.error('Failed to connect to real-time messages');
    return () => {};
  }
}; 