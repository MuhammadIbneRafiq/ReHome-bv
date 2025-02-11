import React, { useState } from 'react';

const JunkRemovalPage = () => {
  const [itemList, setItemList] = useState<{ [key: string]: boolean }>({});
  const [pickupLocation, setPickupLocation] = useState('');
  const [floorPreference, setFloorPreference] = useState('');
  const [deadline, setDeadline] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [contactInfo, setContactInfo] = useState('');

  const handleCheckboxChange = (itemId: string) => {
    setItemList({ ...itemList, [itemId]: !itemList[itemId] });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log({
      itemList,
      pickupLocation,
      floorPreference,
      deadline,
      photos,
      contactInfo,
    });
    alert('Junk Removal request submitted (mock)');
  };

  const junkRemovalItems = [
    { id: 'furniture', name: 'Furniture' },
    { id: 'appliances', name: 'Appliances' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'misc', name: 'Miscellaneous' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
            Junk Removal Request
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item List */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Items to be Removed
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {junkRemovalItems.map((item) => (
                  <div key={item.id} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={item.id}
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={itemList[item.id] || false}
                        onChange={() => handleCheckboxChange(item.id)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={item.id} className="font-medium text-gray-700">
                        {item.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pick Up Location */}
            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
                Pick Up Location
              </label>
              <input
                type="text"
                id="pickupLocation"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="City or Address"
              />
            </div>

            {/* Floor Preference */}
            <div>
              <label htmlFor="floorPreference" className="block text-sm font-medium text-gray-700">
                Floor Preference
              </label>
              <input
                type="number"
                id="floorPreference"
                value={floorPreference}
                onChange={(e) => setFloorPreference(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., 1 (Ground Floor)"
              />
            </div>

            {/* Preferred Day/Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Preferred Day/Deadline
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Photos */}
            <div>
              <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                Photos of item/items
              </label>
              <input
                type="file"
                id="photos"
                multiple
                onChange={handlePhotoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photos.length > 0 && (
                <div className="mt-2">
                  {photos.map((photo, index) => (
                    <img key={index} src={URL.createObjectURL(photo)} alt={`Preview ${index}`} className="inline-block h-16 w-16 rounded-md mr-2" />
                  ))}
                </div>
              )}
            </div>

            {/* Contact Info */}
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-300"
              >
                Submit Junk Removal Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JunkRemovalPage;