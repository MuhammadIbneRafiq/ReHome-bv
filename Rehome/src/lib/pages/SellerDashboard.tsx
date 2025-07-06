// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBoxOpen, FaMoneyBillWave, FaPlus, FaCheckCircle, FaEllipsisV, FaShoppingCart, FaUpload, FaTag, FaComments, FaEdit, FaTrash } from "react-icons/fa";
import { MdOutlineInventory2, MdSell } from "react-icons/md";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SellPage from "./SellPage";
import EditPage from "./EditPage";
import ItemDetailsModal from '../../components/ItemDetailModal'
import LazyImage from '../../components/ui/LazyImage';
import { useModal } from '../../components/ui/DynamicModal';
import useUserStore from "@/services/state/useUserSessionStore"; // Import the user store
import axios from 'axios'; // Import axios for API calls
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatDashboard from '../../components/ChatDashboard';
import API_ENDPOINTS from '../api/config';
import { useAuth } from '../../hooks/useAuth';
import ShareButton from '../../components/ui/ShareButton';

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
    const [activeTab, setActiveTab] = useState('listings'); // Add a state for active tab
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listings, setListings] = useState<FurnitureItem[]>([]);
    const [soldListings, setSoldListings] = useState<FurnitureItem[]>([]);
    const user = useUserStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation(); // Get location to check for state
    const { isAdmin } = useAuth();
    
    // Dynamic modal hooks
    const itemDetailModal = useModal('item-detail');
    const sellModal = useModal('sell-item');
    const editModal = useModal('edit-item');

    // Debug user state
    console.log('=== SELLER DASHBOARD DEBUG ===');
    console.log('User from store:', user);
    console.log('Is admin:', isAdmin);
    console.log('Loading state:', loading);

    // Note: Authentication is already handled by ProtectedRoute wrapper
    // No need for additional auth check here

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
        itemDetailModal.open(ItemDetailsModal, {
            item,
            onUpdateStatus: handleStatusUpdate
        }, { size: 'lg' });
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
        editModal.open(EditPage, {
            item,
            onSave: handleEditSave
        }, { size: 'lg' });
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
        editModal.close();
    };

    const handleStatusUpdate = async (itemId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const endpoint = API_ENDPOINTS.FURNITURE.UPDATE_STATUS(itemId);
            
            console.log('=== STATUS UPDATE DEBUG ===');
            console.log('📋 Item ID:', itemId);
            console.log('📋 New Status:', newStatus);
            console.log('📋 Endpoint:', endpoint);
            console.log('📋 Has Token:', !!token);
            
            const response = await axios.put(endpoint, 
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('📋 Response Status:', response.status);
            console.log('📋 Response Data:', response.data);

            toast.success(`Item status updated to ${newStatus}`);
            
            // Refresh listings to get updated data from the database
            await fetchListings();
            
        } catch (error) {
            console.error('Error updating item status:', error);
            toast.error('Failed to update item status');
        }
    };

    const fetchListings = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('=== FETCH LISTINGS DEBUG ===');
            console.log('User email:', user?.email);
            console.log('Is admin:', isAdmin);
            console.log('Access token exists:', !!localStorage.getItem('accessToken'));

            const token = localStorage.getItem('accessToken');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Fetch all items (both active and sold)
            const allResponse = await axios.get(API_ENDPOINTS.FURNITURE.LIST + '?include_sold=true', { headers });
            console.log('All items response:', allResponse.status, allResponse.data);

            // Handle both old array format and new pagination format
            const allItems: FurnitureItem[] = Array.isArray(allResponse.data) ? allResponse.data : (allResponse.data.data || []);
            
            // Separate active and sold items
            const activeItems = allItems.filter((item: FurnitureItem) => !item.sold);
            const soldItems = allItems.filter((item: FurnitureItem) => item.sold);

            console.log('Active items count:', activeItems.length);
            console.log('Sold items count:', soldItems.length);

            if (isAdmin) {
                // Admin sees all listings
                console.log('Admin view - Setting all active and sold listings');
                setListings(activeItems);
                setSoldListings(soldItems);
            } else {
                // Filter by user email for regular users
                const userActiveItems = activeItems.filter((item: FurnitureItem) => item.seller_email === user?.email);
                const userSoldItems = soldItems.filter((item: FurnitureItem) => item.seller_email === user?.email);

                console.log('User view - Active listings:', userActiveItems.length);
                console.log('User view - Sold listings:', userSoldItems.length);

                setListings(userActiveItems);
                setSoldListings(userSoldItems);
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
            setError('Failed to fetch listings. Please try again.');
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email) {
            fetchListings();
        } else {
            // If no user email after 5 seconds, stop loading and show error
            const timeout = setTimeout(() => {
                if (!user?.email) {
                    console.log('No user email found after timeout, stopping loading');
                    setLoading(false);
                    setError('Unable to load user information. Please try refreshing the page.');
                }
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [user?.email, isAdmin]); // Fetch listings whenever the user's email or admin status changes

    // Additional timeout to prevent infinite loading
    useEffect(() => {
        const maxLoadTimeout = setTimeout(() => {
            if (loading) {
                console.log('Maximum loading time exceeded, stopping loading');
                setLoading(false);
                if (!error) {
                    setError('Loading took too long. Please check your connection and try refreshing the page.');
                }
            }
        }, 10000); // 10 seconds max loading time

        return () => clearTimeout(maxLoadTimeout);
    }, [loading, error]);

    const handleModalClose = () => {
        sellModal.close();
        fetchListings(); // Refresh listings after closing the modal
    };

    const handleSellSuccess = () => {
        // Refresh the listings after successful sell
        fetchListings();
        // Navigate to the listings tab to see the new listing
        setActiveTab('listings');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                <div className="mt-2 text-sm text-gray-500">
                    <p>User: {user?.email || 'Loading...'}</p>
                    <p>Admin: {isAdmin ? 'Yes' : 'No'}</p>
                    <p>Token: {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-2xl mx-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <div className="mt-4 text-sm">
                        <p><strong>Debug Information:</strong></p>
                        <p>User: {user?.email || 'Not loaded'}</p>
                        <p>Admin: {isAdmin ? 'Yes' : 'No'}</p>
                        <p>Token: {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
                        <div className="mt-3 flex gap-2">
                            <button 
                                onClick={() => window.location.reload()} 
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                            >
                                Refresh Page
                            </button>
                            <button 
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    fetchListings();
                                }} 
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 pt-24">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
                        {isAdmin ? `Admin Dashboard - Welcome,` : `Welcome back,`}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 break-words">
                        {user?.email}
                    </p>
                </div>

                {/* Admin Notice */}
                {isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-red-50 border border-red-200 rounded-md p-4 mb-8"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
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

                {/* Analytics Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"
                >
                    {/* Analytics Card - Listings */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <FaBoxOpen className="text-orange-500 text-xl md:text-2xl" />
                            <span className="text-xl md:text-2xl font-semibold">{listings.length}</span>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-2">{isAdmin ? 'Total Active Listings' : 'Active Listings'}</p>
                    </div>

                    {/* Analytics Card - Earnings */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <FaMoneyBillWave className="text-green-500 text-xl md:text-2xl" />
                            <span className="text-xl md:text-2xl font-semibold">€0</span>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-2">{isAdmin ? 'Platform Earnings' : 'Your Earnings'}</p>
                    </div>

                    {/* Analytics Card - Sold Items */}
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <FaCheckCircle className="text-blue-500 text-xl md:text-2xl" />
                            <span className="text-xl md:text-2xl font-semibold">{soldListings.length}</span>
                        </div>
                        <p className="text-sm md:text-base text-gray-500 mt-2">{isAdmin ? 'Total Sold Items' : 'Items Sold'}</p>
                    </div>
                </motion.div>

                {/* Dashboard Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex flex-wrap">
                            <button
                                onClick={() => setActiveTab('listings')}
                                className={`py-3 md:py-4 px-4 md:px-6 font-medium text-sm border-b-2 ${
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
                                className={`py-3 md:py-4 px-4 md:px-6 font-medium text-sm border-b-2 ${
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

                    <div className="p-4 md:p-6">
                        {/* Listings Tab Content */}
                        {activeTab === 'listings' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 break-words">
                                        {isAdmin ? 'All Marketplace Listings' : 'Your Listings'}
                                    </h2>
                                    <button
                                        onClick={() => sellModal.open(SellPage, { onClose: handleModalClose, onSuccess: handleSellSuccess }, { size: 'lg', showCloseButton: false })}
                                        className="w-full sm:w-auto flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
                                    >
                                        <FaPlus className="mr-2" /> Add New Listing
                                    </button>
                                </div>
                                
                                {/* Active Listings Section */}
                                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                        <MdOutlineInventory2 className="mr-2 text-orange-500" /> {isAdmin ? 'All Active Listings' : 'Active Listings'}
                                    </h3>
                                    
                                    {/* Check if there are no active listings */}
                                    {listings.length === 0 ? (
                                        <div className="bg-orange-50 rounded-lg p-6 md:p-8 text-center">
                                            <FaTag className="mx-auto text-orange-400 text-4xl md:text-5xl mb-4" />
                                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No Active Listings</h4>
                                            <p className="text-gray-600 mb-6">
                                                {isAdmin ? 'No active listings in the marketplace.' : 'Start selling your items today!'}
                                            </p>
                                            {(
                                                <button
                                                    onClick={() => sellModal.open(SellPage, { onClose: handleModalClose, onSuccess: handleSellSuccess }, { size: 'lg', showCloseButton: false })}
                                                    className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-md transition duration-300"
                                                >
                                                    <FaUpload className="mr-2" /> Create Your First Listing
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {listings.map((listing) => (
                                                <div
                                                    key={listing.id}
                                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                                    onClick={() => openModal(listing)}
                                                >
                                                    <div className="relative aspect-w-16 aspect-h-9">
                                                        <LazyImage
                                                            src={listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0 
                                                                ? listing.image_urls[0] 
                                                                : ''
                                                            } 
                                                            alt={listing.name}
                                                            className="object-cover w-full h-full"
                                                            priority={false}
                                                        />
                                                        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors">
                                                                    <FaEllipsisV className="w-4 h-4 text-gray-600" />
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => editListing(listing)}>
                                                                        <FaEdit className="mr-2" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        className="text-red-600 hover:text-red-700"
                                                                        onClick={() => deleteListing(listing.id, listing)}
                                                                    >
                                                                        <FaTrash className="mr-2" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{listing.name}</h3>
                                                            <span className="text-lg font-semibold text-emerald-600">€{listing.price}</span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{listing.description}</p>
                                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                                            <div className="flex items-center space-x-2">
                                                                <span>{listing.city_name}</span>
                                                                {isAdmin && (
                                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {listing.seller_email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ShareButton 
                                                                title={listing.name}
                                                                description={listing.description}
                                                                url={`${window.location.origin}/marketplace?item=${listing.id}`}
                                                                variant="icon"
                                                                className="!p-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Sold Listings Section */}
                                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                        <MdSell className="mr-2 text-green-500" /> {isAdmin ? 'All Sold Listings' : t('dashboard.soldListing')}
                                    </h3>
                                    
                                    {/* Check if there are no sold listings */}
                                    {soldListings.length === 0 ? (
                                        <div className="bg-gray-50 rounded-lg p-6 md:p-8 text-center">
                                            <FaShoppingCart className="mx-auto text-gray-400 text-4xl md:text-5xl mb-4" />
                                            <h4 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">{t('dashboard.noSoldItems')}</h4>
                                            <p className="text-gray-600 mb-6">
                                                {isAdmin ? 'No items have been sold yet.' : t('dashboard.soldAppearHere')}
                                            </p>
                                            { listings.length === 0 && (
                                                <button
                                                    onClick={() => sellModal.open(SellPage, { onClose: handleModalClose, onSuccess: handleSellSuccess }, { size: 'lg', showCloseButton: false })}
                                                    className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-md transition duration-300"
                                                >
                                                    <FaUpload className="mr-2" /> {t('dashboard.createFirst')}
                                                </button>
                                            )}
                                            {listings.length > 0 && (
                                                <p className="text-sm text-gray-500">{t('dashboard.promoteListings')}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {soldListings.map((listing) => (
                                                <motion.div
                                                    key={listing.id}
                                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => openModal(listing)}
                                                >
                                                    <div className="relative aspect-w-16 aspect-h-9">
                                                        <LazyImage
                                                            src={listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0 
                                                                ? listing.image_urls[0] 
                                                                : ''
                                                            } 
                                                            alt={listing.name}
                                                            className="object-cover w-full h-full"
                                                            priority={false}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                            <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                                                {t('dashboard.soldTag')}
                                                            </span>
                                                        </div>
                                                        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors">
                                                                    <FaEllipsisV className="w-4 h-4 text-gray-600" />
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => editListing(listing)}>
                                                                        <FaEdit className="mr-2" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        className="text-red-600 hover:text-red-700"
                                                                        onClick={() => deleteListing(listing.id, listing)}
                                                                    >
                                                                        <FaTrash className="mr-2" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{listing.name}</h3>
                                                            <span className="text-lg font-semibold text-emerald-600">€{listing.price}</span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{listing.description}</p>
                                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                                            <div className="flex items-center space-x-2">
                                                                <span>{listing.city_name}</span>
                                                                {isAdmin && (
                                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {listing.seller_email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ShareButton 
                                                                title={listing.name}
                                                                description={listing.description}
                                                                url={`${window.location.origin}/marketplace?item=${listing.id}`}
                                                                variant="icon"
                                                                className="!p-1"
                                                            />
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
        </div>
    );
};

export default SellerDashboard;