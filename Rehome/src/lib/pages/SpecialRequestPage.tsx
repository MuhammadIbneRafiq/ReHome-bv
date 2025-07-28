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
    'itemDescription', 'duration', 'pickupAddress', 'dropoffPreference', 'contactInfo'
  ],
  junkRemoval: [
    'itemDescription', 'address', 'removalDate', 'contactInfo'
  ],
  fullInternationalMove: [
    'pickupAddress', 'dropoffAddress', 'itemDescription', 'services', 'contactInfo'
  ]
};

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

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setFields({});
    setPhotos([]);
    setErrors({});
    setConfirmation('');
    setContactInfo({ phone: '', email: '' });
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

  const validateForm = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedService) {
      newErrors.selectedService = 'Please select a service.';
      isValid = false;
    }

    if (selectedService) {
      serviceFields[selectedService].forEach((field) => {
        if (field === 'contactInfo') {
          // Skip this field as we now handle phone and email separately
          return;
        }
        if (!fields[field] && field !== 'photos') {
          newErrors[field] = 'This field is required.';
          isValid = false;
        }
      });
    }

    // Photo validation - mandatory for all services
    if (photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo.';
      isValid = false;
    }

    // Contact info validation - require both phone and email
    if (!contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
      isValid = false;
    } else {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(contactInfo.phone)) {
        newErrors.phone = 'Please enter a valid phone number.';
        isValid = false;
      }
    }

    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.email)) {
        newErrors.email = 'Please enter a valid email address.';
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
    
    try {
      const formData = new FormData();
      formData.append('service', selectedService);
      formData.append('phone', contactInfo.phone);
      formData.append('email', contactInfo.email);
      
      // Add other fields
      Object.keys(fields).forEach(key => {
        if (fields[key]) {
          formData.append(key, fields[key]);
        }
      });
      
      // Add photos with correct field name
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      const response = await fetch(API_ENDPOINTS.SPECIAL_REQUESTS.SUBMIT, {
        method: 'POST',
        body: formData,
      });
      
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
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting special request:', error);
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
                <h2 className="text-2xl font-bold text-green-600 mb-4">Request Submitted successfully and we will get back to you soon after reviewing it!</h2>
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
                    {serviceFields[selectedService].map((field) => {
                      if (field === 'contactInfo') return null; // Skip this as we handle it separately

                      // Custom label and placeholder for itemDescription
                      let label = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
                      let placeholder = `Enter ${label.toLowerCase()}`;
                      if (field === 'itemDescription') {
                        label = 'Description';
                        placeholder = 'What items need to be removed? Are the items on the ground floor, upstairs or outside?';
                      }
                      if (selectedService === 'junkRemoval') {
                        if (field === 'address') label = 'Address';
                        if (field === 'removalDate') label = 'Latest Removal Date';
                      }

                      // Use date input for removalDate
                      if (field === 'removalDate') {
                        return (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {label}
                            </label>
                            <input
                              type="date"
                              value={fields[field] || ''}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                          </div>
                        );
                      }

                      // Use LocationAutocomplete for address fields
                      if (field === 'address' || field.includes('Address')) {
                        return (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {label}
                            </label>
                            <input
                              type="text"
                              value={fields[field] || ''}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              required
                            />
                            {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                          </div>
                        );
                      }

                      // Use manual text input for junkRemoval address
                      if (selectedService === 'junkRemoval' && field === 'address') {
                        return (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address
                            </label>
                            <input
                              type="text"
                              value={fields[field] || ''}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Enter your full address"
                              maxLength={100}
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Type in your full address.</p>
                            {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                          </div>
                        );
                      }

                      // Default to text input
                      return (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {label}
                          </label>
                          <input
                            type="text"
                            value={fields[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder={placeholder}
                            required
                          />
                          {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                        </div>
                      );
                    })}

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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