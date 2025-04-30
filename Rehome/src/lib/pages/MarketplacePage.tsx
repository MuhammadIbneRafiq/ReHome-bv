import { useState, useEffect } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion, AnimatePresence } from "framer-motion";
import {FurnitureItem} from '../../types/furniture'; // Import the type
import ItemDetailsModal from '@/components/ItemDetailModal'; // Import the modal
import tickLogo from '../../assets/logo_marketplace.png'
import { useTranslation } from "react-i18next";
import MarketplaceFilter from "../../components/MarketplaceFilter";
import { translateFurnitureItem } from "../utils/dynamicTranslation";

const MarketplacePage = () => {
    const { t } = useTranslation();
    const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]); // Use any[] or create a type for your furniture data
    const [filteredItems, setFilteredItems] = useState<FurnitureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<number[]>([]); // Simple cart (array of item IDs)
    const [_, setIsAddingToCart] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);

    useEffect(() => {
        const fetchFurniture = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('https://rehome-backend.vercel.app/api/furniture'); // Use Vercel backend
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FurnitureItem[] = await response.json();
                console.log('Fetched furniture data:', data); // Log the fetched data
                setFurnitureItems(data);
                setFilteredItems(data);
            } catch (err: any) {
                console.error('Error fetching furniture:', err);
                setError(err.message || 'Failed to fetch furniture items.');
            } finally {
                setLoading(false);
            }
        };

        fetchFurniture();
    }, []);

    const addToCart = (itemId: number) => {
        setIsAddingToCart(true);
        setTimeout(() => {
            setCart(prev => [...prev, itemId]);
            setIsAddingToCart(false);
        }, 500); // Simulate a delay
    };

    const handleCheckout = () => {
        setCheckoutLoading(true);
        // Simulate checkout process
        setTimeout(() => {
            alert(`Checkout completed for ${cart.length} items!`);
            setCart([]);
            setCheckoutLoading(false);
        }, 2000);
    };

    const openModal = (item: FurnitureItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    // Translate furniture items
    const translatedItems = filteredItems.map(item => {
        const translated = translateFurnitureItem(item);
        return {
            ...item,
            name: translated.name,
            description: translated.description
        };
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
            <ItemDetailsModal
                isOpen={isModalOpen}
                onClose={closeModal}
                item={selectedItem}
                onAddToCart={addToCart}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('marketplace.title')}</h1>
                <p className="text-lg text-gray-600 mb-8">{t('marketplace.subtitle')}</p>
                
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
                                <h3 className="text-xl font-semibold mb-4">Create listing:</h3>
                                <p className="text-sm mb-4">Similar to <a href="https://www.marktplaats.nl" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Marktplaats</a></p>
                                
                                <div className="mb-6 bg-white rounded-lg shadow p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium">Sell Your Items</h4>
                                        <button 
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                                            onClick={() => window.location.href = '/sell-dash'}
                                        >
                                            Create Listing
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600">Create a new listing to sell your pre-loved items</p>
                                </div>
                                
                                <MarketplaceSearch onSearch={handleSearch} />
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
                                                className="bg-[#f3e4d6] shadow-lg rounded-lg p-2 hover:scale-105 transition-transform cursor-pointer"
                                                whileHover={{ scale: 1.05 }}
                                                onClick={() => openModal(item)}
                                            >
                                                {item.isrehome === true ? (
                                                    <div className="flex justify-center mb-2">
                                                        <img src={tickLogo} alt="Verified" className="h-8 w-auto" />
                                                    </div>
                                                ) : null}
                                                <img
                                                    src={item.image_url && item.image_url.length > 0 ? item.image_url[0] : ''}
                                                    alt={item.name}
                                                    className="w-full h-32 object-cover rounded-md mb-1"
                                                />
                                                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                                                <p className="text-gray-600 text-xs">{item.description}</p>
                                                <p className="text-red-500 font-bold text-xs">€{item.price}</p>
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
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                        className={`flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition duration-300 ${
                            checkoutLoading ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                        <AnimatePresence>
                            {checkoutLoading ? (
                                <motion.span
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="mr-2"
                                >
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="cart"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="mr-2"
                                >
                                    🛒
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {checkoutLoading ? t('marketplace.processing') : `${t('marketplace.checkout')} (${cart.length})`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarketplacePage;