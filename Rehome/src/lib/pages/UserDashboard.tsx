import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaShare, FaEye, FaStar, FaCalendar, FaUser, FaPlus, FaHeart, FaShoppingCart, FaClipboard } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  dateCreated: string;
  views: number;
  isActive: boolean;
  city: string;
}

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: string;
  averageRating: number;
  totalRatings: number;
  profileImage?: string;
}

interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUserProfile({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+31 6 12345678',
        joinDate: '2023-03-15',
        averageRating: 4.2,
        totalRatings: 8,
      });

      setListings([
        {
          id: 1,
          title: 'Vintage Leather Sofa',
          description: 'Beautiful vintage leather sofa in excellent condition',
          price: 450,
          category: 'Sofa\'s and Chairs',
          condition: '2',
          images: ['/api/placeholder/300/200'],
          dateCreated: '2024-01-15',
          views: 24,
          isActive: true,
          city: 'Amsterdam'
        },
        {
          id: 2,
          title: 'Oak Dining Table',
          description: 'Solid oak dining table for 6 people',
          price: 320,
          category: 'Tables',
          condition: '3',
          images: ['/api/placeholder/300/200'],
          dateCreated: '2024-01-10',
          views: 18,
          isActive: true,
          city: 'Utrecht'
        },
        {
          id: 3,
          title: 'Modern Bookshelf',
          description: 'White modern bookshelf with 5 shelves',
          price: 85,
          category: 'Kasten',
          condition: '1',
          images: ['/api/placeholder/300/200'],
          dateCreated: '2024-01-05',
          views: 12,
          isActive: false,
          city: 'Rotterdam'
        }
      ]);

      setReviews([
        {
          id: 1,
          reviewerId: 2,
          reviewerName: 'Sarah M.',
          rating: 5,
          comment: 'Great seller! Item was exactly as described and pickup was smooth.',
          date: '2024-01-20'
        },
        {
          id: 2,
          reviewerId: 3,
          reviewerName: 'Mike K.',
          rating: 4,
          comment: 'Good communication and fair pricing. Would buy again.',
          date: '2024-01-18'
        },
        {
          id: 3,
          reviewerId: 4,
          reviewerName: 'Emma L.',
          rating: 4,
          comment: 'Item was in good condition, pickup was easy to arrange.',
          date: '2024-01-15'
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDeleteListing = async (listingId: number) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        // API call to delete listing
        // await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
        
        setListings(prev => prev.filter(listing => listing.id !== listingId));
        toast.success('Listing deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete listing. Please try again.');
      }
    }
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };

  const handleSaveListing = async (updatedListing: Listing) => {
    try {
      // API call to update listing
      // await fetch(`/api/listings/${updatedListing.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updatedListing)
      // });
      
      setListings(prev => prev.map(listing => 
        listing.id === updatedListing.id ? updatedListing : listing
      ));
      setShowEditModal(false);
      setEditingListing(null);
      toast.success('Listing updated successfully!');
    } catch (error) {
      toast.error('Failed to update listing. Please try again.');
    }
  };

  const handleShareListing = (listing: Listing) => {
    const shareUrl = `${window.location.origin}/marketplace/item/${listing.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Listing link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link. Please try again.');
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`h-4 w-4 ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConditionLabel = (condition: string) => {
    const conditions = {
      '1': 'Like New',
      '2': 'Excellent',
      '3': 'Good',
      '4': 'Fair',
      '5': 'Poor/Broken'
    };
    return conditions[condition as keyof typeof conditions] || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {userProfile?.firstName} {userProfile?.lastName}
                </h2>
                <div className="flex items-center justify-center mt-2">
                  <FaCalendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    Joined {formatDate(userProfile?.joinDate || '')}
                  </span>
                </div>
              </div>

              {/* Rating Display */}
              {userProfile && userProfile.totalRatings >= 5 && (
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    {renderStars(userProfile.averageRating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {userProfile.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Based on {userProfile.totalRatings} reviews
                  </p>
                </div>
              )}

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'listings'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaClipboard className="mr-3 h-4 w-4" />
                  My Listings
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaUser className="mr-3 h-4 w-4" />
                  Profile & Reviews
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'favorites'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaHeart className="mr-3 h-4 w-4" />
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaShoppingCart className="mr-3 h-4 w-4" />
                  Orders
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Active Listings Tab */}
            {activeTab === 'listings' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center">
                    <FaPlus className="mr-2 h-4 w-4" />
                    Add New Listing
                  </button>
                </div>

                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-medium text-gray-900 mr-3">{listing.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              listing.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {listing.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>€{listing.price}</span>
                            <span>•</span>
                            <span>{getConditionLabel(listing.condition)}</span>
                            <span>•</span>
                            <span>Created {formatDate(listing.dateCreated)}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <FaEye className="h-3 w-3 mr-1" />
                              <span>{listing.views} views</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditListing(listing)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Edit listing"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShareListing(listing)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                            title="Share listing"
                          >
                            <FaShare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete listing"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {listings.length === 0 && (
                  <div className="text-center py-12">
                    <FaClipboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-600 mb-4">Start selling your furniture by creating your first listing.</p>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                      Create Your First Listing
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile & Reviews Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile?.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile?.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile?.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Member Since</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(userProfile?.joinDate || '')}</p>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Reviews & Ratings</h2>
                    {userProfile && userProfile.totalRatings >= 5 && (
                      <div className="flex items-center">
                        {renderStars(userProfile.averageRating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {userProfile.averageRating.toFixed(1)} ({userProfile.totalRatings} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {userProfile && userProfile.totalRatings < 5 ? (
                    <div className="text-center py-8">
                      <FaStar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
                      <p className="text-gray-600">
                        You need at least 5 ratings before your average rating is displayed to other users.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{review.reviewerName}</h4>
                              <div className="flex items-center mt-1">
                                {renderStars(review.rating)}
                                <span className="ml-2 text-sm text-gray-500">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Favorite Items</h1>
                <div className="text-center py-12">
                  <FaHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600">Items you favorite will appear here.</p>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>
                <div className="text-center py-12">
                  <FaShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Your purchase history will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Listing Modal */}
      {showEditModal && editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Listing</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveListing(editingListing);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={editingListing.title}
                      onChange={(e) => setEditingListing({...editingListing, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editingListing.description}
                      onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (€)</label>
                    <input
                      type="number"
                      value={editingListing.price}
                      onChange={(e) => setEditingListing({...editingListing, price: Number(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <select
                      value={editingListing.condition}
                      onChange={(e) => setEditingListing({...editingListing, condition: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                      required
                    >
                      <option value="1">Like New</option>
                      <option value="2">Excellent</option>
                      <option value="3">Good</option>
                      <option value="4">Fair</option>
                      <option value="5">Poor/Broken</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingListing(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard; 