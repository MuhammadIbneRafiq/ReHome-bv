// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBoxOpen, FaMoneyBillWave, FaPlus, FaCheckCircle, FaEllipsisV } from "react-icons/fa";
import SellPage from "./SellPage";
import ItemDetailsModal from '../../components/ItemDetailModal'
import useUserStore from "@/services/state/useUserSessionStore"; // Import the user store
import axios from 'axios'; // Import axios for API calls

// Mock User Data (replace with your actual user data fetching)
const mockUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'muhammadibnerafiq@gmail.com',
};

// Mock Analytics Data (replace with your API calls)
const mockAnalytics = {
    listings: 15,
    earnings: 1250,
    views: 5000,
    soldListings: 7,
    activeListings: 8,
};

interface FurnitureItem {
    id: number;
    name: string;
    description: string;
    image_url: string[]; // Change to image_urls (plural)
    price: number;
    created_at: string;
    city_name: string;
    sold: boolean;
    seller_email: string; // Add seller_email to the interface
}


const SellerDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listings, setListings] = useState<FurnitureItem[]>([]);
    const [soldListings, setSoldListings] = useState<FurnitureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    const user = useUserStore((state) => state.user); // Get the user data from the store

    const openModal = (item: FurnitureItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const deleteListing = async (id: number) => {
        try {
            await axios.delete(`http://localhost:3000/api/furniture/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            // Remove the deleted listing from the state
            setListings(listings.filter(item => item.id !== id));
            setSoldListings(soldListings.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting listing:', err);
            setError('Failed to delete listing.');
        }
    };

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3000/api/furniture', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: FurnitureItem[] = await response.json();
                console.log('Fetched listings:', data);

                // Separate active and sold listings based on the signed-in user's email
                const active = data.filter(item => item.seller_email === user?.email && !item.sold);
                const sold = data.filter(item => item.seller_email === user?.email && item.sold);

                setListings(active);
                setSoldListings(sold);

            } catch (err: any) {
                console.error('Error fetching listings:', err);
                setError(err.message || 'Failed to fetch listings.');
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [user?.email]); // Fetch listings whenever the user's email changes

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <p>Loading listings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col pt-24">
            <ItemDetailsModal isOpen={isModalOpen} onClose={closeModal} item={selectedItem} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Message */}
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-extrabold text-gray-900 mb-6"
                >
                    Welcome, {user?.email}!
                </motion.h1>

                {/* Analytics Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                    {/* Analytics Card - Listings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaBoxOpen className="text-orange-500 text-2xl" />
                            <span className="text-2xl font-semibold">{listings.length}</span> {/* Display the number of listings */}
                        </div>
                        <p className="text-gray-500 mt-2">Active Listings</p>
                    </div>

                    {/* Analytics Card - Earnings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaMoneyBillWave className="text-green-500 text-2xl" />
                            <span className="text-2xl font-semibold">${mockAnalytics.earnings}</span>
                        </div>
                        <p className="text-gray-500 mt-2">Total Earnings</p>
                    </div>

                    {/* Analytics Card - Sold Listings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaCheckCircle className="text-blue-500 text-2xl" />
                            <span className="text-2xl font-semibold">{soldListings.length}</span>
                        </div>
                        <p className="text-gray-500 mt-2">Sold Listings</p>
                    </div>
                </motion.div>

                {/* Listings Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Your Listings
                        </h2>
                        <button
                            onClick={() => setIsSellModalOpen(true)}
                            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-20 rounded-md transition duration-300"
                        >
                            <FaPlus className="mr-2" /> Upload New Listing
                        </button>
                    </div>
                    {/* Check if there are no active listings */}
                    {listings.length === 0 ? (
                        <p className="text-gray-600">You have no active listings.</p>
                    ) : (
                        <>
                            {/* Active Listings */}
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Listings</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {listings.map((listing) => (
                                    <motion.div
                                        key={listing.id}
                                        className="bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer relative"
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => openModal(listing)}
                                    >
                                        <img src={listing.image_url[0]} alt={listing.name} className="w-full h-48 object-cover rounded-md mb-2" />
                                        <h3 className="text-lg font-semibold mb-1">{listing.name}</h3>
                                        <p className="text-gray-600 text-sm">Price: ${listing.price}</p>
                                        <p className="text-gray-600 text-sm">City: {listing.city_name}</p>
                                        <p className="text-gray-600 text-sm">Created At: {listing.created_at}</p>
                                        <div className="absolute top-2 right-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent modal from opening
                                                    deleteListing(listing.id);
                                                }}
                                                className="text-gray-500 hover:text-red-500"
                                            >
                                                <FaEllipsisV />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                      {/* Sold Listings */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Sold Listings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {soldListings.map((listing) => (
                            <motion.div
                                key={listing.id}
                                className="bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                onClick={() => openModal(listing)}
                            >
                                <img src={listing.image_url[0]} alt={listing.name} className="w-full h-48 object-cover rounded-md mb-2" />
                                <h3 className="text-lg font-semibold mb-1">{listing.name}</h3>
                                <p className="text-gray-600 text-sm">Price: ${listing.price}</p>
                                <p className="text-gray-600 text-sm">City: {listing.city_name}</p>
                                <p className="text-gray-600 text-sm">Created At: {listing.created_at}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Modal for New Listing (using the SellPage component) */}
                <AnimatePresence>
                    {isSellModalOpen && (
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1 },
                                exit: { opacity: 0 },
                            }}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full"
                                variants={{
                                    hidden: { opacity: 0, scale: 0.8 },
                                    visible: { opacity: 1, scale: 1 },
                                    exit: { opacity: 0, scale: 0.8 },
                                }}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <SellPage onClose={() => setIsSellModalOpen(false)} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SellerDashboard;