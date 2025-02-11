import React, { useState } from 'react';

const ItemMovingPage = () => {
  const [firstLocation, setFirstLocation] = useState('');
  const [secondLocation, setSecondLocation] = useState('');
  const [itemList, setItemList] = useState<{ [key: string]: boolean }>({});
  const [floorPickup, setFloorPickup] = useState('');
  const [floorDropoff, setFloorDropoff] = useState('');
  const [disassembly, setDisassembly] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [pickupDay, setPickupDay] = useState('');
  const [deliveryDay, setDeliveryDay] = useState('');
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
      firstLocation,
      secondLocation,
      itemList,
      floorPickup,
      floorDropoff,
      disassembly,
      photos,
      pickupDay,
      deliveryDay,
      contactInfo,
    });
    alert('Moving request submitted (mock)');
  };

  const furnitureItems = [
    { id: 'sofa', name: 'Sofa' },
    { id: 'table', name: 'Table' },
    { id: 'bed', name: 'Bed' },
    { id: 'tv', name: 'TV' },
    { id: 'fridge', name: 'Fridge' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow-400 to-red-500 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
            Item Moving Request
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Location */}
            <div>
              <label htmlFor="firstLocation" className="block text-sm font-medium text-gray-700">
                First Location (Postcode or City)
              </label>
              <input
                type="text"
                id="firstLocation"
                value={firstLocation}
                onChange={(e) => setFirstLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., 1234 AB, Amsterdam"
              />
            </div>

            {/* Second Location */}
            <div>
              <label htmlFor="secondLocation" className="block text-sm font-medium text-gray-700">
                Second Location (Postcode or City)
              </label>
              <input
                type="text"
                id="secondLocation"
                value={secondLocation}
                onChange={(e) => setSecondLocation(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., 5678 CD, Rotterdam"
              />
            </div>

            {/* Item List */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Item List (Check the items to be moved)
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {furnitureItems.map((item) => (
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

            {/* Floor Preference */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="floorPickup" className="block text-sm font-medium text-gray-700">
                  Floor (Pickup)
                </label>
                <input
                  type="number"
                  id="floorPickup"
                  value={floorPickup}
                  onChange={(e) => setFloorPickup(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., 2 (2nd Floor)"
                />
              </div>
              <div>
                <label htmlFor="floorDropoff" className="block text-sm font-medium text-gray-700">
                  Floor (Drop-off)
                </label>
                <input
                  type="number"
                  id="floorDropoff"
                  value={floorDropoff}
                  onChange={(e) => setFloorDropoff(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., 1 (Ground Floor)"
                />
              </div>
            </div>

            {/* Disassembly */}
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="disassembly"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={disassembly}
                  onChange={(e) => setDisassembly(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="disassembly" className="font-medium text-gray-700">
                  Require us to take the furniture apart? (Extra charge may apply)
                </label>
              </div>
            </div>

            {/* Photos */}
            <div>
              <label htmlFor="photos" className="block text-sm font-medium text-gray-700">
                Photos (Packed/Unpacked Items)
              </label>
              <input
                type="file"
                id="photos"
                multiple
                onChange={handlePhotoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
              />
              {photos.length > 0 && (
                <div className="mt-2">
                  {photos.map((photo, index) => (
                    <img key={index} src={URL.createObjectURL(photo)} alt={`Preview ${index}`} className="inline-block h-16 w-16 rounded-md mr-2" />
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Pickup Day */}
            <div>
              <label htmlFor="pickupDay" className="block text-sm font-medium text-gray-700">
                Preferred Pickup Day
              </label>
              <input
                type="date"
                id="pickupDay"
                value={pickupDay}
                onChange={(e) => setPickupDay(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Preferred Delivery Day */}
            <div>
              <label htmlFor="deliveryDay" className="block text-sm font-medium text-gray-700">
                Preferred Delivery Day
              </label>
              <input
                type="date"
                id="deliveryDay"
                value={deliveryDay}
                onChange={(e) => setDeliveryDay(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
              >
                Submit Moving Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemMovingPage;