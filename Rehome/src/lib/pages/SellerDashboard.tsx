// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBoxOpen, FaMoneyBillWave, FaPlus, FaCheckCircle, FaEllipsisV, FaShoppingCart, FaUpload, FaTag, FaComments, FaEdit } from "react-icons/fa";
import { MdOutlineInventory2, MdSell } from "react-icons/md";
import SellPage from "./SellPage";
import EditPage from "./EditPage";
import ItemDetailsModal from '../../components/ItemDetailModal'
import useUserStore from "@/services/state/useUserSessionStore"; // Import the user store
import axios from 'axios'; // Import axios for API calls
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatDashboard from '../../components/ChatDashboard';
import API_ENDPOINTS from '../api/config';
import { useAuth } from '../../hooks/useAuth';

// Mock Analytics Data (replace with your API calls)
const mockAnalytics = {
    listings: 15,
    earnings: 0,
    views: 50,
    soldListings: 7,
    activeListings: 8,
};

interface FurnitureItem {
    id: string;
    name: string;
    description: string;
    image_url?: string[]; // Make it optional to match the usage in the code
    image_urls?: string[]; // Keep both to handle database column name
    price?: number;
    created_at: string;
    city_name: string;
    sold: boolean;
    seller_email: string; // Add seller_email to the interface
    isrehome?: boolean; // Add this property to match the expected type
}


const SellerDashboard = () => {
    const { t } = useTranslation();
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FurnitureItem | null>(null);
    const [activeTab, setActiveTab] = useState('listings'); // Add a state for active tab
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<FurnitureItem[]>([]);
    const [soldListings, setSoldListings] = useState<FurnitureItem[]>([]);
    const user = useUserStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation(); // Get location to check for state
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null); // Track which dropdown is open
    const { isAdmin, isAuthenticated } = useAuth();

    // Check if user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || !user || !isAuthenticated) {
            toast.error("Please sign in to access your dashboard");
            navigate('/login');
        }
    }, [user, navigate, t, isAuthenticated]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setDropdownOpen(null);
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Check if we were redirected from the item detail page with an active chat
    useEffect(() => {
        if (location.state && location.state.activeTab) {
            setActiveTab(location.state.activeTab);
            // Clear the navigation state so it won't persist on refresh
            const newState = { ...location.state };
            delete newState.activeTab;
            navigate(location.pathname, { state: newState, replace: true });
        }
    }, [location, navigate]);

    const openModal = (item: FurnitureItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const deleteListing = async (id: string, item?: FurnitureItem) => {
        // Add confirmation with additional info for admin deletions
        const confirmMessage = isAdmin && item?.seller_email !== user?.email 
            ? `Are you sure you want to delete "${item?.name}" by ${item?.seller_email}? This action cannot be undone.`
            : `Are you sure you want to delete this listing? This action cannot be undone.`;
            
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await axios.delete(API_ENDPOINTS.FURNITURE.DELETE(id), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            // Remove the deleted listing from the state
            setListings(listings.filter(item => item.id !== id));
            setSoldListings(soldListings.filter(item => item.id !== id));
            
            const successMessage = isAdmin && item?.seller_email !== user?.email 
                ? `Listing "${item?.name}" by ${item?.seller_email} has been deleted.`
                : 'Listing deleted successfully.';
            toast.success(successMessage);
        } catch (err) {
            console.error('Error deleting listing:', err);
            setError('Failed to delete listing.');
            toast.error(t('common.error'));
        }
    };

    const editListing = (item: FurnitureItem) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
        setDropdownOpen(null); // Close dropdown
    };

    const handleEditSave = (updatedItem: FurnitureItem) => {
        // Update the item in both listings arrays
        setListings(prev => prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        ));
        setSoldListings(prev => prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        ));
        toast.success('Listing updated successfully!');
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const fetchListings = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_ENDPOINTS.FURNITURE.LIST, {
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
            console.log('Current user email:', user?.email);
            console.log('Is admin:', isAdmin);

            // Handle both old array format and new pagination format
            const itemsArray = Array.isArray(data) ? data : (data as any).data;

            if (isAdmin) {
                // Admin sees all listings
                const active = itemsArray.filter(item => !item.sold);
                const sold = itemsArray.filter(item => item.sold);
                
                console.log('Admin view - Active listings:', active);
                console.log('Admin view - Sold listings:', sold);

                setListings(active);
                setSoldListings(sold);
            } else {
                // Separate active and sold listings based on the signed-in user's email
                const active = itemsArray.filter(item => item.seller_email === user?.email && !item.sold);
                const sold = itemsArray.filter(item => item.seller_email === user?.email && item.sold);

                console.log('User view - Active listings:', active);
                console.log('User view - Sold listings:', sold);
                console.log('Listings with delete permission check:');
                itemsArray.forEach((item: FurnitureItem) => {
                    console.log(`Item ${item.id}: seller_email=${item.seller_email}, user_email=${user?.email}, can_delete=${item.seller_email === user?.email || isAdmin}`);
                });

                setListings(active);
                setSoldListings(sold);
            }

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
                    {isAdmin ? `Admin Dashboard - Welcome, ${user?.email}!` : `Welcome back, ${user?.email}!`}
                </motion.h1>

                {/* Admin notice */}
                {isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-red-50 border border-red-200 rounded-md p-4 mb-6"
                    >
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Administrator Access
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>You are viewing all marketplace listings. You can edit and delete any listing as an administrator.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

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
                        <p className="text-gray-500 mt-2">{isAdmin ? 'Total Active Listings' : 'Active Listings'}</p>
                    </div>

                    {/* Analytics Card - Earnings */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaMoneyBillWave className="text-green-500 text-2xl" />
                            <span className="text-2xl font-semibold">€{mockAnalytics.earnings}</span>
                        </div>
                        <p className="text-gray-500 mt-2">{isAdmin ? 'Platform Earnings' : 'Your Earnings'}</p>
                    </div>

                    {/* Analytics Card - Views */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <FaCheckCircle className="text-blue-500 text-2xl" />
                            <span className="text-2xl font-semibold">{soldListings.length}</span>
                        </div>
                        <p className="text-gray-500 mt-2">{isAdmin ? 'Total Sold Items' : 'Items Sold'}</p>
                    </div>
                </motion.div>

                {/* Dashboard Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('listings')}
                                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                    activeTab === 'listings'
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <MdOutlineInventory2 className="inline-block mr-2" />
                                {t('dashboard.yourListings')}
                            </button>
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                    activeTab === 'chats'
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <FaComments className="inline-block mr-2" />
                                Messages
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Listings Tab Content */}
                        {activeTab === 'listings' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        {isAdmin ? 'All Marketplace Listings' : 'Your Listings'}
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
                                        <MdOutlineInventory2 className="mr-2 text-orange-500" /> {isAdmin ? 'All Active Listings' : 'Active Listings'}
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
                                                            src={listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0 
                                                                ? listing.image_urls[0] 
                                                                : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                                                            } 
                                                            alt={listing.name} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                                            }}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                            €{listing.price}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-1 truncate">{listing.name}</h3>
                                                    <p className="text-gray-500 text-sm mb-2 truncate">{listing.description}</p>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <span className="text-xs text-gray-500">{listing.city_name}</span>
                                                            {isAdmin && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Seller: {listing.seller_email}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                            editListing(listing);
                                                                        }}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 flex items-center"
                                                                    >
                                                                        <FaEdit className="mr-2" /> Edit
                                                                    </button>
                                                                    {/* Show delete button only for own listings OR if user is admin */}
                                                                    {(listing.seller_email === user?.email || isAdmin) && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // Prevent modal from opening
                                                                                deleteListing(listing.id, listing);
                                                                                setDropdownOpen(null); // Close dropdown after deletion
                                                                            }}
                                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                                        >
                                                                            {isAdmin && listing.seller_email !== user?.email ? 'Admin Delete' : t('common.delete')}
                                                                        </button>
                                                                    )}
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
                                        <MdSell className="mr-2 text-green-500" /> {isAdmin ? 'All Sold Listings' : t('dashboard.soldListing')}
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
                                                            src={listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0 
                                                                ? listing.image_urls[0] 
                                                                : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSUjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                                                            } 
                                                            alt={listing.name} 
                                                            className="w-full h-full object-cover opacity-70" 
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                                            }}
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
                                                        <div className="flex-1">
                                                            <span className="text-xs text-gray-500">{listing.city_name}</span>
                                                            {isAdmin && (
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Seller: {listing.seller_email}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                            editListing(listing);
                                                                        }}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 flex items-center"
                                                                    >
                                                                        <FaEdit className="mr-2" /> Edit
                                                                    </button>
                                                                    {/* Show delete button only for own listings OR if user is admin */}
                                                                    {(listing.seller_email === user?.email || isAdmin) && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // Prevent modal from opening
                                                                                deleteListing(listing.id, listing);
                                                                                setDropdownOpen(null); // Close dropdown after deletion
                                                                            }}
                                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                                                                        >
                                                                            {isAdmin && listing.seller_email !== user?.email ? 'Admin Delete' : t('common.delete')}
                                                                        </button>
                                                                    )}
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
                        )}

                        {/* Chat Tab Content */}
                        {activeTab === 'chats' && (
                            <ChatDashboard />
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
                                </div>
                                <SellPage onClose={handleModalClose} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingItem && (
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
                                <EditPage 
                                    item={editingItem}
                                    onClose={handleEditModalClose} 
                                    onSave={handleEditSave}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellerDashboard;