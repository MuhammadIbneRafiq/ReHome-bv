import { toast } from 'react-toastify';
import { supabase } from '../lib/supabaseClient';

// Interface for marketplace message
export interface MarketplaceMessage {
    id?: string;
    item_id: string; // Always UUID string now, matching marketplace_furniture
    sender_id: string;
    sender_name: string;
    receiver_id: string;
    content: string;
    created_at?: string;
    read?: boolean;
}

// Fetch messages for a specific item
export const getMessagesByItemId = async (itemId: string): Promise<MarketplaceMessage[]> => {
    try {
        const { data, error } = await supabase
            .from('marketplace_messages')
            .select('*')
            .eq('item_id', itemId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch conversation messages');
        return [];
    }
};

// Fetch messages for a specific user (conversations they're part of)
export const getMessagesByUserId = async (userId: string): Promise<MarketplaceMessage[]> => {
    try {
        const { data, error } = await supabase
            .from('marketplace_messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user messages:', error);
        toast.error('Failed to fetch your messages');
        return [];
    }
};

// Send a new message
export const sendMessage = async (message: MarketplaceMessage): Promise<MarketplaceMessage | null> => {
    try {
        const { data, error } = await supabase
            .from('marketplace_messages')
            .insert([{
                ...message,
                created_at: new Date().toISOString(),
                read: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        throw error;
    }
};

// Mark messages as read
export const markMessagesAsRead = async (itemId: string, userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('marketplace_messages')
            .update({ read: true })
            .eq('item_id', itemId)
            .eq('receiver_id', userId)
            .eq('read', false);

        if (error) throw error;
    } catch (error) {
        console.error('Error marking messages as read:', error);
        // Silent error - don't show to user since this is not critical
    }
};

// Subscribe to new messages for a specific item
export const subscribeToItemMessages = (itemId: string, callback: (message: MarketplaceMessage) => void) => {
    const subscription = supabase
        .channel(`item:${itemId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'marketplace_messages',
            filter: `item_id=eq.${itemId}`
        }, (payload) => {
            callback(payload.new as MarketplaceMessage);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
};

// Subscribe to new messages for a specific user
export const subscribeToUserMessages = (userId: string, callback: (message: MarketplaceMessage) => void) => {
    const subscription = supabase
        .channel(`user:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'marketplace_messages',
            filter: `receiver_id=eq.${userId}`
        }, (payload) => {
            callback(payload.new as MarketplaceMessage);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}; 