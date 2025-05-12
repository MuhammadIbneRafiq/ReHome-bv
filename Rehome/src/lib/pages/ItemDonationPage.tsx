import React, { useState } from 'react';

const ItemDonationPage = () => {
  const [mode, setMode] = useState<'free' | 'sell'>('free');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [address, setAddress] = useState('');
  const [floor, setFloor] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    const data = { mode, price, description, condition, photos, address, floor, contactInfo };
    console.log(data);
    alert('Proposal submitted (mock)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-4">Donate or Sell your Furniture to us</h1>
          <div className="mb-6 text-gray-700 text-center">
            <p className="mb-2 font-semibold">We are focused on furniture and house appliances so we are not collecting clothes or other items.</p>
            <ul className="list-disc list-inside text-left mx-auto max-w-xl mb-2">
              <li>We can Collect/Pick up your items from your home. Just fill out the information below and we will be in touch.</li>
              <li>Our mission: Help you easily donate or sell your furniture and support a circular economy.</li>
            </ul>
            <p className="italic text-green-700">You can choose to donate for free or sell your item. Please provide as much detail as possible.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Free or Sell selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Is this a donation or for sale?</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="mode" value="free" checked={mode === 'free'} onChange={() => setMode('free')} className="form-radio text-green-600" />
                  <span className="ml-2">Free (Donation)</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="mode" value="sell" checked={mode === 'sell'} onChange={() => setMode('sell')} className="form-radio text-green-600" />
                  <span className="ml-2">Sell</span>
                </label>
              </div>
            </div>
            {/* Price field if Sell */}
            {mode === 'sell' && (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (€)</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  min="0"
                  placeholder="Enter price"
                  required
                />
              </div>
            )}
            {/* Description and Condition */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description & Condition</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Describe the item and its condition (e.g. Like New, Good, Fair, etc.)"
                required
              />
              <small className="text-gray-500">E.g. Like New – Almost no signs of use, Excellent – Minimal wear, Good – Visible signs of wear, Fair – Heavily used, Poor/Broken – Significant damage.</small>
            </div>
            {/* Multiple Photo Upload */}
            <div>
              <label htmlFor="photos" className="block text-sm font-medium text-gray-700">Product Photos (you can attach multiple)</label>
              <input
                type="file"
                id="photos"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photos.map((file, idx) => (
                    <img key={idx} src={URL.createObjectURL(file)} alt={`Preview ${idx+1}`} className="inline-block h-20 w-20 rounded-md object-cover" />
                  ))}
                </div>
              )}
            </div>
            {/* Address and Floor */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Pickup Address</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="Street, City, Postal Code"
                  required
                />
              </div>
              <div className="w-32">
                <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Floor/Level</label>
                <input
                  type="text"
                  id="floor"
                  value={floor}
                  onChange={e => setFloor(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="e.g. 2nd"
                  required
                />
              </div>
            </div>
            {/* Contact Info */}
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">Contact Information</label>
              <textarea
                id="contactInfo"
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Your contact details (e.g., phone, email)"
                required
              />
            </div>
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
              >
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemDonationPage;