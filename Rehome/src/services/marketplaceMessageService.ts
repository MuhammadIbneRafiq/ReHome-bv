import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

// Create supabase client for this service
const SUPABASE_URL = "https://okkdlbdnfaylakfbycta.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ra2RsYmRuZmF5bGFrZmJ5Y3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MjIzNTIsImV4cCI6MjAyOTA5ODM1Mn0.Zf4DnOscUxz5LxbulHsMMmtyXT7Eoapg50WVgAW_Nig";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Check if the connection to Supabase is working
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('marketplace_messages').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      toast.error('Failed to connect to the message service');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    toast.error('Failed to connect to the message service');
    return false;
  }
};

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

// Interface for payload from Supabase realtime
interface RealtimePayload {
  new: MarketplaceMessage;
  old: MarketplaceMessage;
  eventType: string;
}

// Fetch messages for a specific item
export const getMessagesByItemId = async (itemId: number) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch conversation messages');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    toast.error('Failed to fetch conversation messages');
    return [];
  }
};

// Fetch messages for a specific user (conversations they're part of)
export const getMessagesByUserId = async (userId: string) => {
  try {
    // First make sure the connection works
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) return [];

    // Fix: properly format the query for Supabase's OR filter
    const { data, error } = await supabase
      .from('marketplace_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user messages:', error);
      toast.error('Failed to fetch your messages');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user messages:', error);
    toast.error('Failed to fetch your messages');
    return [];
  }
};

// Send a new message
export const sendMessage = async (message: MarketplaceMessage) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .insert([message])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }

    return data ? data[0] : null;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (itemId: number, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .update({ read: true })
      .eq('item_id', itemId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      // Silent error - don't show to user since this is not critical
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // Silent error
    return null;
  }
};

// Subscribe to new messages for a specific item
export const subscribeToItemMessages = (itemId: number, callback: (message: MarketplaceMessage) => void) => {
  try {
    const channel = supabase
      .channel(`item_${itemId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `item_id=eq.${itemId}`,
        },
        (payload: RealtimePayload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    console.error('Error subscribing to item messages:', error);
    toast.error('Failed to connect to real-time messages');
    return null;
  }
};

// Subscribe to new messages for a specific user
export const subscribeToUserMessages = (userId: string, callback: (message: MarketplaceMessage) => void) => {
  try {
    const channel = supabase
      .channel(`user_${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: RealtimePayload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    console.error('Error subscribing to user messages:', error);
    toast.error('Failed to connect to real-time messages');
    return null;
  }
}; 