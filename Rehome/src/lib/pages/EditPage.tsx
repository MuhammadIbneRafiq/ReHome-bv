import React, { useState } from 'react';
import API_ENDPOINTS from '../api/config';
import { PRICING_TYPES, REHOME_PRICING_TYPES } from '../../types/marketplace';

interface FurnitureItem {
    id: string;
    name: string;
    description: string;
    image_url?: string[];
    price?: number;
    created_at: string;
    city_name: string;
    sold: boolean;
    seller_email: string;
    category?: string;
    subcategory?: string;
    condition_rating?: number;
    
    // New fields
    height_cm?: number;
    width_cm?: number;
    depth_cm?: number;
    pricing_type?: 'fixed' | 'bidding' | 'negotiable';
    starting_bid?: number;
    is_rehome?: boolean;
    has_flexible_dates?: boolean;
    flexible_date_start?: string;
    flexible_date_end?: string;
    preferred_date?: string;
}

interface EditPageProps {
    item: FurnitureItem;
    onClose: () => void;
    onSave: (updatedItem: FurnitureItem) => void;
}

const EditPage = ({ item, onClose, onSave }: EditPageProps) => {
    const [photos, setPhotos] = useState<File[]>([]);
    const [price, setPrice] = useState(item.price?.toString() || '');
    const [description, setDescription] = useState(item.description);
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category || '');
    const [subcategory, setSubcategory] = useState(item.subcategory || '');
    const [conditionRating, setConditionRating] = useState(item.condition_rating?.toString() || '');
    
    // Dimensions (optional)
    const [height, setHeight] = useState(item.height_cm?.toString() || '');
    const [width, setWidth] = useState(item.width_cm?.toString() || '');
    const [depth, setDepth] = useState(item.depth_cm?.toString() || '');
    
    // Pricing
    const [pricingType, setPricingType] = useState<'fixed' | 'bidding' | 'negotiable'>(item.pricing_type || 'fixed');
    const [startingBid, setStartingBid] = useState(item.starting_bid?.toString() || '');
    
    // ReHome listing flag
    const [isRehome, setIsRehome] = useState(item.is_rehome || false);
    
    // Flexible date options
    // const [hasFlexibleDates, setHasFlexibleDates] = useState(item.has_flexible_dates || false);
    // const [flexibleDateStart, setFlexibleDateStart] = useState(item.flexible_date_start || '');
    // const [flexibleDateEnd, setFlexibleDateEnd] = useState(item.flexible_date_end || '');
    // const [preferredDate, setPreferredDate] = useState(item.preferred_date || '');
    
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [cityName, setCityName] = useState(item.city_name);
    const [existingImages, setExistingImages] = useState<string[]>(item.image_url || []);
    // const navigate = useNavigate();

    // Categories and subcategories (same as in SellPage)
    const categories = [
        { 
            name: 'Bathroom Furniture', 
            subcategories: [] 
        },
        { 
            name: 'Sofa\'s and Chairs', 
            subcategories: [
                'Sofa',
                'Armchairs',
                'Office Chair/ Bureuaustoel',
                'Chairs',
                'Kussens'
            ] 
        },
        { 
            name: 'Kasten', 
            subcategories: [
                'Closet (Kleidingkast)',
                'Bookcase (Boekenkast)',
                'Drawer/ Dressoir',
                'TV Tables'
            ] 
        },
        { 
            name: 'Bedroom', 
            subcategories: [] 
        },
        { 
            name: 'Tables', 
            subcategories: [
                'Office Table (Bureau)',
                'Dining Table',
                'Sidetables',
                'Coffee Table'
            ] 
        },
        { 
            name: 'Appliances', 
            subcategories: [
                'Washing Machine',
                'Fridge',
                'Freezer',
                'Others'
            ] 
        },
        { 
            name: 'Mirrors', 
            subcategories: [] 
        },
        { 
            name: 'Lamps', 
            subcategories: [] 
        },
        { 
            name: 'Carpets', 
            subcategories: [] 
        },
        { 
            name: 'Curtains', 
            subcategories: [] 
        },
        { 
            name: 'Plants', 
            subcategories: [] 
        },
        { 
            name: 'Vazes', 
            subcategories: [] 
        },
        { 
            name: 'Kitchen equipment', 
            subcategories: [] 
        },
        { 
            name: 'Others', 
            subcategories: [] 
        }
    ];

    // Condition options
    const conditions = [
        { value: '1', label: 'Like New - Almost no signs of use, very well maintained' },
        { value: '2', label: 'Excellent - Minimal wear, barely noticeable imperfections' },
        { value: '3', label: 'Good - Visible signs of wear (scratches, small dents), but fully functional' },
        { value: '4', label: 'Fair - Heavily used with noticeable wear, may need minor repairs' },
        { value: '5', label: 'Poor/Broken - Significant damage or functional issues, may require major repairs' }
    ];

    // Handle category change
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value);
        setSubcategory(''); // Reset subcategory when category changes
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        if (e.target.files) {
            setPhotos(Array.from(e.target.files));
        }
    };

    const removeExistingImage = (indexToRemove: number) => {
        setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Handle ReHome checkbox change
    const handleRehomeChange = (checked: boolean) => {
        setIsRehome(checked);
        // If switching to ReHome and bidding is selected, reset to fixed price
        if (checked && pricingType === 'bidding') {
            setPricingType('fixed');
            setStartingBid('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitting(true);

        try {
            // 1. Upload new images if any
            const uploadedImageUrls: string[] = [];
            if (photos.length > 0) {
                setUploading(true);
                for (const photo of photos) {
                    const formData = new FormData();
                    formData.append('photos', photo);
                    const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD.PHOTOS, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error(`HTTP upload error! status: ${uploadResponse.status}`);
                    }
                    const uploadData = await uploadResponse.json();
                    uploadedImageUrls.push(...uploadData.imageUrls);
                }
                setUploading(false);
            }

            // Combine existing images with newly uploaded images
            const allImageUrls = [...existingImages, ...uploadedImageUrls];

            // 2. Update the listing data
            const response = await fetch(API_ENDPOINTS.FURNITURE.UPDATE(item.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    name,
                    description,
                    category,
                    subcategory: subcategory || null,
                    conditionRating: conditionRating ? parseInt(conditionRating) : null,
                    
                    // Dimensions (optional)
                    height: height ? parseFloat(height) : null,
                    width: width ? parseFloat(width) : null,
                    depth: depth ? parseFloat(depth) : null,
                    
                    // Pricing
                    pricingType,
                    price: pricingType === 'fixed' && price ? parseFloat(price) : null,
                    startingBid: pricingType === 'bidding' && startingBid ? parseFloat(startingBid) : null,
                    
                    imageUrl: allImageUrls,
                    cityName,
                    isRehome,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update listing`);
            }

            // const updatedData = await response.json();
            
            // Create updated item object
            const updatedItem: FurnitureItem = {
                ...item,
                name,
                description,
                category,
                subcategory: subcategory || undefined,
                condition_rating: conditionRating ? parseInt(conditionRating) : undefined,
                
                // Dimensions
                height_cm: height ? parseFloat(height) : undefined,
                width_cm: width ? parseFloat(width) : undefined,
                depth_cm: depth ? parseFloat(depth) : undefined,
                
                // Pricing
                pricing_type: pricingType,
                price: pricingType === 'fixed' && price ? parseFloat(price) : undefined,
                starting_bid: pricingType === 'bidding' && startingBid ? parseFloat(startingBid) : undefined,
                
                image_url: allImageUrls,
                city_name: cityName,
            };

            onSave(updatedItem);
            onClose();
        } catch (err: any) {
            console.error('Error updating listing:', err);
            setSubmitError(err.message || 'Failed to update listing.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Edit Your Listing</h1>
                <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                    ×
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Furniture Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="e.g., Cozy Sofa"
                        required
                    />
                </div>

                {/* Category Selection */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={handleCategoryChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat.name} value={cat.name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subcategory Selection (if applicable) */}
                {category && categories.find(c => c.name === category)?.subcategories && categories.find(c => c.name === category)!.subcategories.length > 0 && (
                    <div>
                        <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                            Subcategory
                        </label>
                        <select
                            id="subcategory"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            <option value="">Select a subcategory (optional)</option>
                            {categories
                                .find(c => c.name === category)
                                ?.subcategories.map(sub => (
                                    <option key={sub} value={sub}>
                                        {sub}
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                {/* Condition Rating */}
                <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                        Condition
                    </label>
                    <select
                        id="condition"
                        value={conditionRating}
                        onChange={(e) => setConditionRating(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="">Select condition</option>
                        {conditions.map(condition => (
                            <option key={condition.value} value={condition.value}>
                                {condition.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dimensions (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dimensions (Optional)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="height" className="block text-xs text-gray-600 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                id="height"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label htmlFor="width" className="block text-xs text-gray-600 mb-1">Width (cm)</label>
                            <input
                                type="number"
                                id="width"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label htmlFor="depth" className="block text-xs text-gray-600 mb-1">Depth (cm)</label>
                            <input
                                type="number"
                                id="depth"
                                value={depth}
                                onChange={(e) => setDepth(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Providing dimensions helps buyers make better decisions</p>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Images
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {existingImages.map((imageUrl, index) => (
                                <div key={index} className="relative">
                                    <img 
                                        src={imageUrl} 
                                        alt={`Current ${index}`} 
                                        className="h-20 w-20 object-cover rounded-md border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add New Photos */}
                <div>
                    <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                        Add New Photos (Optional)
                    </label>
                    <input
                        type="file"
                        id="photos"
                        multiple
                        onChange={handlePhotoChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {uploading && <p className="text-blue-600 text-sm mt-1">Uploading images...</p>}
                    {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
                </div>

                {/* ReHome Listing Checkbox */}
                <div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is-rehome"
                            checked={isRehome}
                            onChange={(e) => handleRehomeChange(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is-rehome" className="ml-2 block text-sm text-gray-700">
                            This is a ReHome listing
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        ReHome listings have special pricing options and cannot use bidding
                    </p>
                </div>

                {/* Pricing Options */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Pricing *
                    </label>
                    
                    {/* Pricing Type Selection */}
                    <div className="space-y-3 mb-4">
                        {(isRehome ? REHOME_PRICING_TYPES : PRICING_TYPES).map((type) => (
                            <div key={type.value} className="flex items-center">
                                <input
                                    id={`pricing-${type.value}`}
                                    name="pricing-type"
                                    type="radio"
                                    value={type.value}
                                    checked={pricingType === type.value}
                                    onChange={(e) => setPricingType(e.target.value as 'fixed' | 'bidding' | 'negotiable')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <label htmlFor={`pricing-${type.value}`} className="ml-3 block text-sm text-gray-700">
                                    {type.label}
                                </label>
                            </div>
                        ))}
                    </div>

                    {isRehome && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <p className="text-sm text-orange-800">
                                🏠 <strong>ReHome Listing:</strong> Bidding is not available for ReHome listings. Choose between fixed price or negotiable pricing.
                            </p>
                        </div>
                    )}

                    {/* Conditional Price/Bid Fields */}
                    {pricingType === 'fixed' && (
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Fixed Price (€) *
                            </label>
                            <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    )}

                    {pricingType === 'bidding' && (
                        <div>
                            <label htmlFor="startingBid" className="block text-sm font-medium text-gray-700">
                                Starting Bid (€) *
                            </label>
                            <input
                                type="number"
                                id="startingBid"
                                value={startingBid}
                                onChange={(e) => setStartingBid(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Set a minimum bid to start the auction</p>
                        </div>
                    )}

                    {pricingType === 'negotiable' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                💬 Buyers will contact you to negotiate the price. Make sure to include any price expectations in the description.
                            </p>
                        </div>
                    )}
                </div>

                {/* Description Input */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="Describe your furniture..."
                        required
                    />
                </div>

                {/* City Input */}
                <div>
                    <label htmlFor="cityName" className="block text-sm font-medium text-gray-700">
                        City
                    </label>
                    <input
                        type="text"
                        id="cityName"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="e.g., Amsterdam"
                        required
                    />
                </div>

                {submitError && (
                    <div className="text-red-500 text-sm">{submitError}</div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                        {submitting ? 'Updating...' : 'Update Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditPage; 