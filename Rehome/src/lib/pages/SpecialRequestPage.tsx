import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaWarehouse, FaBroom, FaGlobe, FaCheckCircle } from 'react-icons/fa';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { NSFWFileUpload } from '../../components/ui/NSFWFileUpload';
import { API_ENDPOINTS } from '../api/config';

type ServiceFieldsType = {
  [key: string]: string[];
};

const serviceFields: ServiceFieldsType = {
  storage: [
    'customerName', 'itemDescription', 'storageStartDate', 'storageEndDate', 'pickupPreference', 'contactInfo'
  ],
  junkRemoval: [
    'customerName', 'itemDescription', 'country', 'postal', 'houseNumber', 'city', 'street', 'floor', 'elevatorAvailable', 'earliestRemovalDate', 'removalDate', 'contactInfo'
  ],
  fullInternationalMove: [
    'customerName',
    'pickupCountry', 'pickupPostal', 'pickupHouseNumber', 'pickupCity', 'pickupStreet',
    'dropoffCountry', 'dropoffPostal', 'dropoffHouseNumber', 'dropoffCity', 'dropoffStreet',
    'pickupFloor', 'pickupElevator', 'dropoffFloor', 'dropoffElevator',
    'itemDescription', 'services', 'contactInfo'
  ]
};

// Services for Full/International Move
const fullMoveServices = [
  'disassemblyReassembly',
  'carryingUpstairsDownstairs', 
  'extraHelper',
  'packingService'
];

const SpecialRequestPage = () => {
  // const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string>('');
  const [fields, setFields] = useState<any>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmation, setConfirmation] = useState('');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    if (serviceId === 'junkRemoval') {
      setFields({ country: 'The Netherlands' });
    } else if (serviceId === 'fullInternationalMove') {
      setFields({ pickupCountry: 'The Netherlands', dropoffCountry: 'The Netherlands' });
    } else if (serviceId === 'storage') {
      setFields({ country: 'The Netherlands' });
    } else {
      setFields({});
    }
    setPhotos([]);
    setErrors({});
    setConfirmation('');
    setContactInfo({ phone: '', email: '' });
    setSelectedServices([]);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setContactInfo(prev => ({ ...prev, phone: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(prev => ({ ...prev, email: e.target.value }));
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const buildAddressString = (address: {
    country?: string;
    postal?: string;
    houseNumber?: string;
    addition?: string;
    city?: string;
    street?: string;
  }) => {
    const streetLine = [address.street, address.houseNumber, address.addition].filter(Boolean).join(' ');
    const cityLine = [address.postal, address.city].filter(Boolean).join(' ');
    return [streetLine, cityLine, address.country].filter(Boolean).join(', ');
  };

  const validateForm = () => {
    console.log('🔍 Starting form validation...');
    let isValid = true;
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedService) {
      newErrors.selectedService = 'Please select a service.';
      isValid = false;
      console.log('❌ No service selected');
    }

    if (selectedService) {
      console.log('🔍 Validating fields for service:', selectedService);
      serviceFields[selectedService].forEach((field) => {
        if (field === 'contactInfo') {
          // Skip this field as we now handle phone and email separately
          return;
        }
        if (field === 'services' && selectedService === 'fullInternationalMove') {
          // For fullInternationalMove, check if any services are selected
          if (selectedServices.length === 0) {
            newErrors.services = 'Please select at least one service.';
            isValid = false;
            console.log('❌ No services selected for fullInternationalMove');
          }
          return;
        }
        if (!fields[field] && field !== 'photos') {
          newErrors[field] = 'This field is required.';
          isValid = false;
          console.log('❌ Missing required field:', field);
        }
      });

      // Additional validation for storage home pickup address
      if (selectedService === 'storage' && fields.pickupPreference === 'pickupFromHome') {
        const requiredStorageAddressFields = ['country', 'postal', 'houseNumber', 'city', 'street'];
        requiredStorageAddressFields.forEach((field) => {
          if (!fields[field]) {
            newErrors[field] = 'This field is required.';
            isValid = false;
            console.log('❌ Missing required storage address field:', field);
          }
        });
      }

      // Additional validation for full/international move date fields
      if (selectedService === 'fullInternationalMove' && fields.moveDate) {
        if (fields.moveDate === 'specific' && !fields.specificDate) {
          newErrors.specificDate = 'Please select a specific date.';
          isValid = false;
          console.log('❌ Specific date not selected for specific move date');
        }
        
        if (fields.moveDate === 'flexible') {
          if (!fields.flexibleStartDate) {
            newErrors.flexibleStartDate = 'Please select a start date.';
            isValid = false;
            console.log('❌ Flexible start date not selected');
          }
          if (!fields.flexibleEndDate) {
            newErrors.flexibleEndDate = 'Please select an end date.';
            isValid = false;
            console.log('❌ Flexible end date not selected');
          }
          if (fields.flexibleStartDate && fields.flexibleEndDate && fields.flexibleStartDate > fields.flexibleEndDate) {
            newErrors.flexibleEndDate = 'End date must be after start date.';
            isValid = false;
            console.log('❌ Flexible end date is before start date');
          }
        }
      }
      // Additional validation for junk removal date fields
      if (selectedService === 'junkRemoval') {
        if (fields.earliestRemovalDate && fields.removalDate && fields.earliestRemovalDate > fields.removalDate) {
          newErrors.earliestRemovalDate = 'Earliest removal date must be before or equal to latest removal date.';
          isValid = false;
          console.log('❌ Earliest removal date is after latest removal date');
        }
      }
    }

    // Photo validation - mandatory for all services
    if (photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo.';
      isValid = false;
      console.log('❌ No photos uploaded');
    }

    // Contact info validation - require both phone and email
    if (!contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
      isValid = false;
      console.log('❌ Phone number is empty');
    } else {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(contactInfo.phone)) {
        newErrors.phone = 'Please enter a valid phone number.';
        isValid = false;
        console.log('❌ Invalid phone number format');
      }
    }

    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required.';
      isValid = false;
      console.log('❌ Email is empty');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.email)) {
        newErrors.email = 'Please enter a valid email address.';
        isValid = false;
        console.log('❌ Invalid email address format');
      }
    }

    setErrors(newErrors);
    console.log('✅ Form validation finished. Is valid:', isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Special Request Form Submission Started');
    console.log('📋 Selected Service:', selectedService);
    console.log('📋 Fields:', fields);
    console.log('📋 Contact Info:', contactInfo);
    console.log('📋 Selected Services:', selectedServices);
    console.log('📋 Photos:', photos.length);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    // Validate blocked dates
    const { validateBookingDate } = await import('../../utils/dateValidation');
    
    // Check full/international move dates
    if (selectedService === 'fullInternationalMove' && fields.moveDate) {
      if (fields.moveDate === 'specific' && fields.specificDate) {
        const validation = await validateBookingDate(fields.specificDate);
        if (!validation.isValid) {
          toast.error(validation.message || 'Selected date is not available');
          return;
        }
      } else if (fields.moveDate === 'flexible' && fields.flexibleStartDate && fields.flexibleEndDate) {
        const validation = await validateBookingDate(fields.flexibleStartDate, fields.flexibleEndDate);
        if (!validation.isValid) {
          toast.error(validation.message || 'One or more dates in your range are not available');
          return;
        }
      }
    }
    
    // Check junk removal dates
    if (selectedService === 'junkRemoval') {
      if (fields.earliestRemovalDate && fields.removalDate) {
        const validation = await validateBookingDate(fields.earliestRemovalDate, fields.removalDate);
        if (!validation.isValid) {
          toast.error(validation.message || 'One or more dates in your range are not available');
          return;
        }
      } else if (fields.earliestRemovalDate) {
        const validation = await validateBookingDate(fields.earliestRemovalDate);
        if (!validation.isValid) {
          toast.error(validation.message || 'Selected date is not available');
          return;
        }
      } else if (fields.removalDate) {
        const validation = await validateBookingDate(fields.removalDate);
        if (!validation.isValid) {
          toast.error(validation.message || 'Selected date is not available');
          return;
        }
      }
    }
    
    console.log('✅ Form validation passed, proceeding with submission');
    setIsLoading(true);
    
    try {
      const derivedFields = { ...fields };

      if (selectedService === 'fullInternationalMove') {
        derivedFields.pickupAddress = buildAddressString({
          country: derivedFields.pickupCountry,
          postal: derivedFields.pickupPostal,
          houseNumber: derivedFields.pickupHouseNumber,
          addition: derivedFields.pickupAddition,
          city: derivedFields.pickupCity,
          street: derivedFields.pickupStreet,
        });
        derivedFields.dropoffAddress = buildAddressString({
          country: derivedFields.dropoffCountry,
          postal: derivedFields.dropoffPostal,
          houseNumber: derivedFields.dropoffHouseNumber,
          addition: derivedFields.dropoffAddition,
          city: derivedFields.dropoffCity,
          street: derivedFields.dropoffStreet,
        });
      }

      if (selectedService === 'junkRemoval') {
        derivedFields.address = buildAddressString({
          country: derivedFields.country,
          postal: derivedFields.postal,
          houseNumber: derivedFields.houseNumber,
          addition: derivedFields.addition,
          city: derivedFields.city,
          street: derivedFields.street,
        });
      }

      if (selectedService === 'storage' && derivedFields.pickupPreference === 'pickupFromHome') {
        derivedFields.address = buildAddressString({
          country: derivedFields.country,
          postal: derivedFields.postal,
          houseNumber: derivedFields.houseNumber,
          addition: derivedFields.addition,
          city: derivedFields.city,
          street: derivedFields.street,
        });
      }

      const formData = new FormData();
      formData.append('service', selectedService);
      formData.append('phone', contactInfo.phone);
      formData.append('email', contactInfo.email);
      
      // Add other fields
      Object.keys(derivedFields).forEach(key => {
        if (derivedFields[key]) {
          formData.append(key, derivedFields[key]);
        }
      });

      // Ensure both removal dates are sent for junk removal
      if (selectedService === 'junkRemoval') {
        if (fields.earliestRemovalDate) {
          formData.append('earliestRemovalDate', fields.earliestRemovalDate);
        }
        if (fields.removalDate) {
          formData.append('removalDate', fields.removalDate);
        }
      }

      // Add selected services for full/international move
      if (selectedService === 'fullInternationalMove' && selectedServices.length > 0) {
        formData.append('selectedServices', JSON.stringify(selectedServices));
        formData.append('services', JSON.stringify(selectedServices)); // Also add to services field for backend compatibility
      }

      // Add date-related fields for full/international move
      if (selectedService === 'fullInternationalMove' && fields.moveDate) {
        formData.append('moveDateType', fields.moveDate);
        
        if (fields.moveDate === 'specific' && fields.specificDate) {
          formData.append('specificDate', fields.specificDate);
        }
        
        if (fields.moveDate === 'flexible') {
          if (fields.flexibleStartDate) {
            formData.append('flexibleStartDate', fields.flexibleStartDate);
          }
          if (fields.flexibleEndDate) {
            formData.append('flexibleEndDate', fields.flexibleEndDate);
          }
        }
        
        if (fields.moveDate === 'rehomeChoose') {
          formData.append('rehomeChooseDate', 'true');
        }
      }
      
      // Add photos with correct field name
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      console.log('📤 Preparing to send request to:', API_ENDPOINTS.SPECIAL_REQUESTS.SUBMIT);
      console.log('📤 FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await fetch(API_ENDPOINTS.SPECIAL_REQUESTS.SUBMIT, {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        setConfirmation(result.message || 'Your special request has been submitted successfully!');
        toast.success('Special request submitted successfully!');
        
        // Reset form
        setSelectedService('');
        setFields({});
        setPhotos([]);
        setContactInfo({ phone: '', email: '' });
        setErrors({});
        setSelectedServices([]);
      } else {
        const errorText = await response.text();
        console.error('❌ Response not ok. Status:', response.status);
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to submit request: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error submitting special request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'storage':
        return <FaWarehouse className="text-2xl mb-2 text-orange-500" />;
      case 'junkRemoval':
        return <FaBroom className="text-2xl mb-2 text-orange-500" />;
      case 'fullInternationalMove':
        return <FaGlobe className="text-2xl mb-2 text-orange-500" />;
      default:
        return null;
    }
  };

  const getServiceDisplayName = (serviceId: string) => {
    switch (serviceId) {
      case 'storage':
        return 'Storage Services';
      case 'junkRemoval':
        return 'Junk Removal';
      case 'fullInternationalMove':
        return 'Full & International Moves';
      default:
        return serviceId.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  const getServiceDescription = (serviceId: string) => {
    switch (serviceId) {
      case 'storage':
        return 'Short- and long-term secure storage solutions';
      case 'junkRemoval':
        return 'Responsible disposal and removal services';
      case 'fullInternationalMove':
        return 'Complete relocation services across borders';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Special Request Services
            </h1>
            
            {confirmation ? (
              <div className="text-center py-8">
                <FaCheckCircle className="mx-auto text-green-500 text-6xl mb-4" />
                <h2 className="text-2xl font-bold text-green-600 mb-4">Request submitted successfully and we will get back to you soon after reviewing it!</h2>
                <p className="text-gray-600 mb-6">{confirmation}</p>
                <button
                  onClick={() => setConfirmation('')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Service Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(serviceFields).map((serviceId) => (
                      <button
                        key={serviceId}
                        type="button"
                        onClick={() => handleServiceChange(serviceId)}
                        className={`p-6 border rounded-lg text-center transition-all duration-200 ${
                          selectedService === serviceId
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                            : 'border-gray-300 hover:border-orange-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          {getServiceIcon(serviceId)}
                          <h3 className="font-semibold text-lg mb-2">
                            {getServiceDisplayName(serviceId)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getServiceDescription(serviceId)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.selectedService && <p className="text-red-500 text-sm mt-1">{errors.selectedService}</p>}
                </div>

                {/* Dynamic Fields based on selected service */}
                {selectedService && (
                  <div className="space-y-6">
                    {/* Special Requests Title */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900">Special Requests</h2>
                    </div>

                    {selectedService === 'storage' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">For Item Storage</h3>
                        
                        {/* Date and Duration of Storage */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Storage Start Date
                            </label>
                            <input
                              type="date"
                              value={fields.storageStartDate || ''}
                              onChange={(e) => handleFieldChange('storageStartDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors.storageStartDate && <p className="text-red-500 text-sm mt-1">{errors.storageStartDate}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Storage End Date
                            </label>
                            <input
                              type="date"
                              value={fields.storageEndDate || ''}
                              onChange={(e) => handleFieldChange('storageEndDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors.storageEndDate && <p className="text-red-500 text-sm mt-1">{errors.storageEndDate}</p>}
                          </div>
                        </div>

                        {/* Item Description */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Description
                          </label>
                          <textarea
                            value={fields.itemDescription || ''}
                            onChange={(e) => handleFieldChange('itemDescription', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="What items need to be stored? Are the items on the ground floor, upstairs or outside?"
                            rows={4}
                            required
                          />
                          {errors.itemDescription && <p className="text-red-500 text-sm mt-1">{errors.itemDescription}</p>}
                        </div>

                        {/* Pickup Preference */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Do the items need to be picked up/delivered by us at your home?
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="pickupPreference"
                                value="bringToStorage"
                                checked={fields.pickupPreference === 'bringToStorage'}
                                onChange={(e) => handleFieldChange('pickupPreference', e.target.value)}
                                className="mr-2"
                                required
                              />
                              I can bring the items to the ReHome storage in Tilburg.
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="pickupPreference"
                                value="pickupFromHome"
                                checked={fields.pickupPreference === 'pickupFromHome'}
                                onChange={(e) => handleFieldChange('pickupPreference', e.target.value)}
                                className="mr-2"
                                required
                              />
                              I need the items to be picked from my home
                            </label>
                          </div>
                          {errors.pickupPreference && <p className="text-red-500 text-sm mt-1">{errors.pickupPreference}</p>}
                        </div>

                        {/* Address fields - only show if pickup from home is selected */}
                        {fields.pickupPreference === 'pickupFromHome' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                              </label>
                              <select
                                value={fields.country || 'The Netherlands'}
                                onChange={(e) => handleFieldChange('country', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                              >
                                <option value="The Netherlands">The Netherlands</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Germany">Germany</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code
                              </label>
                              <input
                                type="text"
                                value={fields.postal || ''}
                                onChange={(e) => handleFieldChange('postal', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="1234 AB"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                House Number
                              </label>
                              <input
                                type="text"
                                value={fields.houseNumber || ''}
                                onChange={(e) => handleFieldChange('houseNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="123"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Addition
                              </label>
                              <input
                                type="text"
                                value={fields.addition || ''}
                                onChange={(e) => handleFieldChange('addition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="A"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={fields.city || ''}
                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Amsterdam"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street
                              </label>
                              <input
                                type="text"
                                value={fields.street || ''}
                                onChange={(e) => handleFieldChange('street', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Main Street"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Floor (0 for ground floor)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={fields.floor || '0'}
                                onChange={(e) => handleFieldChange('floor', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="elevatorAvailable"
                                checked={fields.elevatorAvailable || false}
                                onChange={(e) => handleFieldChange('elevatorAvailable', e.target.checked)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <label htmlFor="elevatorAvailable" className="ml-2 block text-sm text-gray-700">
                                Elevator available
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedService === 'junkRemoval' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">For Junk Removal</h3>
                        
                        {/* Item Description */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Description
                          </label>
                          <textarea
                            value={fields.itemDescription || ''}
                            onChange={(e) => handleFieldChange('itemDescription', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="What items need to be removed? Are the items on the ground floor, upstairs or outside?"
                            rows={4}
                            required
                          />
                          {errors.itemDescription && <p className="text-red-500 text-sm mt-1">{errors.itemDescription}</p>}
                        </div>

                        {/* Address */}
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                              </label>
                              <select
                                value={fields.country || 'The Netherlands'}
                                onChange={(e) => handleFieldChange('country', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                              >
                                <option value="The Netherlands">The Netherlands</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Germany">Germany</option>
                                <option value="Other">Other</option>
                              </select>
                              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code
                              </label>
                              <input
                                type="text"
                                value={fields.postal || ''}
                                onChange={(e) => handleFieldChange('postal', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="1234 AB"
                                required
                              />
                              {errors.postal && <p className="text-red-500 text-sm mt-1">{errors.postal}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                House Number
                              </label>
                              <input
                                type="text"
                                value={fields.houseNumber || ''}
                                onChange={(e) => handleFieldChange('houseNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="123"
                                required
                              />
                              {errors.houseNumber && <p className="text-red-500 text-sm mt-1">{errors.houseNumber}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Addition
                              </label>
                              <input
                                type="text"
                                value={fields.addition || ''}
                                onChange={(e) => handleFieldChange('addition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="A"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={fields.city || ''}
                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Amsterdam"
                                required
                              />
                              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street
                              </label>
                              <input
                                type="text"
                                value={fields.street || ''}
                                onChange={(e) => handleFieldChange('street', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Main Street"
                                required
                              />
                              {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Floor (Enter 0 for ground floor)
                              </label>
                              <input
                                type="number"
                                value={fields.floor || ''}
                                onChange={(e) => handleFieldChange('floor', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="0"
                                min="0"
                                required
                              />
                              {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Elevator Available
                              </label>
                              <select
                                value={fields.elevatorAvailable || ''}
                                onChange={(e) => handleFieldChange('elevatorAvailable', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                              >
                                <option value="">Select option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                              {errors.elevatorAvailable && <p className="text-red-500 text-sm mt-1">{errors.elevatorAvailable}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Removal Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Earliest Removal Date
                            </label>
                            <input
                              type="date"
                              value={fields.earliestRemovalDate || ''}
                              onChange={(e) => handleFieldChange('earliestRemovalDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors.earliestRemovalDate && <p className="text-red-500 text-sm mt-1">{errors.earliestRemovalDate}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Latest Removal Date
                            </label>
                            <input
                              type="date"
                              value={fields.removalDate || ''}
                              onChange={(e) => handleFieldChange('removalDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors.removalDate && <p className="text-red-500 text-sm mt-1">{errors.removalDate}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedService === 'fullInternationalMove' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">For Full/International Move</h3>
                        
                        {/* Pickup Address */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pickup Address
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                              </label>
                              <select
                                value={fields.pickupCountry || 'The Netherlands'}
                                onChange={(e) => handleFieldChange('pickupCountry', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                              >
                                <option value="The Netherlands">The Netherlands</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Germany">Germany</option>
                                <option value="Other">Other</option>
                              </select>
                              {errors.pickupCountry && <p className="text-red-500 text-sm mt-1">{errors.pickupCountry}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code
                              </label>
                              <input
                                type="text"
                                value={fields.pickupPostal || ''}
                                onChange={(e) => handleFieldChange('pickupPostal', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="1234 AB"
                                required
                              />
                              {errors.pickupPostal && <p className="text-red-500 text-sm mt-1">{errors.pickupPostal}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                House Number
                              </label>
                              <input
                                type="text"
                                value={fields.pickupHouseNumber || ''}
                                onChange={(e) => handleFieldChange('pickupHouseNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="123"
                                required
                              />
                              {errors.pickupHouseNumber && <p className="text-red-500 text-sm mt-1">{errors.pickupHouseNumber}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Addition
                              </label>
                              <input
                                type="text"
                                value={fields.pickupAddition || ''}
                                onChange={(e) => handleFieldChange('pickupAddition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="A"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={fields.pickupCity || ''}
                                onChange={(e) => handleFieldChange('pickupCity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Amsterdam"
                                required
                              />
                              {errors.pickupCity && <p className="text-red-500 text-sm mt-1">{errors.pickupCity}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street
                              </label>
                              <input
                                type="text"
                                value={fields.pickupStreet || ''}
                                onChange={(e) => handleFieldChange('pickupStreet', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Main Street"
                                required
                              />
                              {errors.pickupStreet && <p className="text-red-500 text-sm mt-1">{errors.pickupStreet}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Pickup Floor and Elevator */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pickup Floor Number
                            </label>
                            <input
                              type="number"
                              value={fields.pickupFloor || ''}
                              onChange={(e) => handleFieldChange('pickupFloor', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pickup Elevator Available
                            </label>
                            <select
                              value={fields.pickupElevator || ''}
                              onChange={(e) => handleFieldChange('pickupElevator', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Select option</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Dropoff Address */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dropoff Address
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                              </label>
                              <select
                                value={fields.dropoffCountry || 'The Netherlands'}
                                onChange={(e) => handleFieldChange('dropoffCountry', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                              >
                                <option value="The Netherlands">The Netherlands</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Germany">Germany</option>
                                <option value="Other">Other</option>
                              </select>
                              {errors.dropoffCountry && <p className="text-red-500 text-sm mt-1">{errors.dropoffCountry}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code
                              </label>
                              <input
                                type="text"
                                value={fields.dropoffPostal || ''}
                                onChange={(e) => handleFieldChange('dropoffPostal', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="1234 AB"
                                required
                              />
                              {errors.dropoffPostal && <p className="text-red-500 text-sm mt-1">{errors.dropoffPostal}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                House Number
                              </label>
                              <input
                                type="text"
                                value={fields.dropoffHouseNumber || ''}
                                onChange={(e) => handleFieldChange('dropoffHouseNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="123"
                                required
                              />
                              {errors.dropoffHouseNumber && <p className="text-red-500 text-sm mt-1">{errors.dropoffHouseNumber}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Addition
                              </label>
                              <input
                                type="text"
                                value={fields.dropoffAddition || ''}
                                onChange={(e) => handleFieldChange('dropoffAddition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="A"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={fields.dropoffCity || ''}
                                onChange={(e) => handleFieldChange('dropoffCity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Amsterdam"
                                required
                              />
                              {errors.dropoffCity && <p className="text-red-500 text-sm mt-1">{errors.dropoffCity}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street
                              </label>
                              <input
                                type="text"
                                value={fields.dropoffStreet || ''}
                                onChange={(e) => handleFieldChange('dropoffStreet', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Main Street"
                                required
                              />
                              {errors.dropoffStreet && <p className="text-red-500 text-sm mt-1">{errors.dropoffStreet}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Dropoff Floor and Elevator */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dropoff Floor Number
                            </label>
                            <input
                              type="number"
                              value={fields.dropoffFloor || ''}
                              onChange={(e) => handleFieldChange('dropoffFloor', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dropoff Elevator Available
                            </label>
                            <select
                              value={fields.dropoffElevator || ''}
                              onChange={(e) => handleFieldChange('dropoffElevator', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Select option</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Item Description */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Description
                          </label>
                          <textarea
                            value={fields.itemDescription || ''}
                            onChange={(e) => handleFieldChange('itemDescription', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Please provide a list of your items and any other relevant information."
                            rows={4}
                            required
                          />
                          {errors.itemDescription && <p className="text-red-500 text-sm mt-1">{errors.itemDescription}</p>}
                        </div>

                        {/* Date Selection */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Move Date
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="moveDate"
                                value="rehomeChoose"
                                checked={fields.moveDate === 'rehomeChoose'}
                                onChange={(e) => handleFieldChange('moveDate', e.target.value)}
                                className="mr-2"
                                required
                              />
                              ReHome can choose a date
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="moveDate"
                                value="specific"
                                checked={fields.moveDate === 'specific'}
                                onChange={(e) => handleFieldChange('moveDate', e.target.value)}
                                className="mr-2"
                                required
                              />
                              Specific date
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="moveDate"
                                value="flexible"
                                checked={fields.moveDate === 'flexible'}
                                onChange={(e) => handleFieldChange('moveDate', e.target.value)}
                                className="mr-2"
                                required
                              />
                              Flexible within a range
                            </label>
                          </div>
                          {errors.moveDate && <p className="text-red-500 text-sm mt-1">{errors.moveDate}</p>}
                        </div>

                        {/* Date Input Fields - Conditional based on selection */}
                        {fields.moveDate === 'specific' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Specific Date
                            </label>
                            <input
                              type="date"
                              value={fields.specificDate || ''}
                              onChange={(e) => handleFieldChange('specificDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors.specificDate && <p className="text-red-500 text-sm mt-1">{errors.specificDate}</p>}
                          </div>
                        )}

                        {fields.moveDate === 'flexible' && (
                          <div className="mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={fields.flexibleStartDate || ''}
                                  onChange={(e) => handleFieldChange('flexibleStartDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  required
                                />
                                {errors.flexibleStartDate && <p className="text-red-500 text-sm mt-1">{errors.flexibleStartDate}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={fields.flexibleEndDate || ''}
                                  onChange={(e) => handleFieldChange('flexibleEndDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  required
                                />
                                {errors.flexibleEndDate && <p className="text-red-500 text-sm mt-1">{errors.flexibleEndDate}</p>}
                              </div>
                            </div>
                          </div>
                        )}

                        {fields.moveDate === 'rehomeChoose' && (
                          <div className="mb-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                              <p className="text-blue-800 text-sm">
                                ✅ ReHome will choose the most suitable date for your move. No date selection needed.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Services Needed */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Services Needed
                          </label>
                          <div className="space-y-2">
                            {fullMoveServices.map((service) => (
                              <label key={service} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service)}
                                  onChange={() => handleServiceToggle(service)}
                                  className="mr-2"
                                />
                                {service === 'disassemblyReassembly' && 'Disassembly/Reassembly'}
                                {service === 'carryingUpstairsDownstairs' && 'Carrying Upstairs/Downstairs'}
                                {service === 'extraHelper' && 'Extra Helper'}
                                {service === 'packingService' && 'Packing Service'}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={fields.customerName || ''}
                          onChange={(e) => handleFieldChange('customerName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Your name"
                          required
                        />
                        {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <PhoneNumberInput
                          value={contactInfo.phone}
                          onChange={handlePhoneChange}
                          error={errors.phone}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={contactInfo.email}
                          onChange={handleEmailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="your@email.com"
                          required
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Photos *
                      </label>
                      <NSFWFileUpload
                        value={photos}
                        onChange={setPhotos}
                        onRemove={(index) => {
                          const newPhotos = [...photos];
                          newPhotos.splice(index, 1);
                          setPhotos(newPhotos);
                        }}
                        required={true}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Please upload at least one photo to help us understand your request better.
                      </p>
                      {errors.photos && <p className="text-red-500 text-sm mt-1">{errors.photos}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Submitting...' : 'Submit Special Request'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialRequestPage;