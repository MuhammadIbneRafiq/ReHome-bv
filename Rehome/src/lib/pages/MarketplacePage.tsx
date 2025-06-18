import { useState, useEffect } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion, AnimatePresence } from "framer-motion";
import {FurnitureItem} from '../../types/furniture'; // Import the type
import ItemDetailsModal from '@/components/ItemDetailModal'; // Import the modal
import logoImage from '../../assets/logorehome.jpg'
import { useTranslation } from "react-i18next";
import MarketplaceFilter from "../../components/MarketplaceFilter";
import { translateFurnitureItem } from "../utils/dynamicTranslation";
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaTimes, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { API_ENDPOINTS } from '../api/config';

const MarketplacePage = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]); // Use any[] or create a type for your furniture data
    const [filteredItems, setFilteredItems] = useState<FurnitureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<{id: string, quantity: number}[]>([]); // Cart with string IDs
    const [_, setIsAddingToCart] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchFurniture = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(API_ENDPOINTS.FURNITURE.LIST);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FurnitureItem[] = await response.json();
                console.log('Fetched furniture data:', data); // Log the fetched data
                console.log('Debug - checking isrehome field for each item:');
                
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
                        isrehome: item.isrehome,
                        is_rehome: (item as any).is_rehome, // Check if the underscore version exists
                        hasIsRehomeField: 'isrehome' in item,
                        hasIsRehomeUnderscore: 'is_rehome' in item,
                        finalIsRehomeValue: item.isrehome
                    });
                });
                
                setFurnitureItems(mappedData);
                setFilteredItems(mappedData);
            } catch (err: any) {
                console.error('Error fetching furniture and not displaying the mock', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFurniture();
    }, []);

    const addToCart = (itemId: string) => {
        // Check if item is from ReHome
        const item = furnitureItems.find(item => item.id === itemId);
        if (!item?.isrehome) {
            toast.error('Only ReHome items can be added to cart. Contact seller directly for user listings.');
            return;
        }

        setIsAddingToCart(true);
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
            setIsAddingToCart(false);
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
            
            const response = await fetch(`https://rehome-backend.vercel.app/api/furniture/${itemId}/status`, {
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
                                                onClick={() => openModal(item)}
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
                                                    <div className="absolute top-2 left-2 z-10 bg-white p-1 rounded-md shadow-md">
                                                        <img 
                                                            src={logoImage} 
                                                            alt="ReHome Verified" 
                                                            className="w-8 h-8 object-contain" 
                                                        />
                                                    </div>
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
                                                <p className="text-gray-600 text-xs">{item.description}</p>
                                                <p className="text-red-500 font-bold text-xs">
                                                    {item.price === 0 ? 'Free' : `€${item.price}`}
                                                </p>
                                            </motion.div>
                                        ))}
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
        </div>
    );
};

export default MarketplacePage;