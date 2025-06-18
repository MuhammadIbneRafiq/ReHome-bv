import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : 'https://rehome-backend.vercel.app');

// List of admin email addresses - keep in sync with other admin files
const ADMIN_EMAILS = [
  'muhammadibnerafiq@gmail.com',
  'testnewuser12345@gmail.com',
  'egzmanagement@gmail.com',
  'samuel.stroehle8@gmail.com',
  'info@rehomebv.com'
];

// Helper function to check if user is admin
const isAdmin = (userEmail: string): boolean => {
  return ADMIN_EMAILS.includes(userEmail);
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    console.log('🔗 API Call Debug:', {
        endpoint: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        hasToken: !!(localStorage.getItem('accessToken') || localStorage.getItem('token')),
        body: options.body
    });

    // Get authentication token
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API Error Response Text:', errorText);
        
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { error: `HTTP ${response.status}: ${errorText || 'Network error'}` };
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('✅ API Success Response:', responseData);
    return responseData;
};

// Interfaces for bidding system
export interface MarketplaceBid {
    id?: string;
    item_id: number | string;
    bidder_email: string;
    bidder_name: string;
    bid_amount: number;
    created_at?: string;
    updated_at?: string;
    is_highest?: boolean; // Simple flag to indicate if this is the highest bid
}

export interface BidConfirmation {
    id?: string;
    item_id: number;
    bidder_email: string;
    bid_id: string;
    confirmation_status: 'pending' | 'confirmed' | 'cancelled';
    confirmed_by?: string;
    confirmed_at?: string;
    order_number?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BidWithItemDetails extends MarketplaceBid {
    item_name?: string;
    item_image_url?: string;
    item_price?: number;
    seller_email?: string;
}

// Place a new bid and automatically send chat message
export const placeBid = async (bid: Omit<MarketplaceBid, 'id' | 'created_at' | 'updated_at'>, itemName?: string): Promise<MarketplaceBid | null> => {
    try {
        console.log('=== PLACING BID DEBUG ===');
        console.log('📋 Bid data:', bid);
        console.log('📋 Item name:', itemName);
        
        // Simple bid data - no status needed, works like chat
        const bidData = {
            item_id: bid.item_id,
            bidder_email: bid.bidder_email,
            bidder_name: bid.bidder_name,
            bid_amount: bid.bid_amount
        };

        console.log('📋 Final bid data:', bidData);
        
        const result = await apiCall('/api/bids', {
            method: 'POST',
            body: JSON.stringify(bidData),
        });

        console.log('📋 API response:', result);

        if (result.success) {
            console.log('✅ Bid placed successfully, sending chat message...');
            
            // Automatically send a chat message about the bid
            try {
                await sendBidChatMessage(bid.item_id, bid.bidder_email, bid.bid_amount, itemName || 'this item');
                console.log('✅ Bid chat message sent successfully');
            } catch (chatError) {
                console.warn('❌ Failed to send bid chat message:', chatError);
                // Don't fail the entire bid if chat message fails
            }

            toast.success(result.message || 'Bid placed successfully!');
            return result.data;
        } else {
            console.log('❌ Bid placement failed:', result.error);
            toast.error(result.error || 'Failed to place bid');
            return null;
        }
    } catch (error) {
        console.error('❌ Error placing bid:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to place bid');
        throw error;
    }
};

// Helper function to send chat message when bid is placed
const sendBidChatMessage = async (itemId: number | string, bidderEmail: string, bidAmount: number, itemName: string): Promise<void> => {
    try {
        console.log('=== SENDING BID CHAT MESSAGE ===');
        console.log('📋 Item ID:', itemId);
        console.log('📋 Bidder Email:', bidderEmail);
        console.log('📋 Bid Amount:', bidAmount);
        console.log('📋 Item Name:', itemName);
        
        const messageContent = `Hi! I've placed a bid of €${bidAmount} for "${itemName}". I'm interested in purchasing this item. Please let me know if you'd like to discuss further!`;
        
        console.log('📋 Message content:', messageContent);
        
        // Import and use the chat service
        const { sendMessage } = await import('../services/marketplaceMessageService');
        
        // Create message object with proper structure
        const messageData = {
            item_id: String(itemId),
            sender_id: bidderEmail,
            sender_name: bidderEmail,
            receiver_id: 'seller', // Will be resolved by backend to actual seller
            content: messageContent
        };
        
        console.log('📋 Message data:', messageData);
        
        await sendMessage(messageData);
        console.log('✅ Bid chat message sent successfully');
    } catch (error) {
        console.error('❌ Error sending bid chat message:', error);
        throw error;
    }
};

// Get all bids for a specific item
export const getBidsByItemId = async (itemId: number | string): Promise<MarketplaceBid[]> => {
    try {
        console.log('📋 Fetching all bids for item:', itemId);
        const data = await apiCall(`/api/bids/${itemId}`);
        console.log('📋 All bids response:', data);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching bids:', error);
        return [];
    }
};

// Get highest bid for an item
export const getHighestBidForItem = async (itemId: number | string): Promise<MarketplaceBid | null> => {
    try {
        console.log('📋 Fetching highest bid for item:', itemId);
        const data = await apiCall(`/api/bids/${itemId}/highest`);
        console.log('📋 Highest bid response:', data);
        return data || null;
    } catch (error) {
        console.error('❌ Error fetching highest bid:', error);
        return null;
    }
};

// Get user's bid for a specific item
export const getUserBidForItem = async (itemId: number | string, userEmail: string): Promise<MarketplaceBid | null> => {
    try {
        const data = await apiCall(`/api/bids/${itemId}/user/${encodeURIComponent(userEmail)}`);
        return data || null;
    } catch (error) {
        console.error('Error fetching user bid:', error);
        return null;
    }
};

// Get all bids by user
export const getBidsByUser = async (userEmail: string): Promise<BidWithItemDetails[]> => {
    try {
        const data = await apiCall(`/api/bids/user/${encodeURIComponent(userEmail)}`);
        return data || [];
    } catch (error) {
        console.error('Error fetching user bids:', error);
        return [];
    }
};

// Admin functions
export const getAllBidsForAdmin = async (): Promise<BidWithItemDetails[]> => {
    try {
        const data = await apiCall('/api/admin/bids');
        return data || [];
    } catch (error) {
        console.error('Error fetching all bids:', error);
        return [];
    }
};

// Approve a bid (admin only)
export const approveBid = async (bidId: string, adminEmail: string, adminNotes?: string): Promise<boolean> => {
    try {
        // Check if user is admin
        if (!isAdmin(adminEmail)) {
            toast.error('Admin access required');
            return false;
        }

        const result = await apiCall(`/api/admin/bids/${bidId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ admin_notes: adminNotes }),
        });

        if (result.success) {
            toast.success(result.message || 'Bid approved successfully!');
            return true;
        } else {
            toast.error(result.error || 'Failed to approve bid');
            return false;
        }
    } catch (error) {
        console.error('Error approving bid:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to approve bid');
        return false;
    }
};

// Reject a bid (admin only)
export const rejectBid = async (bidId: string, adminEmail: string, adminNotes?: string): Promise<boolean> => {
    try {
        // Check if user is admin
        if (!isAdmin(adminEmail)) {
            toast.error('Admin access required');
            return false;
        }

        const result = await apiCall(`/api/admin/bids/${bidId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ admin_notes: adminNotes }),
        });

        if (result.success) {
            toast.success(result.message || 'Bid rejected successfully!');
            return true;
        } else {
            toast.error(result.error || 'Failed to reject bid');
            return false;
        }
    } catch (error) {
        console.error('Error rejecting bid:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to reject bid');
        return false;
    }
};

// Create bid confirmation for ReHome items
export const createBidConfirmation = async (
    itemId: number, 
    bidderEmail: string, 
    bidId: string
): Promise<BidConfirmation | null> => {
    try {
        const orderNumber = `RH-BID-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        const { data, error } = await supabase
            .from('marketplace_bid_confirmations')
            .insert([{
                item_id: itemId,
                bidder_email: bidderEmail,
                bid_id: bidId,
                confirmation_status: 'pending',
                order_number: orderNumber,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating bid confirmation:', error);
        return null;
    }
};

// Confirm bid (admin only)
export const confirmBid = async (confirmationId: string, adminEmail: string): Promise<boolean> => {
    try {
        // Check if user is admin
        if (!isAdmin(adminEmail)) {
            toast.error('Admin access required');
            return false;
        }
        const { error } = await supabase
            .from('marketplace_bid_confirmations')
            .update({
                confirmation_status: 'confirmed',
                confirmed_by: adminEmail,
                confirmed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', confirmationId)
            .select()
            .single();

        if (error) throw error;
        toast.success('Bid confirmed successfully!');
        return true;
    } catch (error) {
        console.error('Error confirming bid:', error);
        toast.error('Failed to confirm bid');
        return false;
    }
};

// Get bid confirmations (admin only)
export const getBidConfirmations = async (): Promise<BidConfirmation[]> => {
    try {
        const { data, error } = await supabase
            .from('marketplace_bid_confirmations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching bid confirmations:', error);
        return [];
    }
};

// Check if user can add item to cart
export const canAddToCart = async (itemId: number | string, userEmail: string): Promise<{ canAdd: boolean; message: string }> => {
    try {
        const data = await apiCall(`/api/bids/${itemId}/cart-eligibility/${encodeURIComponent(userEmail)}`);
        return data || { canAdd: false, message: 'Unable to check cart eligibility' };
    } catch (error) {
        console.error('Error checking cart eligibility:', error);
        return { canAdd: false, message: 'Error checking bid status. Please try again.' };
    }
};

// Subscribe to bid updates - Update to handle both number and string IDs
export const subscribeToBidUpdates = (itemId: number | string, callback: (bids: MarketplaceBid[]) => void) => {
    // Convert to string for consistent handling
    const itemIdStr = String(itemId);
    
    // Set up real-time subscription using Supabase
    const subscription = supabase
        .channel(`marketplace_bids_${itemIdStr}`)
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'marketplace_bids',
                filter: `item_id=eq.${itemIdStr}`
            }, 
            (payload) => {
                console.log('Bid change detected:', payload);
                // Refetch bids when changes occur
                getBidsByItemId(itemId).then(callback);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
};

// Admin function to refresh highest bid status for all items
export const refreshHighestBidStatus = async (adminEmail: string): Promise<boolean> => {
    try {
        // Check if user is admin
        if (!isAdmin(adminEmail)) {
            toast.error('Admin access required');
            return false;
        }

        const result = await apiCall('/api/admin/bids/refresh-highest', {
            method: 'POST',
        });

        if (result.success) {
            toast.success(result.message || 'Highest bid status refreshed successfully!');
            return true;
        } else {
            toast.error(result.error || 'Failed to refresh highest bid status');
            return false;
        }
    } catch (error) {
        console.error('Error refreshing highest bid status:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to refresh highest bid status');
        return false;
    }
}; 