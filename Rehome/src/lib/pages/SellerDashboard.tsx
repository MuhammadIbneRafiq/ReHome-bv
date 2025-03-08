// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBoxOpen, FaMoneyBillWave, FaPlus, FaCheckCircle, FaEllipsisV, FaShoppingCart, FaUpload, FaTag } from "react-icons/fa";
import { MdOutlineInventory2, MdSell } from "react-icons/md";
import SellPage from "./SellPage";
import ItemDetailsModal from '../../components/ItemDetailModal'
import useUserStore from "@/services/state/useUserSessionStore"; // Import the user store
import axios from 'axios'; // Import axios for API calls
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Mock Analytics Data (replace with your API calls)
const mockAnalytics = {
    listings: 15,
    earnings: 0,
    views: 50,
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [listings, setListings] = useState<FurnitureItem[]>([]);
    const [soldListings, setSoldListings] = useState<FurnitureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<number | null>(null); // Track which dropdown is open

    const user = useUserStore((state) => state.user); // Get the user data from the store

    // Check if user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || !user) {
            toast.error("Please sign in to access your dashboard");
            navigate('/login');
        }
    }, [user, navigate, t]);

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
            await axios.delete(`https://rehome-backend.vercel.app/api/furniture/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            // Remove the deleted listing from the state
            setListings(listings.filter(item => item.id !== id));
            setSoldListings(soldListings.filter(item => item.id !== id));
            toast.success(t('common.success'));
        } catch (err) {
            console.error('Error deleting listing:', err);
            setError('Failed to delete listing.');
            toast.error(t('common.error'));
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://rehome-backend.vercel.app/api/furniture', {
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

            console.log('Active listings:', active);
            console.log('Sold listings:', sold);

            setListings(active);
            setSoldListings(sold);

        } catch (err: any) {
            console.error('Error fetching listings:', err);
            setError(err.message || 'Failed to fetch listings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email) {
            fetchListings();
        }
    }, [user?.email]); // Fetch listings whenever the user's email changes

    const handleModalClose = () => {
        setIsSellModalOpen(false);
        fetchListings(); // Refresh listings after closing the modal
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
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
                    Welcome back, {user?.email}!
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
                            <span className="text-2xl font-semibold">{listings.length}</span>
                        </div>
                        <p className="text-gray-500 mt-2">Active Listings</p>
                    </div>

                    {/* Analytics Card - Earnings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaMoneyBillWave className="text-green-500 text-2xl" />
                            <span className="text-2xl font-semibold">€{mockAnalytics.earnings}</span>
                        </div>
                        <p className="text-gray-500 mt-2">Total Earnings</p>
                    </div>

                    {/* Analytics Card - Sold Listings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaCheckCircle className="text-blue-500 text-2xl" />
                            <span className="text-2xl font-semibold">{soldListings.length}</span>
                        </div>
                        <p className="text-gray-500 mt-2">Sold Items</p>
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
                            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
                        >
                            <FaPlus className="mr-2" /> Add New Listing
                        </button>
                    </div>
                    
                    {/* Active Listings Section */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <MdOutlineInventory2 className="mr-2 text-orange-500" /> Active Listings
                        </h3>
                        
                        {/* Check if there are no active listings */}
                        {listings.length === 0 ? (
                            <div className="bg-orange-50 rounded-lg p-8 text-center">
                                <FaTag className="mx-auto text-orange-400 text-5xl mb-4" />
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">No Active Listings</h4>
                                <p className="text-gray-600 mb-6">Start selling your items today!</p>
                                <button
                                    onClick={() => setIsSellModalOpen(true)}
                                    className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                                >
                                    <FaUpload className="mr-2" /> Create Your First Listing
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((listing) => (
                                    <motion.div
                                        key={listing.id}
                                        className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => openModal(listing)}
                                    >
                                        <div className="relative h-48 mb-3 overflow-hidden rounded-md">
                                            <img 
                                                src={listing.image_url[0]} 
                                                alt={listing.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                €{listing.price}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1 truncate">{listing.name}</h3>
                                        <p className="text-gray-500 text-sm mb-2 truncate">{listing.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">{listing.city_name}</span>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent modal from opening
                                                        setDropdownOpen(dropdownOpen === listing.id ? null : listing.id); // Toggle dropdown
                                                    }}
                                                    className="text-gray-500 hover:text-red-500 p-1"
                                                >
                                                    <FaEllipsisV />
                                                </button>
                                                {dropdownOpen === listing.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent modal from opening
                                                                deleteListing(listing.id);
                                                                setDropdownOpen(null); // Close dropdown after deletion
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                        >
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Sold Listings Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <MdSell className="mr-2 text-green-500" /> {t('dashboard.soldListing')}
                        </h3>
                        
                        {/* Check if there are no sold listings */}
                        {soldListings.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                                <FaShoppingCart className="mx-auto text-gray-400 text-5xl mb-4" />
                                <h4 className="text-xl font-semibold text-gray-800 mb-2">{t('dashboard.noSoldItems')}</h4>
                                <p className="text-gray-600 mb-6">{t('dashboard.soldAppearHere')}</p>
                                {listings.length === 0 ? (
                                    <button
                                        onClick={() => setIsSellModalOpen(true)}
                                        className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
                                    >
                                        <FaUpload className="mr-2" /> {t('dashboard.createFirst')}
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500">{t('dashboard.promoteListings')}</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {soldListings.map((listing) => (
                                    <motion.div
                                        key={listing.id}
                                        className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => openModal(listing)}
                                    >
                                        <div className="relative h-48 mb-3 overflow-hidden rounded-md">
                                            <img 
                                                src={listing.image_url[0]} 
                                                alt={listing.name} 
                                                className="w-full h-full object-cover opacity-70" 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                                    {t('dashboard.soldTag')}
                                                </span>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                €{listing.price}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1 truncate">{listing.name}</h3>
                                        <p className="text-gray-500 text-sm mb-2 truncate">{listing.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">{listing.city_name}</span>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent modal from opening
                                                        setDropdownOpen(dropdownOpen === listing.id ? null : listing.id); // Toggle dropdown
                                                    }}
                                                    className="text-gray-500 hover:text-red-500 p-1"
                                                >
                                                    <FaEllipsisV />
                                                </button>
                                                {dropdownOpen === listing.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent modal from opening
                                                                deleteListing(listing.id);
                                                                setDropdownOpen(null); // Close dropdown after deletion
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                        >
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sell Modal */}
            <AnimatePresence>
                {isSellModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold">{t('dashboard.newListing')}</h2>
                                    <button
                                        onClick={handleModalClose}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <SellPage onClose={handleModalClose} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellerDashboard;