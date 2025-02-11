import React, { useState } from 'react';

const ItemDonationPage = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [contactInfo, setContactInfo] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({ photo, contactInfo });
    alert('Donation request submitted (mock)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
            Donate Your Furniture
          </h1>
          <p className="text-center text-gray-600 mb-6">
            We are focused on furniture and house appliances so we are not collecting clothes or any type of textile as donation.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Product Photo
              </label>
              <input
                type="file"
                id="photo"
                onChange={handlePhotoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {photo && (
                <div className="mt-2">
                  <img src={URL.createObjectURL(photo)} alt="Preview" className="inline-block h-24 w-24 rounded-md" />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                Contact Info
              </label>
              <textarea
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Your contact details (e.g., phone, email)"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
              >
                Submit Donation Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemDonationPage;