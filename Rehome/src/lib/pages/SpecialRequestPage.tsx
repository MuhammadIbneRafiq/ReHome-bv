import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'; // Import axios for making HTTP requests

type ServiceFieldsType = {
  [key: string]: string[];
};
const serviceFields: ServiceFieldsType = {
  fullHouseMove: [
    'pickupAddress', 'dropoffAddress', 'itemSelection', 'addons', 'date', 'preferredTimeSpan', 'contactInfo', 'photos'
  ],
  internationalMove: [
    'pickupAddress', 'dropoffAddress', 'itemSelection', 'addons', 'date', 'preferredTimeSpan', 'contactInfo', 'photos'
  ],
  temporaryItemStorage: [
    'storageDate', 'itemSelection', 'pickupAddress', 'dropoffAddress', 'contactInfo', 'photos'
  ],
  junkRemoval: [
    'address', 'itemDescription', 'removalDate', 'contactInfo', 'photos'
  ]
};

const SpecialRequestPage = () => {
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({});
  const [fields, setFields] = useState<any>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmation, setConfirmation] = useState('');

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices({
      ...selectedServices,
      [serviceId]: !selectedServices[serviceId],
    });
    setFields({});
    setPhotos([]);
    setErrors({});
    setConfirmation('');
  };

  const handleFieldChange = (field: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};
    const selected = Object.keys(selectedServices).filter((k) => selectedServices[k]);
    if (selected.length === 0) {
      newErrors.selectedServices = 'Please select at least one service.';
      isValid = false;
    }
    selected.forEach((service) => {
      serviceFields[service].forEach((field) => {
        if (!fields[field] && field !== 'photos') {
          newErrors[field] = 'This field is required.';
          isValid = false;
        }
      });
    });
    // Phone/email validation
    if (fields.contactInfo) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!phoneRegex.test(fields.contactInfo) && !emailRegex.test(fields.contactInfo)) {
        newErrors.contactInfo = 'Please enter a valid phone number or email.';
        isValid = false;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const requestData = {
      selectedServices,
      fields,
      photos: photos.map((file) => file.name), // For now, just send file names
    };
    try {
      await axios.post('https://rehome-backend.vercel.app/api/special-request', requestData);
      setConfirmation('We will review your request and be in touch. Please check your email.');
      setSelectedServices({});
      setFields({});
      setPhotos([]);
      setErrors({});
    } catch (error: any) {
      setConfirmation('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const services = [
    { id: 'fullHouseMove', name: 'Full house move' },
    { id: 'internationalMove', name: 'International move/ transport' },
    { id: 'temporaryItemStorage', name: 'Temporary Item storage' },
    { id: 'junkRemoval', name: 'Junk removal' },
  ];

  // Helper to show fields for selected service(s)
  const selected = Object.keys(selectedServices).filter((k) => selectedServices[k]);
  const showField = (field: string) => selected.some((service) => serviceFields[service].includes(field));

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
            Special Request
          </h1>
          {confirmation && <div className="mb-4 text-green-700 font-semibold text-center">{confirmation}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select the Services You Need
              </label>
              {errors.selectedServices && (
                <p className="text-red-500 text-sm">{errors.selectedServices}</p>
              )}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={service.id}
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedServices[service.id] || false}
                        onChange={() => handleServiceChange(service.id)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={service.id} className="font-medium text-gray-700">
                        {service.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Fields */}
            {showField('pickupAddress') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Address</label>
                <input
                  type="text"
                  value={fields.pickupAddress || ''}
                  onChange={e => handleFieldChange('pickupAddress', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Street, City, Postal Code"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Start typing and select your street from the list (auto-complete coming soon).</p>
                {errors.pickupAddress && <p className="text-red-500 text-sm">{errors.pickupAddress}</p>}
              </div>
            )}
            {showField('dropoffAddress') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Dropoff Address</label>
                <input
                  type="text"
                  value={fields.dropoffAddress || ''}
                  onChange={e => handleFieldChange('dropoffAddress', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Street, City, Postal Code"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Start typing and select your street from the list (auto-complete coming soon).</p>
                {errors.dropoffAddress && <p className="text-red-500 text-sm">{errors.dropoffAddress}</p>}
              </div>
            )}
            {showField('itemSelection') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Item Selection</label>
                <textarea
                  value={fields.itemSelection || ''}
                  onChange={e => handleFieldChange('itemSelection', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="List or describe the items (categories/headings coming soon)"
                  required
                />
                {errors.itemSelection && <p className="text-red-500 text-sm">{errors.itemSelection}</p>}
              </div>
            )}
            {showField('addons') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Floor</label>
                  <input
                    type="text"
                    value={fields.pickupFloor || ''}
                    onChange={e => handleFieldChange('pickupFloor', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g. 2 (2nd Floor)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropoff Floor</label>
                  <input
                    type="text"
                    value={fields.dropoffFloor || ''}
                    onChange={e => handleFieldChange('dropoffFloor', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g. 1 (Ground Floor)"
                    required
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2 mt-2">
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={fields.elevatorPickup || false} onChange={e => handleFieldChange('elevatorPickup', e.target.checked)} className="form-checkbox text-indigo-600" />
                    <span className="ml-2">Elevator available at Pickup?</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={fields.elevatorDropoff || false} onChange={e => handleFieldChange('elevatorDropoff', e.target.checked)} className="form-checkbox text-indigo-600" />
                    <span className="ml-2">Elevator available at Dropoff?</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={fields.disassembly || false} onChange={e => handleFieldChange('disassembly', e.target.checked)} className="form-checkbox text-indigo-600" />
                    <span className="ml-2">Require disassembly?</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={fields.carrying || false} onChange={e => handleFieldChange('carrying', e.target.checked)} className="form-checkbox text-indigo-600" />
                    <span className="ml-2">Require carrying assistance?</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={fields.extraHelper || false} onChange={e => handleFieldChange('extraHelper', e.target.checked)} className="form-checkbox text-indigo-600" />
                    <span className="ml-2">Require extra helper?</span>
                  </label>
                </div>
              </div>
            )}
            {showField('date') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Date</label>
                <input
                  type="date"
                  value={fields.date || ''}
                  onChange={e => handleFieldChange('date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>
            )}
            {showField('preferredTimeSpan') && (
              <div className="mt-2">
                <label htmlFor="preferredTimeSpan" className="block text-sm font-medium text-gray-700">Preferred Time Span</label>
                <select
                  id="preferredTimeSpan"
                  value={fields.preferredTimeSpan || ''}
                  onChange={e => handleFieldChange('preferredTimeSpan', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a time span</option>
                  <option value="8-12">8-12</option>
                  <option value="12-16">12-16</option>
                  <option value="16-20">16-20</option>
                </select>
                {errors.preferredTimeSpan && <p className="text-red-500 text-sm">{errors.preferredTimeSpan}</p>}
              </div>
            )}
            {showField('storageDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Duration of Storage</label>
                <input
                  type="text"
                  value={fields.storageDate || ''}
                  onChange={e => handleFieldChange('storageDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter start and end date or estimated duration"
                  required
                />
                {errors.storageDate && <p className="text-red-500 text-sm">{errors.storageDate}</p>}
              </div>
            )}
            {showField('address') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Address / Location</label>
                <input
                  type="text"
                  value={fields.address || ''}
                  onChange={e => handleFieldChange('address', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Street, City, Postal Code"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Start typing and select your street from the list (auto-complete coming soon).</p>
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>
            )}
            {showField('itemDescription') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Describe/List Items</label>
                <textarea
                  value={fields.itemDescription || ''}
                  onChange={e => handleFieldChange('itemDescription', e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe or list the items to be removed"
                  required
                />
                {errors.itemDescription && <p className="text-red-500 text-sm">{errors.itemDescription}</p>}
              </div>
            )}
            {showField('removalDate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Latest Removal Date</label>
                <input
                  type="date"
                  value={fields.removalDate || ''}
                  onChange={e => handleFieldChange('removalDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                {errors.removalDate && <p className="text-red-500 text-sm">{errors.removalDate}</p>}
              </div>
            )}
            {/* Contact Info */}
            {showField('contactInfo') && (
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                  Contact Information
                </label>
                {errors.contactInfo && (
                  <p className="text-red-500 text-sm">{errors.contactInfo}</p>
                )}
                <input
                  type="text"
                  id="contactInfo"
                  value={fields.contactInfo || ''}
                  onChange={e => handleFieldChange('contactInfo', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Phone number or email"
                  required
                />
              </div>
            )}
            {/* Attach Photos */}
            {showField('photos') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Attach Photos (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((file, idx) => (
                      <img key={idx} src={URL.createObjectURL(file)} alt={`Preview ${idx+1}`} className="inline-block h-20 w-20 rounded-md object-cover" />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`rehome-button ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpecialRequestPage;