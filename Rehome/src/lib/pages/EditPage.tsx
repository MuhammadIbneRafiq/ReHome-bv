import React, { useState, useEffect } from 'react';
import API_ENDPOINTS from '../api/config';
import { PRICING_TYPES } from '../../types/marketplace';
import { NSFWFileUpload } from '../../components/ui/NSFWFileUpload';
import { getMarketplaceCategoriesDynamic, CONDITION_OPTIONS } from '../../constants/marketplaceConstants';
import { MarketplaceCategory } from '../../services/marketplaceItemDetailsService';

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
    pricing_type?: 'fixed' | 'bidding' | 'negotiable' | 'free';
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
    // Dynamic categories state
    const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Load categories on component mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true);
                const dynamicCategories = await getMarketplaceCategoriesDynamic();
                setCategories(dynamicCategories);
            } catch (error) {
                console.error('Error loading categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
        };
        
        loadCategories();
    }, []);

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
    const [pricingType, setPricingType] = useState<'fixed' | 'bidding' | 'negotiable' | 'free'>(item.pricing_type || 'fixed');
    const [startingBid, setStartingBid] = useState(item.starting_bid?.toString() || '');
    
    // ReHome listing flag
    const [isRehome] = useState(item.is_rehome || false);
    
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

    // Use conditions from constants
    const conditions = CONDITION_OPTIONS;

    // Handle category change
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value);
        setSubcategory(''); // Reset subcategory when category changes
    };



    const removeExistingImage = (indexToRemove: number) => {
        // Warn if trying to remove the last existing photo and no new photos are added
        if (existingImages.length === 1 && photos.length === 0) {
            if (!confirm('This is your last photo. Are you sure you want to remove it? You will need to add a new photo to save your listing.')) {
                return;
            }
        }
        setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitting(true);

        // Validate that at least one photo exists (existing or new)
        if (existingImages.length === 0 && photos.length === 0) {
            setSubmitError('At least one photo is required. Please add a photo or keep at least one existing photo.');
            setSubmitting(false);
            return;
        }

        try {
            // 1. Upload new images if any
            const uploadedImageUrls: string[] = [];
            if (photos.length > 0) {
                setUploading(true);
                
                try {
                    for (const photo of photos) {
                        // Check file size before uploading
                        const fileSizeMB = photo.size / 1024 / 1024;
                        if (fileSizeMB > 50) {
                            throw new Error(`File "${photo.name}" is ${fileSizeMB.toFixed(1)}MB which exceeds the 50MB limit. Please compress or resize your image.`);
                        }
                        
                        console.log(`📤 Uploading file: ${photo.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
                        
                        const formData = new FormData();
                        formData.append('photos', photo);
                        
                        // Add timeout to prevent hanging requests - generous timeout for backend compression
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for image processing
                        
                        const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD.PHOTOS, {
                            method: 'POST',
                            body: formData,
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (!uploadResponse.ok) {
                            // Try to get the error details from the response
                            let errorDetails = `HTTP ${uploadResponse.status}`;
                            try {
                                const errorData = await uploadResponse.json();
                                errorDetails = errorData.error || errorData.message || errorDetails;
                            } catch (e) {
                                // If we can't parse the response, use the status
                                errorDetails = `HTTP ${uploadResponse.status} - ${uploadResponse.statusText}`;
                            }
                            throw new Error(errorDetails);
                        }
                        
                        const uploadData = await uploadResponse.json();
                        uploadedImageUrls.push(...uploadData.imageUrls);
                    }
                } catch (uploadError: any) {
                    console.error('Image upload failed:', uploadError);
                    console.error('Error details:', {
                        name: uploadError.name,
                        message: uploadError.message,
                        stack: uploadError.stack
                    });
                    
                    setUploading(false);
                    setSubmitting(false);
                    
                    // Show retry option for image upload failures
                    const errorMessage = uploadError.message || 'Unknown error occurred';
                    const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error') || errorMessage.includes('NetworkError');
                    const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('aborted') || uploadError.name === 'AbortError';
                    const isFileSizeError = errorMessage.includes('File too large') || errorMessage.includes('413') || errorMessage.includes('Payload Too Large');
                    
                    let retryMessage = 'Image upload failed. ';
                    if (isFileSizeError) {
                        retryMessage += 'File is too large. Please try uploading a smaller image (under 10MB).';
                    } else if (isNetworkError) {
                        retryMessage += `Connection failed. This might be due to file size or network issues. Error: ${errorMessage}`;
                    } else if (isTimeoutError) {
                        retryMessage += 'Upload timed out after 2 minutes. This may happen with very large images. Please try uploading a smaller image (under 5MB) or check your connection speed.';
                    } else {
                        retryMessage += `Error: ${errorMessage}. Please try uploading the same image again, or try a smaller image (under 5MB).`;
                    }
                    
                    setUploadError(retryMessage);
                    return; // Stop the submission process
                }
                setUploading(false);
            }

            // Combine existing images with newly uploaded images
            const allImageUrls = [...existingImages, ...uploadedImageUrls];

            // 2. Update the listing data with retry logic
            let response: Response | null = null;
            let retries = 0;
            const maxRetries = 3;
            
            while (retries < maxRetries) {
                try {
                    // Add timeout for main API request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for API requests
                    
                    response = await fetch(API_ENDPOINTS.FURNITURE.UPDATE(item.id), {
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
                            price: pricingType === 'fixed' && price ? parseFloat(price) : 
                                   pricingType === 'free' ? 0 : null,
                            startingBid: pricingType === 'bidding' && startingBid ? parseFloat(startingBid) : null,
                            
                            imageUrl: allImageUrls,
                            cityName,
                            isRehome,
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // If request was successful, break out of retry loop
                    break;
                    
                } catch (fetchError: any) {
                    retries++;
                    console.error(`Fetch attempt ${retries} failed:`, fetchError);
                    
                    if (retries >= maxRetries) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts. Please check your internet connection and try again.`);
                    }
                    
                    // Wait before retrying (longer delays for backend processing)
                    await new Promise(resolve => setTimeout(resolve, 3000 * retries)); // 3s, 6s, 9s delays
                }
            }

            // Check if we got a response (should always be true if we reach here)
            if (!response) {
                throw new Error('Failed to get response from server. Please try again.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                if (response.status === 403) {
                    throw new Error('Access denied. Please check your permissions.');
                }
                if (response.status === 500) {
                    throw new Error('Server error. Please try again in a few minutes.');
                }
                if (response.status === 504 || response.status === 502) {
                    throw new Error('Server is temporarily unavailable. Please try again.');
                }
                
                throw new Error(errorData.error || errorData.message || `Failed to update listing (${response.status})`);
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
                        disabled={categoriesLoading}
                    >
                        <option value="">
                            {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                        </option>
                        {categories.map((cat: MarketplaceCategory) => (
                            <option key={cat.name} value={cat.name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subcategory Selection (if applicable) */}
                {category && categories.find((c: MarketplaceCategory) => c.name === category)?.subcategories && categories.find((c: MarketplaceCategory) => c.name === category)!.subcategories.length > 0 && (
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
                                .find((c: MarketplaceCategory) => c.name === category)
                                ?.subcategories.map((sub: string) => (
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
                            Current Images *
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
                                        title="Remove this image"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            At least one photo is required. Click × to remove unwanted images.
                        </p>
                    </div>
                )}

                {/* Add New Photos */}
                <div>
                    <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                        Add New Photos {existingImages.length === 0 ? '*' : '(Optional)'}
                    </label>
                    <NSFWFileUpload
                        value={photos}
                        onChange={setPhotos}
                        onRemove={(index) => {
                            const newPhotos = [...photos];
                            newPhotos.splice(index, 1);
                            setPhotos(newPhotos);
                        }}
                        required={existingImages.length === 0}
                        disabled={uploading || submitting}
                    />
                    {uploading && <p className="text-blue-600 text-sm mt-1">Uploading images...</p>}
                    {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
                </div>

                {/* Pricing Options */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Pricing *
                    </label>
                    
                    {/* Pricing Type Selection */}
                    <div className="space-y-3 mb-4">
                        {PRICING_TYPES.map((type) => (
                            <div key={type.value} className="flex items-center">
                                <input
                                    id={`pricing-${type.value}`}
                                    name="pricing-type"
                                    type="radio"
                                    value={type.value}
                                    checked={pricingType === type.value}
                                    onChange={(e) => setPricingType(e.target.value as 'fixed' | 'bidding' | 'negotiable' | 'free')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <label htmlFor={`pricing-${type.value}`} className="ml-3 block text-sm text-gray-700">
                                    {type.label}
                                </label>
                            </div>
                        ))}
                    </div>

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

                    {pricingType === 'free' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                                🎁 This item is offered for free! Buyers will contact you to arrange pickup. Make sure to mention any pickup requirements in the description.
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