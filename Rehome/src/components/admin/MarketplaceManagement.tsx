import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaSearch, FaFilter, FaTag, FaEye, FaGavel, FaShoppingCart, FaEdit, FaPlus, FaBox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabaseClient';
import { 
  getAllBidsForAdmin, 
  getBidConfirmations, 
  confirmBid,
  BidWithItemDetails,
  BidConfirmation
} from '../../services/biddingService';
import { adminMarketplaceService, MarketplaceListing } from '../../services/adminMarketplaceService';
import EditListingModal from './EditListingModal';

const MarketplaceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'sales' | 'user_listings' | 'categories'>('inventory');
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bids, setBids] = useState<BidWithItemDetails[]>([]);
  const [confirmations, setConfirmations] = useState<BidConfirmation[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
  const [filteredBids, setFilteredBids] = useState<BidWithItemDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'outbid'>('all');
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [inventoryNumber, setInventoryNumber] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchListings();
    } else if (activeTab === 'requests') {
      fetchBids();
    } else if (activeTab === 'sales') {
      fetchConfirmations();
    } else if (activeTab === 'user_listings') {
      fetchListings();
    }
  }, [activeTab]);

  useEffect(() => {
    filterData();
  }, [listings, bids, searchQuery, statusFilter, bidStatusFilter, activeTab]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const typeFilter = activeTab === 'inventory' ? 'rehome' : activeTab === 'user_listings' ? 'user' : 'all';
      const response = await adminMarketplaceService.getMarketplaceFurniture({
        search: searchQuery,
        status: statusFilter,
        type: typeFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 100
      });
      
      if (response.success) {
        const mappedListings = response.data.map(item => ({
          ...item,
          isrehome: item.isrehome ?? (item as any).is_rehome ?? false
        }));
        setListings(mappedListings);
      } else {
        throw new Error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      setLoading(true);
      const bidsData = await getAllBidsForAdmin();
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      const confirmationsData = await getBidConfirmations();
      setConfirmations(confirmationsData);
    } catch (error) {
      console.error('Error fetching confirmations:', error);
      toast.error('Failed to fetch confirmations');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    // Filter listings based on tab
    let filteredListingsData = [...listings];

    if (activeTab === 'inventory') {
      filteredListingsData = filteredListingsData.filter(l => l.isrehome);
    } else if (activeTab === 'user_listings') {
      filteredListingsData = filteredListingsData.filter(l => !l.isrehome);
    }

    if (searchQuery) {
      filteredListingsData = filteredListingsData.filter(listing =>
        listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.seller_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.city_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filteredListingsData = filteredListingsData.filter(listing =>
        statusFilter === 'available' ? (!listing.sold && (!listing.status || listing.status === 'available')) :
        statusFilter === 'reserved' ? (listing.status === 'reserved') :
        statusFilter === 'sold' ? (listing.sold || listing.status === 'sold') : true
      );
    }

    setFilteredListings(filteredListingsData);

    // Filter bids
    let filteredBidsData = [...bids];

    if (searchQuery) {
      filteredBidsData = filteredBidsData.filter(bid =>
        bid.bidder_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.bidder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.seller_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBids(filteredBidsData);
  };

  const handleConfirmBid = async (confirmationId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email;
      
      if (!adminEmail) {
        toast.error('Admin authentication required');
        return;
      }

      const success = await confirmBid(confirmationId, adminEmail);
      if (success) {
        await fetchConfirmations();
      }
    } catch (error) {
      console.error('Error confirming bid:', error);
      toast.error('Failed to confirm bid');
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      await adminMarketplaceService.deleteFurnitureItem(id);
      toast.success('Listing deleted successfully');
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const updateListing = async (id: string, updates: Partial<MarketplaceListing>) => {
    try {
      await adminMarketplaceService.updateFurnitureItem(id, updates);
      toast.success('Listing updated successfully');
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    }
  };

  const toggleSoldStatus = async (listing: MarketplaceListing) => {
    const newStatus = listing.sold ? 'available' : 'sold';
    await updateListing(listing.id, { status: newStatus, sold: !listing.sold });
  };

  const toggleListingSelection = (id: string) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedListings(newSelected);
  };

  const openEditModal = (listing: MarketplaceListing) => {
    setEditingListing(listing);
    setIsCreatingListing(false);
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingListing(null);
    setIsCreatingListing(true);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingListing(null);
    setIsCreatingListing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateInventoryNumber = async (listingId: string, inventoryNum: string) => {
    try {
      await updateListing(listingId, { inventory_number: inventoryNum });
      setInventoryNumber(prev => ({ ...prev, [listingId]: inventoryNum }));
      toast.success('Inventory number updated');
    } catch (error) {
      toast.error('Failed to update inventory number');
    }
  };

  // Render inventory tab content
  const renderInventory = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  onChange={() => {
                    if (selectedListings.size === filteredListings.length) {
                      setSelectedListings(new Set());
                    } else {
                      setSelectedListings(new Set(filteredListings.map(l => l.id)));
                    }
                  }}
                  checked={selectedListings.size === filteredListings.length && filteredListings.length > 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredListings.map((listing) => (
              <tr key={listing.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedListings.has(listing.id)}
                    onChange={() => toggleListingSelection(listing.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={listing.image_urls?.[0] || '/placeholder.png'} 
                    alt={listing.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={inventoryNumber[listing.id] || listing.inventory_number || ''}
                    onChange={(e) => setInventoryNumber(prev => ({ ...prev, [listing.id]: e.target.value }))}
                    onBlur={() => {
                      if (inventoryNumber[listing.id]) {
                        updateInventoryNumber(listing.id, inventoryNumber[listing.id]);
                      }
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="INV-"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                  <div className="text-sm text-gray-500">{listing.city_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">€{listing.price}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    listing.sold ? 'bg-red-100 text-red-800' :
                    listing.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {listing.sold ? 'Sold' : listing.status || 'Available'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleSoldStatus(listing)}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    {listing.sold ? 'Mark Available' : 'Mark Sold'}
                  </button>
                  <button
                    onClick={() => openEditModal(listing)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => deleteListing(listing.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render requests (bids) tab content
  const renderRequests = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBids.map((bid) => (
              <tr key={bid.id} className={bid.is_highest ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {bid.item_image_url && (
                      <img 
                        src={bid.item_image_url} 
                        alt={bid.item_name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {bid.item_name || `Item #${bid.item_id}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        Original: €{bid.item_price}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{bid.bidder_name}</div>
                  <div className="text-sm text-gray-500">{bid.bidder_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">€{bid.bid_amount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bid.is_highest ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {bid.is_highest ? 'Highest' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(bid.created_at || '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render sales history tab content
  const renderSalesHistory = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {confirmations.map((confirmation) => (
              <tr key={confirmation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {confirmation.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Item #{confirmation.item_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {confirmation.bidder_email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  €{confirmation.final_price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    confirmation.confirmation_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    confirmation.confirmation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {confirmation.confirmation_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(confirmation.created_at || '')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {confirmation.confirmation_status === 'pending' && (
                    <button
                      onClick={() => handleConfirmBid(confirmation.id!)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Confirm Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render categories tab content  
  const renderCategories = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Marketplace Categories</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Categories */}
        <div>
          <h4 className="font-medium mb-3">Main Categories</h4>
          <div className="space-y-2">
            {['Furniture', 'Electronics', 'Appliances', 'Books', 'Clothing', 'Other'].map(category => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{category}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Subcategories */}
        <div>
          <h4 className="font-medium mb-3">Subcategories</h4>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium mb-2">Furniture</div>
              <div className="pl-4 space-y-1 text-sm text-gray-600">
                <div>• Beds (1.5x multiplier)</div>
                <div>• Closets (2.0x multiplier)</div>
                <div>• Tables (1.2x multiplier)</div>
                <div>• Sofas (1.8x multiplier)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Marketplace Management</h2>
        {activeTab === 'inventory' && (
          <button
            onClick={openCreateModal}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <FaPlus />
            <span>Add New Listing</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaBox className="inline-block mr-2" />
            Inventory ({listings.filter(l => l.isrehome).length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaGavel className="inline-block mr-2" />
            Requests ({bids.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaShoppingCart className="inline-block mr-2" />
            Sales History ({confirmations.length})
          </button>
          <button
            onClick={() => setActiveTab('user_listings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user_listings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaEye className="inline-block mr-2" />
            User Listings ({listings.filter(l => !l.isrehome).length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaTag className="inline-block mr-2" />
            Categories
          </button>
        </nav>
      </div>

      {/* Filters */}
      {activeTab !== 'categories' && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {(activeTab === 'inventory' || activeTab === 'user_listings') && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </>
            )}

            <div className="flex items-center text-gray-600 md:col-span-2">
              <FaFilter className="mr-2" />
              {activeTab === 'inventory' && `${filteredListings.filter(l => l.isrehome).length} items`}
              {activeTab === 'requests' && `${filteredBids.length} requests`}
              {activeTab === 'sales' && `${confirmations.length} sales`}
              {activeTab === 'user_listings' && `${filteredListings.filter(l => !l.isrehome).length} listings`}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'sales' && renderSalesHistory()}
          {activeTab === 'user_listings' && renderInventory()}
          {activeTab === 'categories' && renderCategories()}
        </>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <EditListingModal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          listing={editingListing}
          isCreating={isCreatingListing}
          onSave={fetchListings}
        />
      )}
    </motion.div>
  );
};

export default MarketplaceManagement;
