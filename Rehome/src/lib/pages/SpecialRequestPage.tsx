import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { useTranslation } from 'react-i18next';
import { FaWarehouse, FaBroom, FaGlobe } from 'react-icons/fa';

type ServiceFieldsType = {
  [key: string]: string[];
};

const serviceFields: ServiceFieldsType = {
  storage: [
    'itemList', 'duration', 'pickupAddress', 'dropoffPreference', 'contactInfo'
  ],
  junkRemoval: [
    'itemDescription', 'location', 'contactInfo'
  ],
  fullInternationalMove: [
    'pickupAddress', 'dropoffAddress', 'itemList', 'services', 'contactInfo'
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

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
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
    
    if (!selectedService) {
      newErrors.selectedService = 'Please select a service.';
      isValid = false;
    }

    if (selectedService) {
      serviceFields[selectedService].forEach((field) => {
        if (!fields[field] && field !== 'photos') {
          newErrors[field] = 'This field is required.';
          isValid = false;
        }
      });
    }

    // Contact info validation
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
    // const requestData = {
    //   service: selectedService,
    //   fields,
    //   photos: photos.map((file) => file.name),
    // };

    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Your special request has been submitted! We'll get back to you within 24 hours.", {
        position: "top-right",
        autoClose: 5000,
      });
      
      setConfirmation('Thank you for your request! We will review your requirements and be in touch within 24 hours with a custom quote.');
      
      // Reset form
      setSelectedService('');
      setFields({});
      setPhotos([]);
      setErrors({});
    } catch (error: any) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const services = [
    { 
      id: 'storage', 
      name: 'Storage Services',
      icon: FaWarehouse,
      description: 'Short- and long-term secure storage solutions'
    },
    { 
      id: 'junkRemoval', 
      name: 'Junk Removal',
      icon: FaBroom,
      description: 'Responsible disposal and removal services'
    },
    { 
      id: 'fullInternationalMove', 
      name: 'Full & International Moves',
      icon: FaGlobe,
      description: 'Complete relocation services across borders'
    },
  ];

  return (
    <div className="min-h-screen bg-orange-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Special Requests</h1>
        <p className="text-lg text-gray-600 mb-6">Tailored Services for Storage, Junk Removal, and International or Large-Scale Moves</p>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          {/* Introduction Section */}
          <div className="mb-8">
            <p className="text-gray-700 mb-6">
              ReHome's Special Request section covers services that go beyond standard moving or transport jobs. 
              These include short- and long-term item storage, junk removal, and full or international relocations — 
              all tailored to your specific situation and handled with care and efficiency.
            </p>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Storage Services */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaWarehouse className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Storage Services</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Need to store furniture or appliances for a few weeks or months? We offer secure short- and 
                  long-term storage within the Netherlands. You decide whether you drop off the items yourself 
                  or request pickup from your home. We also offer redelivery when your storage period ends. 
                  Storage is charged on a daily basis (minimum two weeks).
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  📩 Just send us a list of items to store and the intended duration — we'll reply with a tailored quote.
                </p>
              </div>

              {/* Junk Removal */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaBroom className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Junk Removal</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  From broken furniture to leftover clutter after a move, we offer affordable and responsible 
                  junk removal. Our team handles collection and disposal, with a focus on sustainability whenever possible.
                  You'll receive a quote based on the volume and type of items. Whether it's a single heavy piece 
                  or a full room clearance, we'll take care of it.
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  📩 Provide a list or photos of what needs removing, along with the location, and we'll respond within 24 hours with a quote.
                </p>
              </div>

              {/* Full & International Moves */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaGlobe className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">Full & International Moves</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  For more complex moves — across the Netherlands or abroad — we provide flexible, end-to-end 
                  relocation services. This includes packing, carrying, disassembly/reassembly, floor delivery, 
                  and logistics planning for international or long-distance jobs. Whether you're moving an entire 
                  household to another city or relocating abroad, we'll coordinate every step. All services are modular — you choose what to include.
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  📩 Tell us your pickup and drop-off locations, your item list, and any services you need — we'll build a custom plan and quote for you.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium text-center">
                Fill out the form for the specific service you need under Special Request, and we'll get back to you shortly with your custom quote.
              </p>
            </div>
          </div>

          {confirmation && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              {confirmation}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select the Service You Need
              </label>
              {errors.selectedService && (
                <p className="text-red-500 text-sm mb-2">{errors.selectedService}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <div 
                      key={service.id} 
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedService === service.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleServiceChange(service.id)}
                    >
                      <div className="flex items-center mb-2">
                        <IconComponent className={`h-6 w-6 mr-3 ${
                          selectedService === service.id ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <input
                        type="radio"
                        name="service"
                        value={service.id}
                        checked={selectedService === service.id}
                        onChange={() => handleServiceChange(service.id)}
                        className="absolute top-4 right-4"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Fields Based on Selected Service */}
            {selectedService === 'storage' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800">Storage Service Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">List of Items to Store</label>
                  <textarea
                    value={fields.itemList || ''}
                    onChange={e => handleFieldChange('itemList', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="Describe the items you need to store (furniture, appliances, etc.)"
                    required
                  />
                  {errors.itemList && <p className="text-red-500 text-sm">{errors.itemList}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage Duration</label>
                  <input
                    type="text"
                    value={fields.duration || ''}
                    onChange={e => handleFieldChange('duration', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="e.g., 2 weeks, 3 months, or specific dates"
                    required
                  />
                  {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Address</label>
                  <input
                    type="text"
                    value={fields.pickupAddress || ''}
                    onChange={e => handleFieldChange('pickupAddress', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="Where should we pick up your items?"
                    required
                  />
                  {errors.pickupAddress && <p className="text-red-500 text-sm">{errors.pickupAddress}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Preference</label>
                  <select
                    value={fields.dropoffPreference || ''}
                    onChange={e => handleFieldChange('dropoffPreference', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    required
                  >
                    <option value="">Select delivery preference</option>
                    <option value="pickup">I'll pick up items myself</option>
                    <option value="delivery">Please deliver items back to me</option>
                    <option value="undecided">I'll decide later</option>
                  </select>
                  {errors.dropoffPreference && <p className="text-red-500 text-sm">{errors.dropoffPreference}</p>}
                </div>
              </div>
            )}

            {selectedService === 'junkRemoval' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800">Junk Removal Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Items to Remove</label>
                  <textarea
                    value={fields.itemDescription || ''}
                    onChange={e => handleFieldChange('itemDescription', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="Describe what needs to be removed (broken furniture, clutter, etc.)"
                    required
                  />
                  {errors.itemDescription && <p className="text-red-500 text-sm">{errors.itemDescription}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={fields.location || ''}
                    onChange={e => handleFieldChange('location', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="Address where items need to be removed from"
                    required
                  />
                  {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
                </div>
              </div>
            )}

            {selectedService === 'fullInternationalMove' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-800">Full & International Move Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                    <input
                      type="text"
                      value={fields.pickupAddress || ''}
                      onChange={e => handleFieldChange('pickupAddress', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      placeholder="Current address/city/country"
                      required
                    />
                    {errors.pickupAddress && <p className="text-red-500 text-sm">{errors.pickupAddress}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Drop-off Location</label>
                    <input
                      type="text"
                      value={fields.dropoffAddress || ''}
                      onChange={e => handleFieldChange('dropoffAddress', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      placeholder="Destination address/city/country"
                      required
                    />
                    {errors.dropoffAddress && <p className="text-red-500 text-sm">{errors.dropoffAddress}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Item List</label>
                  <textarea
                    value={fields.itemList || ''}
                    onChange={e => handleFieldChange('itemList', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    placeholder="List all items to be moved (furniture, appliances, boxes, etc.)"
                    required
                  />
                  {errors.itemList && <p className="text-red-500 text-sm">{errors.itemList}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Services Needed</label>
                  <div className="mt-2 space-y-2">
                    {['Packing', 'Disassembly/Reassembly', 'Floor Delivery', 'Logistics Planning', 'Customs Handling'].map((service) => (
                      <label key={service} className="inline-flex items-center mr-6">
                        <input 
                          type="checkbox" 
                          checked={fields.services?.includes(service) || false}
                          onChange={e => {
                            const currentServices = fields.services || [];
                            if (e.target.checked) {
                              handleFieldChange('services', [...currentServices, service]);
                            } else {
                              handleFieldChange('services', currentServices.filter((s: string) => s !== service));
                            }
                          }}
                          className="form-checkbox text-orange-600" 
                        />
                        <span className="ml-2 text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info - Show for all services */}
            {selectedService && (
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                  Contact Information
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={fields.contactInfo || ''}
                  onChange={e => handleFieldChange('contactInfo', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Phone number or email"
                  required
                />
                {errors.contactInfo && <p className="text-red-500 text-sm">{errors.contactInfo}</p>}
              </div>
            )}

            {/* Photo Upload */}
            {selectedService && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Attach Photos (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
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

            {selectedService && (
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full rehome-button ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Submitting Request...' : 'Submit Special Request'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpecialRequestPage;