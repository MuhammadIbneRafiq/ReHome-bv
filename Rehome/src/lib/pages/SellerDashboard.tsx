// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBoxOpen, FaMoneyBillWave, FaPlus, FaCheckCircle } from "react-icons/fa";
import SellPage from "./SellPage";
import { Link } from "react-router-dom";
// Import Images - Assuming you have these files in assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";
import image1 from "../../assets/IMG-20250208-WA0005.jpg";
import image2 from "../../assets/IMG-20250208-WA0006.jpg";
import image3 from "../../assets/IMG-20250208-WA0007.jpg";

// Mock User Data (replace with your actual user data fetching)
const mockUser = {
    firstName: 'John',
    lastName: 'Doe',
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
    image_url: string;
    price: number;
    created_at: string;
}

const SellerDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listings, setListings] = useState<FurnitureItem[]>([]); // Use the new type
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // No longer needed, as the new listing is handled via a post request to the backend.
    // const handleNewListing = (newListing: any) => {
    //     setListings([...listings, newListing]);
    //     closeModal();
    // };

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3000/api/furniture', { // Use your backend endpoint
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` // Get the token from localStorage
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched listings:', data);
                setListings(data); // Update the state with the fetched listings
            } catch (err: any) {
                console.error('Error fetching listings:', err);
                setError(err.message || 'Failed to fetch listings.');
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, []); // Empty dependency array ensures this runs only once on mount

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Message */}
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-extrabold text-gray-900 mb-6"
                >
                    Welcome, {mockUser.firstName}!
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
                            <span className="text-2xl font-semibold">{mockAnalytics.soldListings}</span>
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
                            onClick={openModal}
                            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
                        >
                            <FaPlus className="mr-2" /> Upload New Listing
                        </button>
                    </div>
                    {/* Active Listings */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Listings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {listings.filter(listing => listing.description).map((listing) => (
                            <motion.div
                                key={listing.id}
                                className="bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform"
                                whileHover={{ scale: 1.05 }}
                            >
                                <img src={listing.image_url} alt={listing.name} className="w-full h-48 object-cover rounded-md mb-2" />
                                <h3 className="text-lg font-semibold mb-1">{listing.name}</h3>
                                <p className="text-gray-600 text-sm">Price: ${listing.price}</p>
                                <p className="text-gray-600 text-sm">Created At: {listing.created_at}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal for New Listing (using the SellPage component) */}
            <AnimatePresence>
                {isModalOpen && (
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
                            <SellPage />
                            <button
                                onClick={closeModal}
                                className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-200"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Example usage of Link */}
            <Link to="/some-route" className="text-blue-500 hover:underline">
                Go to Some Page
            </Link>
        </div>
    );
};

export default SellerDashboard;