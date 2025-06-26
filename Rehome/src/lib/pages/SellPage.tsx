import React, { useState } from 'react';
import API_ENDPOINTS from '../api/config';
import LocationAutocomplete from '../../components/ui/LocationAutocomplete';
import { PRICING_TYPES } from '../../types/marketplace';
import useUserStore from '../../services/state/useUserSessionStore';
import { FaTimes } from 'react-icons/fa';

// Location suggestion interface (same as in LocationAutocomplete)
interface LocationSuggestion {
    display_name: string;
    lat: string;
    lon: string;
    place_id: string;
    address?: {
        house_number?: string;
        road?: string;
        city?: string;
        postcode?: string;
        country?: string;
    };
}



const SellPage = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
    // Get current user from the store
    const user = useUserStore((state) => state.user);
    


    const [photos, setPhotos] = useState<File[]>([]);
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [name, setName] = useState(''); // Added name field
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [conditionRating, setConditionRating] = useState('');
    
    // Dimensions (optional)
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [depth, setDepth] = useState('');
    
    // Pricing
    const [pricingType, setPricingType] = useState<'fixed' | 'bidding' | 'negotiable' | 'free'>('fixed');
    const [startingBid, setStartingBid] = useState('');
    
    // ReHome listing flag - set to false for all users (only admins can create ReHome listings through admin panel)
    const [isRehome] = useState(false);
    
    // Flexible date options
    const [hasFlexibleDates] = useState(false);
    const [flexibleDateStart] = useState('');
    const [flexibleDateEnd] = useState('');
    const [preferredDate] = useState('');
    
    const [imageUrls] = useState<string[]>([]); // State for the image URLS, array.
    const [uploading, setUploading] = useState(false); // Loading state for upload
    const [submitting, setSubmitting] = useState(false); // Loading state for submit
    const [uploadError, setUploadError] = useState<string | null>(null); // Error state for upload
    const [submitError, setSubmitError] = useState<string | null>(null); // Error state for submit
    const [cityName, setCityName] = useState(''); // Added city name.
    const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    
    // Terms and Conditions agreement state
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Categories and subcategories (same as in MarketplaceFilter)
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

    // Handle location change with coordinates
    const handleLocationChange = async (value: string, suggestion?: LocationSuggestion) => {
        setCityName(value);
        setIsLocationLoading(true);

        if (suggestion) {
            setLocationCoords({
                lat: parseFloat(suggestion.lat),
                lon: parseFloat(suggestion.lon)
            });
        } else if (value === '') {
            setLocationCoords(null);
        }
        
        setIsLocationLoading(false);
    };



    // Handle Terms of Service viewing
    const handleViewTerms = async () => {
        try {
            window.open(API_ENDPOINTS.LEGAL.TERMS_OF_SERVICE, '_blank');
        } catch (error) {
            console.error('Error opening Terms of Service:', error);
        }
    };

    // Handle Privacy Policy viewing
    const handleViewPrivacy = async () => {
        try {
            window.open(API_ENDPOINTS.LEGAL.PRIVACY_POLICY, '_blank');
        } catch (error) {
            console.error('Error opening Privacy Policy:', error);
        }
    };

    // Handle terms acceptance and track progress
    const handleTermsAcceptance = async (checked: boolean) => {
        setAgreedToTerms(checked);
        
        if (checked && user) {
            try {
                // Send acceptance to backend to track progress
                await fetch(API_ENDPOINTS.LEGAL.ACCEPT_TERMS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                    body: JSON.stringify({
                        userId: user.sub, // Use 'sub' field from UserData
                        acceptedAt: new Date().toISOString(),
                        termsVersion: '1.0', // You can version your terms
                        privacyVersion: '1.0'
                    }),
                });
                setTermsAccepted(true);
                console.log('Terms acceptance recorded successfully');
            } catch (error) {
                console.error('Error recording terms acceptance:', error);
                // Don't prevent the user from continuing if logging fails
            }
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null); 
        if (e.target.files) {
          setPhotos(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null); // Clear any previous submit errors
        setSubmitting(true);

        // Check if terms are agreed to
        if (!agreedToTerms) {
            setSubmitError('You must agree to the Terms of Service and Privacy Policy before submitting.');
            setSubmitting(false);
            return;
        }

        // Frontend validation - check all required fields
        const validationErrors = [];
        
        if (!name.trim()) {
            validationErrors.push('Furniture name is required');
        }
        
        if (!description.trim()) {
            validationErrors.push('Description is required');
        }
        
        if (!category.trim()) {
            validationErrors.push('Category is required');
        }
        
        if (!conditionRating) {
            validationErrors.push('Condition rating is required');
        }
        
        if (!cityName.trim()) {
            validationErrors.push('Location is required');
        }
        
        // Pricing validation
        if (pricingType === 'fixed' && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
            validationErrors.push('Valid price is required for fixed pricing');
        }
        
        if (pricingType === 'bidding' && (!startingBid || isNaN(parseFloat(startingBid)) || parseFloat(startingBid) <= 0)) {
            validationErrors.push('Valid starting bid is required for auction pricing');
        }
        
        // Note: Free pricing type doesn't require price validation
        
        if (validationErrors.length > 0) {
            setSubmitError(`Please fix the following issues: ${validationErrors.join(', ')}`);
            setSubmitting(false);
            return;
        }

        try {
            // 1. Upload all the images with automatic format conversion
            const uploadedImageUrls: string[] = [];
            if (photos.length > 0) {
                setUploading(true);
                
                // Check if any photos are HEIC format
                const heicPhotos = photos.filter(photo => 
                    photo.name.toLowerCase().includes('.heic') || 
                    photo.name.toLowerCase().includes('.heif')
                );
                
                if (heicPhotos.length > 0) {
                    console.log(`Converting ${heicPhotos.length} HEIC images to web-compatible format...`);
                }
                
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
                    
                    // Log conversion details if any
                    if (uploadData.conversions && uploadData.conversions.length > 0) {
                        uploadData.conversions.forEach((conversion: any) => {
                            console.log(`✅ Converted ${conversion.original} (${conversion.originalFormat}) to ${conversion.converted} (${conversion.outputFormat})`);
                            console.log(`Size reduced: ${Math.round((1 - conversion.convertedSize / conversion.originalSize) * 100)}%`);
                        });
                    }
                    
                    uploadedImageUrls.push(...uploadData.imageUrls);
                }
                setUploading(false);
            }

            // Debug log the data being sent
            const listingData = {
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
                
                imageUrl: uploadedImageUrls, // Use the image URLs array
                cityName, // Include city name
                latitude: locationCoords?.lat || null,
                longitude: locationCoords?.lon || null,
                isRehome, // Include ReHome flag
                
                // Flexible dates
                hasFlexibleDates,
                flexibleDateStart: hasFlexibleDates && flexibleDateStart ? flexibleDateStart : null,
                flexibleDateEnd: hasFlexibleDates && flexibleDateEnd ? flexibleDateEnd : null,
                preferredDate: hasFlexibleDates && preferredDate ? preferredDate : null,
                
                // Terms acceptance
                termsAccepted: true,
                termsAcceptedAt: new Date().toISOString(),
            };
            
            console.log('Submitting listing data:', listingData);

            // Check if user is authenticated
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('You must be logged in to create a listing. Please log in and try again.');
            }

            console.log('Using token:', token ? 'Token present' : 'No token');

            // 2.  Send the listing data
            const response = await fetch(API_ENDPOINTS.FURNITURE.CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include the token
                },
                body: JSON.stringify(listingData),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

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
                
                throw new Error(errorData.error || errorData.message || `Failed to create listing (${response.status})`);
            }

            const data = await response.json();
            console.log('Listing created:', data); // Debug: Check the response
            // Close the modal and trigger success callback for navigation
            onClose(); // Close the modal after successful submission
            if (onSuccess) {
                onSuccess(); // Trigger success callback for navigation
            }
        } catch (err: any) {
            console.error('Error submitting listing:', err);
            setSubmitError(err.message || 'Failed to submit listing.');
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
       <div className="w-full relative">
            {/* Close Button - styled like ItemDetailModal */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 z-[1010] hover:bg-gray-200 transition"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="flex items-center mb-4 pr-14">
                <h1 className="text-2xl font-bold">Sell Your Furniture</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Furniture Name *
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
                        Category *
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={handleCategoryChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
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
                        Condition *
                    </label>
                    <select
                        id="condition"
                        value={conditionRating}
                        onChange={(e) => setConditionRating(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
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

                <div>
                    <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                        Photos
                    </label>
                    <input
                        type="file"
                        id="photos"
                        multiple  // Allow multiple file selection (optional)
                        onChange={handlePhotoChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {uploading && <p>Uploading image...</p>}
                    {uploadError && <p className="text-red-500">{uploadError}</p>}
                    {imageUrls.length > 0 && ( // Display image preview if imageUrl is available
                        <div className="mt-2">
                            {imageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Preview ${index}`} className="inline-block h-16 w-16 rounded-md mr-2" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location *
                    </label>
                    <LocationAutocomplete
                        value={cityName}
                        onChange={handleLocationChange}
                        placeholder="Enter city or address"
                        countryCode="nl"
                        className="mt-1"
                    />
                    {isLocationLoading && (
                        <div className="flex items-center mt-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-2"></div>
                            <span className="text-sm text-gray-500">Verifying location...</span>
                        </div>
                    )}
                    {locationCoords && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ Location verified with OpenStreetMap
                        </p>
                    )}
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
                                Price (€) *
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

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description *
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

                {/* Terms and Conditions agreement */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => handleTermsAcceptance(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                            required
                        />
                        <div className="flex-1">
                            <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
                                Agreement to Terms and Conditions *
                            </label>
                            <p className="text-sm text-gray-600 mb-3">
                                By proceeding, you agree to our Terms of Service and Privacy Policy.
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={handleViewTerms}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                                >
                                    📄 View Terms of Service
                                </button>
                                <button
                                    type="button"
                                    onClick={handleViewPrivacy}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                                >
                                    🔒 View Privacy Policy
                                </button>
                            </div>
                            {termsAccepted && (
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                    <span className="mr-1">✓</span>
                                    Terms acceptance recorded successfully
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {submitError && <p className="text-red-500">{submitError}</p>}
                <div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SellPage;