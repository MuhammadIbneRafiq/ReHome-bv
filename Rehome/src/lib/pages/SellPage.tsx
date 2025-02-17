import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const SellPage = () => {
    const [photos, setPhotos] = useState<File[]>([]);
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [name, setName] = useState(''); // Added name field
    const [imageUrls] = useState<string[]>([]); // State for the image URLS, array.
    const [uploading, setUploading] = useState(false); // Loading state for upload
    const [submitting, setSubmitting] = useState(false); // Loading state for submit
    const [uploadError, setUploadError] = useState<string | null>(null); // Error state for upload
    const [submitError, setSubmitError] = useState<string | null>(null); // Error state for submit
    const [cityName, setCityName] = useState(''); // Added city name.
    const navigate = useNavigate(); // Initialize navigate

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null); // Clear any previous upload errors
        if (e.target.files) {
          setPhotos(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null); // Clear any previous submit errors
        setSubmitting(true);

        try {
            // 1. Upload all the images
            const uploadedImageUrls: string[] = [];
            if (photos.length > 0) {
                setUploading(true);
                for (const photo of photos) {
                    const formData = new FormData();
                    formData.append('photos', photo);
                    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
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

            // 2.  Send the listing data
            const response = await fetch('http://localhost:3000/api/furniture/new', { // Replace with your actual backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include the token
                },
                body: JSON.stringify({
                    name,
                    description,
                    imageUrl: uploadedImageUrls, // Use the image URLs array
                    price: parseFloat(price), // Convert price to a number
                    cityName, // Include city name
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Listing created:', data); // Debug: Check the response
            // Redirect to the dashboard after successful submission
            navigate('/sell-dash'); // Use navigate to redirect
        } catch (err: any) {
            console.error('Error submitting listing:', err);
            setSubmitError(err.message || 'Failed to submit listing.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-purple-400 to-pink-300 py-20 px-4 sm:px-6 lg:px-8 pt-24"> {/* Added pt-24 */}
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
                <div className="px-6 py-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
                        Sell Your Furniture
                    </h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="e.g., Cozy Sofa"
                            />
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

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Price
                            </label>
                            <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="e.g., 299"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Describe your furniture..."
                            />
                        </div>
                        {/* City Input */}
                        <div>
                            <label htmlFor="cityName" className="block text-sm font-medium text-gray-700">
                                City Name (or Postcode)
                            </label>
                            <input
                                type="text"
                                id="cityName"
                                value={cityName}
                                onChange={(e) => setCityName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="e.g., Amsterdam, 1012 AB"
                            />
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
            </div>
        </div>
    );
};

export default SellPage;