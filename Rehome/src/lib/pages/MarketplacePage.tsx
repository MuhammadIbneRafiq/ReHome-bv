import { useState, useEffect } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion, AnimatePresence } from "framer-motion";
import {FurnitureItem} from '../../types/furniture'; // Import the type
import ItemDetailsModal from '@/components/ItemDetailModal'; // Import the modal
import logoImage from '../../assets/logorehome.jpg'
import { useTranslation } from "react-i18next";
import MarketplaceFilter from "../../components/MarketplaceFilter";
import { translateFurnitureItem } from "../utils/dynamicTranslation";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus, FaComments } from 'react-icons/fa';
import { API_ENDPOINTS } from '../api/config';
import useUserStore from '../../services/state/useUserSessionStore';
import { sendMessage } from '../../services/marketplaceMessageService';

const MarketplacePage = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<FurnitureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cart, setCart] = useState<{id: string, quantity: number}[]>([]);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    
    // Chat modal state
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatItem, setChatItem] = useState<FurnitureItem | null>(null);
    const [chatMessage, setChatMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false
    });

    useEffect(() => {
        const fetchFurniture = async (page = 1) => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_ENDPOINTS.FURNITURE.LIST}?page=${page}&limit=20`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const responseData = await response.json();
                
                // Handle both old format (array) and new format (object with data and pagination)
                let data: FurnitureItem[];
                let paginationInfo;
                
                if (Array.isArray(responseData)) {
                    // Old format - just array of items
                    data = responseData;
                    paginationInfo = {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: responseData.length,
                        itemsPerPage: responseData.length,
                        hasNextPage: false,
                        hasPreviousPage: false
                    };
                } else {
                    // New format - object with data and pagination
                    data = responseData.data || [];
                    paginationInfo = responseData.pagination || {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: data.length,
                        itemsPerPage: data.length,
                        hasNextPage: false,
                        hasPreviousPage: false
                    };
                }
                
                console.log('Fetched furniture data:', data);
                console.log('Pagination info:', paginationInfo);
                
                // Ensure proper field mapping for isrehome
                const mappedData = data.map(item => ({
                    ...item,
                    // Ensure isrehome field is properly set from either field name
                    isrehome: item.isrehome ?? (item as any).is_rehome ?? false
                }));
                
                mappedData.forEach((item, index) => {
                    console.log(`Item ${index + 1}:`, {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        pricing_type: (item as any).pricing_type,
                        isrehome: item.isrehome,
                        created_at: (item as any).created_at
                    });
                });
                
                setFurnitureItems(mappedData);
                setFilteredItems(mappedData);
                setPagination(paginationInfo);
                setCurrentPage(page);
            } catch (err: any) {
                console.error('Error fetching furniture:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFurniture(currentPage);
    }, [currentPage]);

    const addToCart = (itemId: string) => {
        // Check if item is from ReHome
        const item = furnitureItems.find(item => item.id === itemId);
        if (!item?.isrehome) {
            toast.error('Only ReHome items can be added to cart. Contact seller directly for user listings.');
            return;
        }

        setIsModalOpen(true);
        setTimeout(() => {
            setCart(prev => {
                const existingItem = prev.find(cartItem => cartItem.id === itemId);
                if (existingItem) {
                    return prev.map(cartItem => 
                        cartItem.id === itemId 
                            ? { ...cartItem, quantity: cartItem.quantity + 1 }
                            : cartItem
                    );
                } else {
                    return [...prev, { id: itemId, quantity: 1 }];
                }
            });
            toast.success('Item added to cart! Check your cart at the bottom right.');
        }, 500); // Simulate a delay
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        setCart(prev => 
            prev.map(item => 
                item.id === itemId 
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const getTotalPrice = () => {
        return cart.reduce((total, cartItem) => {
            const item = furnitureItems.find(item => item.id === cartItem.id);
            return total + (item ? item.price * cartItem.quantity : 0);
        }, 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const handleCheckout = async () => {
        setCheckoutLoading(true);
        
        try {
            const cartItems = cart.map(cartItem => {
                const furnitureItem = furnitureItems.find(item => item.id === cartItem.id);
                return {
                    ...furnitureItem,
                    quantity: cartItem.quantity
                };
            });
            
            const totalAmount = getTotalPrice();
            
            console.log('Creating order:', {
                amount: totalAmount,
                items: cartItems,
            });

            // Create order directly without payment processing
            const orderData = {
                items: cartItems,
                totalAmount: totalAmount,
                orderNumber: `RH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                userId: localStorage.getItem('userId'), // Assuming user ID is stored
                createdAt: new Date().toISOString(),
            };

            // For now, just show success message (you can implement order endpoint later)
            console.log('Order created:', orderData);
            toast.success(`Order created successfully! Order #${orderData.orderNumber}`);
            
            // Clear cart after successful order
            setCart([]);
            setCheckoutLoading(false);
            
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(`Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setCheckoutLoading(false);
        }
    };

    const openModal = (item: FurnitureItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    // Handle status update
    const handleStatusUpdate = async (itemId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            console.log('=== FRONTEND STATUS UPDATE DEBUG ===');
            console.log('📋 Item ID:', itemId);
            console.log('📋 New Status:', newStatus); 
            console.log('📋 Has Token:', !!token);
            console.log('📋 Token length:', token?.length);
            console.log('📋 Token preview:', token?.substring(0, 20) + '...');
            
            const requestBody = { status: newStatus };
            console.log('📋 Request body:', requestBody);
            
            const response = await fetch(API_ENDPOINTS.FURNITURE.UPDATE_STATUS(itemId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📋 Response status:', response.status);
            console.log('📋 Response ok:', response.ok);
            
            // Try to get response body regardless of status
            let responseData;
            try {
                responseData = await response.json();
                console.log('📋 Response data:', responseData);
            } catch (parseError) {
                console.log('❌ Failed to parse response JSON:', parseError);
                responseData = null;
            }

            if (!response.ok) {
                console.log('❌ Request failed with status:', response.status);
                const errorMessage = responseData?.details || responseData?.error || `HTTP ${response.status}`;
                throw new Error(errorMessage);
            }

            console.log('✅ Status update successful');

            // Update the local state
            setFurnitureItems(prevItems => 
                prevItems.map(item => 
                    item.id === itemId 
                        ? { ...item, status: newStatus, sold: newStatus === 'sold' }
                        : item
                )
            );

            // Show success message
            toast.success(`Item status updated to ${newStatus}`);
            
        } catch (error) {
            console.error('❌ Error updating status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Failed to update item status: ${errorMessage}`);
        }
    };

    // Translate furniture items
    const translatedItems = filteredItems.map(item => {
        const translated = translateFurnitureItem(item);
        const result = {
            ...item,
            name: translated.name,
            description: translated.description
        };
        
        // Debug: Check if isrehome field is preserved
        if (item.isrehome) {
            console.log('Item with isrehome=true:', {
                originalItem: item,
                translatedResult: result,
                isrehomePreserved: result.isrehome
            });
        }
        
        return result;
    });

    // Handle filter changes
    const handleFilterChange = (newFilteredItems: FurnitureItem[]) => {
        setFilteredItems(newFilteredItems);
    };

    // Handle search
    const handleSearch = (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setFilteredItems(furnitureItems);
            return;
        }
        
        const searchResults = furnitureItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setFilteredItems(searchResults);
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handle chat with seller
    const handleChatWithSeller = (item: FurnitureItem, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the item modal
        
        if (!user) {
            navigate('/login?redirect=back');
            return;
        }

        // Don't allow chatting with yourself
        if (item.seller_email === user.email) {
            toast.info("You can't chat with yourself as the seller");
            return;
        }

        // Set chat item and default message
        setChatItem(item);
        setChatMessage(`Hi, I'm interested in your item: ${item.name}`);
        setShowChatModal(true);
    };

    // Handle sending chat message
    const handleSendChatMessage = async () => {
        if (!chatMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        if (!user || !chatItem) {
            toast.error("You must be logged in to send messages");
            return;
        }

        try {
            setIsSendingMessage(true);
            await sendMessage({
                item_id: chatItem.id,
                content: chatMessage.trim(),
                sender_id: user.email,
                sender_name: user.email,
                receiver_id: chatItem.seller_email
            });
            
            // Close modal and redirect to chat dashboard
            setShowChatModal(false);
            navigate('/sell-dash', { state: { activeTab: 'chats', activeItemId: chatItem.id } });
            toast.success("Message sent successfully!");
            
            // Reset chat state
            setChatItem(null);
            setChatMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error("Failed to send message. Please try again later.");
        } finally {
            setIsSendingMessage(false);
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 pt-24 pb-12">
            <AnimatePresence mode="wait">
                {isModalOpen && (
                    <ItemDetailsModal
                        key="item-details-modal"
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        item={selectedItem || null}
                        onAddToCart={addToCart}
                        onUpdateStatus={handleStatusUpdate}
                        showStatusIndicator={false} // Don't show status in marketplace
                    />
                )}
            </AnimatePresence>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('marketplace.title')}</h1>
                <p className="text-lg text-gray-600 mb-8">{t('marketplace.subtitle')}</p>
                
                {/* Create Listing Button - Moved to top */}
                <div className="mb-8 bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-medium text-lg">Sell Your Items</h3>
                            <p className="text-sm text-gray-600">Create a new listing to sell your pre-loved items</p>
                        </div>
                        <Link 
                            to={isAuthenticated ? '/sell-dash' : '/login?redirect=/sell-dash'}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                        >
                            Create Listing
                        </Link>
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500">{error}</div>
                ) : (
                    <div>
                        {/* Search and Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Filter and Search on Left */}
                            <div className="md:col-span-1">
                                <MarketplaceSearch onSearch={handleSearch} items={furnitureItems} />
                                <MarketplaceFilter 
                                    items={furnitureItems} 
                                    onFilterChange={handleFilterChange} 
                                />
                            </div>

                            {/* Featured Listings on Right */}
                            <div className="md:col-span-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4">
                                <h2 className="text-xl font-semibold text-white mb-2">{t('marketplace.featuredItems')}</h2>
                                
                                {filteredItems.length === 0 ? (
                                    <p className="text-white py-4 text-center">{t('marketplace.noResults')}</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {translatedItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                className="bg-[#f3e4d6] shadow-lg rounded-lg p-2 hover:scale-105 transition-transform cursor-pointer relative"
                                                whileHover={{ scale: 1.05 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal(item);
                                                }}
                                            >
                                                {/* ReHome logo badge for ReHome items */}
                                                {(() => {
                                                    console.log(`Item ${item.name} - isrehome check:`, {
                                                        isrehome: item.isrehome,
                                                        type: typeof item.isrehome,
                                                        truthyCheck: !!item.isrehome,
                                                        showIcon: !!item.isrehome
                                                    });
                                                    return item.isrehome;
                                                })() && (
                                                    <img 
                                                        src={logoImage} 
                                                        alt="ReHome Verified" 
                                                        className="absolute top-2 left-2 z-10 w-8 h-8 object-contain m-0 p-0"
                                                        style={{display: 'block'}}
                                                    />
                                                )}
                                                <img 
                                                    src={(item.image_url && item.image_url.length > 0) ? item.image_url[0] : 
                                                         (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0]
                                                         : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                                    alt={item.name}
                                                    className="w-full h-32 object-cover rounded-md mb-1"
                                                    onError={(e) => {
                                                        console.error(`Failed to load image for ${item.name}:`, item.image_url?.[0] || item.image_urls?.[0]);
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                                    }}
                                                    onLoad={() => {
                                                        console.log(`Successfully loaded image for ${item.name}:`, item.image_url?.[0] || item.image_urls?.[0]);
                                                    }}
                                                />
                                                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                                                <p className="text-gray-600 text-xs line-clamp-2 h-8">{item.description}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-red-500 font-bold text-xs">
                                                        {item.price === 0 ? 'Free' : `€${item.price}`}
                                                    </p>
                                                    {/* Chat with Seller Button */}
                                                    {item.seller_email !== user?.email && (
                                                        <button
                                                            onClick={(e) => handleChatWithSeller(item, e)}
                                                            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors"
                                                            title="Chat with Seller"
                                                        >
                                                            <FaComments size={10} />
                                                            Chat
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Pagination Controls */}
                                {pagination.totalPages > 1 && (
                                    <div className="mt-6 flex justify-center items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={!pagination.hasPreviousPage}
                                            className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                                            if (page > pagination.totalPages) return null;
                                            
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-2 text-sm rounded-md ${
                                                        page === currentPage
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                        
                                        <span className="text-sm text-gray-600 ml-4">
                                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Checkout Button (Displayed conditionally) */}
            {cart.length > 0 && (
                <div className="fixed bottom-4 right-4">
                    <button
                        onClick={() => setIsCartDrawerOpen(true)}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition duration-300"
                    >
                        <span className="mr-2">🛒</span>
                        Cart ({getTotalItems()}) - €{getTotalPrice().toFixed(2)}
                    </button>
                </div>
            )}

            {/* Cart Drawer */}
            {isCartDrawerOpen && (
                <>
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsCartDrawerOpen(false)}
                    />

                    {/* Cart Drawer */}
                    <div className="fixed top-0 right-0 h-screen w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
                        {/* Header */}
                        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center">
                                <FaShoppingCart className="mr-2" /> Shopping Cart
                            </h2>
                            <button 
                                onClick={() => setIsCartDrawerOpen(false)}
                                className="p-1 rounded-full hover:bg-orange-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Cart Content */}
                        <div className="flex flex-col h-[calc(100%-14rem)] overflow-y-auto p-4">
                            {cart.map(cartItem => {
                                const item = furnitureItems.find(item => item.id === cartItem.id);
                                if (!item) return null;
                                
                                return (
                                    <div key={item.id} className="border-b border-gray-200 py-4">
                                        <div className="flex mb-2">
                                            <img 
                                                src={(item.image_url && item.image_url[0]) || (item.image_urls && item.image_urls[0]) || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                                                alt={item.name} 
                                                className="w-20 h-20 object-cover rounded"
                                                onError={(e) => {
                                                    console.error(`Failed to load cart image for ${item.name}:`, item.image_url?.[0] || item.image_urls?.[0]);
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                                }}
                                            />
                                            <div className="ml-4 flex-grow">
                                                <h3 className="text-sm font-medium">{item.name}</h3>
                                                <p className="text-orange-600 font-medium">
                                                    {item.price === 0 ? 'Free' : `€${item.price}`}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                        
                                        {/* Quantity Controls */}
                                        <div className="flex justify-end items-center">
                                            <div className="flex items-center border rounded-md">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                                >
                                                    <FaMinus size={10} />
                                                </button>
                                                <span className="px-3 py-1 text-sm">{cartItem.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                                    className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                                                >
                                                    <FaPlus size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="flex justify-between mb-4">
                                <span className="text-gray-600">Total ({getTotalItems()} items)</span>
                                <span className="font-semibold">€{getTotalPrice().toFixed(2)}</span>
                            </div>
                            <button 
                                className="w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300"
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Chat Modal */}
            <AnimatePresence>
                {showChatModal && chatItem && (
                    <motion.div 
                        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                    <motion.div 
                        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 relative"
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                    >
                        <button 
                            className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-xl" 
                            onClick={() => setShowChatModal(false)}
                        >
                            &times;
                        </button>
                        <h3 className="text-lg font-bold mb-4 text-blue-700">
                            Chat with Seller
                        </h3>
                        <div className="mb-4">
                            <div className="bg-gray-100 p-3 rounded-lg mb-4">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={(chatItem.image_url && chatItem.image_url[0]) || (chatItem.image_urls && chatItem.image_urls[0]) || '/placeholder-image.jpg'}
                                        alt={chatItem.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-sm">{chatItem.name}</h4>
                                        <p className="text-orange-600 font-bold text-sm">
                                            {chatItem.price === 0 ? 'Free' : `€${chatItem.price}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <label className="block text-gray-700 mb-2 font-medium">
                                Your message
                            </label>
                            <textarea
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Write your message here..."
                                disabled={isSendingMessage}
                            />
                        </div>
                        <div className="flex justify-between">
                            <button 
                                type="button" 
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                                onClick={() => setShowChatModal(false)}
                                disabled={isSendingMessage}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" 
                                onClick={handleSendChatMessage}
                                disabled={isSendingMessage || !chatMessage.trim()}
                            >
                                {isSendingMessage ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketplacePage;