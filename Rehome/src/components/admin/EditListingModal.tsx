import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSave, FaPlus, FaTrash, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { MarketplaceListing } from '../../services/adminMarketplaceService';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketplaceListing | null;
  onSave: (id: string, updates: Partial<MarketplaceListing>) => Promise<void>;
  onCreate?: (listing: Partial<MarketplaceListing>) => Promise<void>;
  isCreating?: boolean;
}

const CATEGORIES = [
  'Seating',
  'Tables',
  'Storage',
  'Bedroom',
  'Lighting',
  'Decor',
  'Kitchen',
  'Office',
  'Outdoor',
  'Other'
];

const SUBCATEGORIES = {
  Seating: ['Sofa', 'Chair', 'Stool', 'Bench', 'Recliner'],
  Tables: ['Dining Table', 'Coffee Table', 'Side Table', 'Desk', 'Console'],
  Storage: ['Wardrobe', 'Dresser', 'Bookshelf', 'Cabinet', 'Chest'],
  Bedroom: ['Bed', 'Mattress', 'Nightstand', 'Dresser', 'Mirror'],
  Lighting: ['Table Lamp', 'Floor Lamp', 'Pendant', 'Chandelier', 'Wall Light'],
  Decor: ['Artwork', 'Mirror', 'Plant', 'Rug', 'Cushion'],
  Kitchen: ['Dining Set', 'Bar Stool', 'Kitchen Cart', 'Storage'],
  Office: ['Desk', 'Chair', 'Filing Cabinet', 'Bookshelf'],
  Outdoor: ['Patio Set', 'Garden Chair', 'Umbrella', 'Planter'],
  Other: ['Miscellaneous']
};

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' }
];

const EditListingModal: React.FC<EditListingModalProps> = ({ 
  isOpen, 
  onClose, 
  listing, 
  onSave, 
  onCreate, 
  isCreating = false 
}) => {
  const [formData, setFormData] = useState<Partial<MarketplaceListing>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (listing && !isCreating) {
      setFormData({
        name: listing.name || '',
        description: listing.description || '',
        price: listing.price || 0,
        city_name: listing.city_name || '',
        seller_email: listing.seller_email || '',
        category: listing.category || '',
        subcategory: listing.subcategory || '',
        condition_rating: listing.condition_rating || 5,
        status: listing.status || 'available',
        isrehome: listing.isrehome || false,
      });
      setImageUrls(listing.image_url || []);
    } else if (isCreating) {
      setFormData({
        name: '',
        description: '',
        price: 0,
        city_name: '',
        seller_email: '',
        category: '',
        subcategory: '',
        condition_rating: 5,
        status: 'available',
        isrehome: false,
      });
      setImageUrls([]);
    }
  }, [listing, isCreating, isOpen]);

  const handleInputChange = (field: keyof MarketplaceListing, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !imageUrls.includes(newImageUrl.trim())) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        image_url: imageUrls,
        price: Number(formData.price),
        condition_rating: Number(formData.condition_rating)
      };

      if (isCreating && onCreate) {
        await onCreate(submitData);
        toast.success('Listing created successfully');
      } else if (listing && onSave) {
        await onSave(listing.id, submitData);
        toast.success('Listing updated successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setImageUrls([]);
    setNewImageUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isCreating ? 'Create New Listing' : 'Edit Listing'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (€) *
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Location and Seller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city_name || ''}
                  onChange={(e) => handleInputChange('city_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Email
                </label>
                <input
                  type="email"
                  value={formData.seller_email || ''}
                  onChange={(e) => handleInputChange('seller_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => {
                    handleInputChange('category', e.target.value);
                    handleInputChange('subcategory', ''); // Reset subcategory
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  value={formData.subcategory || ''}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {formData.category && SUBCATEGORIES[formData.category as keyof typeof SUBCATEGORIES]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status || 'available'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition Rating (1-10)
                </label>
                <input
                  type="number"
                  value={formData.condition_rating || 5}
                  onChange={(e) => handleInputChange('condition_rating', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1"
                  max="10"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isrehome"
                  checked={formData.isrehome || false}
                  onChange={(e) => handleInputChange('isrehome', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isrehome" className="text-sm font-medium text-gray-700">
                  ReHome Item
                </label>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              
              {/* Add new image */}
              <div className="flex mb-4">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 transition-colors"
                >
                  <FaPlus />
                </button>
              </div>

              {/* Image list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                    <FaImage className="text-gray-400" />
                    <span className="flex-1 text-sm truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <FaSave />
                <span>{isLoading ? 'Saving...' : isCreating ? 'Create' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditListingModal;