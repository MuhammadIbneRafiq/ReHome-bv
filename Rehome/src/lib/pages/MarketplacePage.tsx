import { useState, useEffect } from 'react';
import MarketplaceSearch from '../../components/MarketplaceSearch';
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa"; // Import cart icon

const MarketplacePage = () => {
    const [furnitureItems, setFurnitureItems] = useState<any[]>([]); // Use any[] or create a type for your furniture data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<number[]>([]); // Simple cart (array of item IDs)
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        const fetchFurniture = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3000/api/furniture'); // Adjust the URL if your backend port is different
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Furniture data:', data); // Debug: Check the fetched data
                setFurnitureItems(data);
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
            setCart([...cart, itemId]);
            setIsAddingToCart(false);
        }, 500); // Simulate a short delay for the animation
    };

    const handleCheckout = () => {
        setCheckoutLoading(true);
        setTimeout(() => {
            setCheckoutLoading(false);
            // Redirect to Pricing page (replace with your actual routing)
            window.location.href = '/pricing'; // or use navigate if you have it PUT MOLLIEE BACKEND API TO IT!
        }, 1000); // Simulate checkout loading
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 pt-16 flex items-center justify-center">
                <p>Loading furniture...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-orange-50 pt-16 flex items-center justify-center">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 pt-16">
            {/* Top Section */}
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
                        Your Marketplace, Sorted
                    </h1>
                    <p className="text-xl text-gray-500 text-center mb-8">
                        Find furniture and goods near you.
                    </p>
                    {/* Search and Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Search on Left */}
                        <div className="md:col-span-1">
                            <MarketplaceSearch />
                        </div>

                        {/* Featured Listings on Right */}
                        <div className="md:col-span-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4">
                            <h2 className="text-xl font-semibold text-white mb-2">Featured Listings</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {furnitureItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="bg-white shadow-lg rounded-lg p-2 hover:scale-105 transition-transform"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <img
                                            src={item.image_url} // Use the image_url field
                                            alt={item.name}
                                            className="w-full h-32 object-cover rounded-md mb-1"
                                        />
                                        <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                                        <p className="text-gray-600 text-xs">{item.description}</p>
                                        <p className="text-red-500 font-bold text-xs">${item.price}</p>

                                        {/* Add to Cart Button */}
                                        <motion.button
                                            onClick={() => addToCart(item.id)}
                                            disabled={isAddingToCart}
                                            whileTap={{ scale: 0.95 }}
                                            className={`mt-2 w-full flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium  transition duration-200 ${
                                                isAddingToCart ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-700 text-white'
                                            }`}
                                        >
                                            <AnimatePresence>
                                                {isAddingToCart ? (
                                                    <motion.span
                                                        key="loading"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center"
                                                    >
                                                        Adding...
                                                    </motion.span>
                                                ) : (
                                                    <motion.span
                                                        key="add"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center"
                                                    >
                                                        <FaShoppingCart className="mr-1" /> Add to Cart
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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
                                >
                                    Loading...
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="checkout"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Checkout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarketplacePage;