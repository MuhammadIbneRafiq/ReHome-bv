import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import LocationAutocomplete from '../../components/ui/LocationAutocomplete';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { NSFWFileUpload } from '../../components/ui/NSFWFileUpload';
import { API_ENDPOINTS } from '../api/config';

const ItemDonationPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'donate' | 'sell'>('donate');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('good');
  const [photos, setPhotos] = useState<File[]>([]);
  const [address, setAddress] = useState('');
  const [floor, setFloor] = useState('');
  const [elevatorAvailable, setElevatorAvailable] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [preferredDate, setPreferredDate] = useState('');
  const [isDateFlexible, setIsDateFlexible] = useState(false);
  const [preferredTimeSpan, setPreferredTimeSpan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: string) => {
    setContactInfo(prev => ({ ...prev, phone: value }));
  };

  const validateForm = () => {
    // Basic validation
    if (mode === 'sell' && !price.trim()) {
      toast.error("Please enter a price for your item.");
      return false;
    }
    if (mode === 'sell' && isNaN(parseFloat(price))) {
      toast.error("Please enter a valid price for your item.");
      return false;
    }
    if (!description.trim()) {
      toast.error("Please provide a description of your item.");
      return false;
    }
    if (photos.length === 0) {
      toast.error("Please upload at least one photo of your item.");
      return false;
    }
    if (!address.trim()) {
      toast.error("Please enter your pickup address.");
      return false;
    }
    if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!contactInfo.email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }
    if (!contactInfo.phone.trim()) {
      toast.error("Please enter your phone number.");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    // Phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(contactInfo.phone)) {
      toast.error("Please enter a valid phone number.");
      return false;
    }

    // Check if terms and conditions are agreed to
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions to continue.");
      return false;
    }

    // Additional validation to ensure contactInfo is properly structured
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'] as const;
    for (const field of requiredFields) {
      if (!contactInfo[field] || typeof contactInfo[field] !== 'string' || !contactInfo[field].trim()) {
        console.error(`Missing or invalid contactInfo field: ${field}`, contactInfo[field]);
        toast.error(`Please provide a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      // Ensure contactInfo is properly structured
      const sanitizedContactInfo = {
        firstName: contactInfo.firstName.trim(),
        lastName: contactInfo.lastName.trim(),
        email: contactInfo.email.trim(),
        phone: contactInfo.phone.trim()
      };

      const formData = new FormData();
      formData.append('donationItems', JSON.stringify([
        {
          description,
          price: mode === 'sell' ? parseFloat(price) : undefined,
          condition,
        }
      ]));
      try {
        formData.append('contactInfo', JSON.stringify(sanitizedContactInfo));
        // Also append individual fields as backup
        formData.append('contactFirstName', sanitizedContactInfo.firstName);
        formData.append('contactLastName', sanitizedContactInfo.lastName);
        formData.append('contactEmail', sanitizedContactInfo.email);
        formData.append('contactPhone', sanitizedContactInfo.phone);
      } catch (jsonError) {
        console.error('Error stringifying contactInfo:', jsonError);
        toast.error('Error preparing contact information. Please try again.');
        return;
      }
      formData.append('pickupLocation', address); // Changed from 'address' to 'pickupLocation'
      formData.append('preferredPickupDate', preferredDate || '');
      formData.append('isDateFlexible', String(isDateFlexible));
      formData.append('donationType', mode === 'sell' ? 'sell' : 'charity');
      formData.append('itemCondition', condition);
      formData.append('floor', floor);
      formData.append('elevatorAvailable', String(elevatorAvailable));
      formData.append('preferredTimeSpan', preferredTimeSpan);
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      // Debug logging
      console.log('Submitting donation request with data:', {
        donationItems: [{ description, price: mode === 'sell' ? parseFloat(price) : undefined, condition }],
        contactInfo: sanitizedContactInfo,
        pickupLocation: address,
        preferredPickupDate: preferredDate,
        isDateFlexible,
        donationType: mode === 'sell' ? 'sell' : 'charity',
        itemCondition: condition,
        floor,
        elevatorAvailable,
        preferredTimeSpan,
        photoCount: photos.length
      });
      
      // Debug: Log the exact JSON being sent
      console.log('ContactInfo JSON string:', JSON.stringify(sanitizedContactInfo));
      console.log('ContactInfo object:', sanitizedContactInfo);
      console.log('ContactInfo validation:', {
        hasContactInfo: !!sanitizedContactInfo,
        hasEmail: !!sanitizedContactInfo.email,
        hasFirstName: !!sanitizedContactInfo.firstName,
        hasLastName: !!sanitizedContactInfo.lastName,
        email: sanitizedContactInfo.email,
        firstName: sanitizedContactInfo.firstName,
        lastName: sanitizedContactInfo.lastName
      });

      // Debug: Log the FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(API_ENDPOINTS.DONATION.ITEM_REQUEST, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);
      
      if (response.ok) {
        toast.success(result.message || "Thank you for your donation! We'll contact you soon to arrange pickup.", {
          position: "top-right",
          autoClose: 5000,
        });
        setConfirmation(result.message || "Thank you for your generous donation! We'll be in touch shortly to arrange pickup of your items.");
        // Reset form
        setStep(1);
        setMode('donate');
        setPrice('');
        setDescription('');
        setCondition('good');
        setPhotos([]);
        setAddress('');
        setFloor('');
        setElevatorAvailable(false);
        setContactInfo({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
        setPreferredDate('');
        setIsDateFlexible(false);
        setPreferredTimeSpan('');
        setAgreedToTerms(false);
      } else {
        console.error('Server error:', result);
        throw new Error(result.error || result.details || 'Failed to submit donation request');
      }
    } catch (error) {
      console.error("Error submitting the form:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while submitting your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    // Validation for each step
    if (step === 1) {
      if (!description.trim()) {
        toast.error("Please provide a description of your item.");
        return;
      }
      if (photos.length === 0) {
        toast.error("Please upload at least one photo of your item.");
        return;
      }
      if (mode === 'sell' && !price.trim()) {
        toast.error("Please enter a price for your item.");
        return;
      }
    } else if (step === 2) {
      if (!address.trim()) {
        toast.error("Please enter your pickup address.");
        return;
      }
    } else if (step === 3) {
      if (!preferredDate && !isDateFlexible) {
        toast.error("Please select a date or indicate that your date is flexible.");
        return;
      }
    } else if (step === 4) {
      if (!contactInfo.firstName.trim() || !contactInfo.lastName.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (!contactInfo.email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }
      if (!contactInfo.phone.trim()) {
        toast.error("Please enter your phone number.");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      // Basic phone validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(contactInfo.phone)) {
        toast.error("Please enter a valid phone number.");
        return;
      }
      // Check if terms and conditions are agreed to
      if (!agreedToTerms) {
        toast.error("Please agree to the Terms and Conditions to continue.");
        return;
      }
    }
    
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-orange-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('itemDonation.title', 'Furniture Donation & Resale')}</h1>
        <p className="text-lg text-gray-600 mb-6">{t('itemDonation.subtitle', 'Give your furniture a second life by donating or selling it through ReHome')}</p>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          {/* Introduction Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Why choose ReHome?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Benefits of donating with us:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Free pickup service at your convenience</li>
                  <li>Extend the life of your furniture through our professional refurbishment</li>
                  <li>Support sustainability and reduce waste</li>
                  <li>Help others furnish their homes affordably</li>
                  <li>Declutter your space responsibly</li>
                  <li>Tax deduction receipts available on request</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">What we accept:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Sofas, armchairs, and other seating</li>
                  <li>Tables, desks, and chairs</li>
                  <li>Clean beds and mattresses</li>
                  <li>Wardrobes and storage furniture</li>
                  <li>Working appliances</li>
                  <li>Lamps and lighting fixtures</li>
                  <li>Bookshelves and display units</li>
                  <li>Dining sets and kitchen furniture</li>
                </ul>
              </div>
            </div>
          </div>

          {confirmation && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              {confirmation}
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s}
                className={`relative flex flex-col items-center ${s < step ? 'text-green-600' : s === step ? 'text-orange-600' : 'text-gray-400'}`}
              >
                <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center mb-1 ${s < step ? 'bg-green-600' : s === step ? 'bg-orange-600' : 'bg-gray-200'} ${s <= step ? 'text-white' : 'text-gray-600'}`}>
                  {s < step ? <FaCheckCircle className="h-6 w-6" /> : s}
                </div>
                <div className="text-xs text-center">
                  {s === 1 && 'Item Details'}
                  {s === 2 && 'Pickup Location'}
                  {s === 3 && 'Schedule'}
                  {s === 4 && 'Contact Info'}
                </div>
                {s < 4 && (
                  <div className="absolute top-5 -right-full w-full h-0.5 bg-gray-200">
                    <div 
                      className="h-full bg-green-600 transition-all duration-500 ease-out"
                      style={{ width: s < step ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Item Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">Tell us about your item</h3>
                
                {/* Donation or Sell selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Would you like to donate or sell your item?</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input 
                        type="radio" 
                        name="mode" 
                        value="donate" 
                        checked={mode === 'donate'} 
                        onChange={() => setMode('donate')} 
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500" 
                      />
                      <span className="ml-2">Donate (Free)</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input 
                        type="radio" 
                        name="mode" 
                        value="sell" 
                        checked={mode === 'sell'} 
                        onChange={() => setMode('sell')} 
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500" 
                      />
                      <span className="ml-2">Sell</span>
                    </label>
                  </div>
                </div>
                
                {/* Price field if Sell */}
                {mode === 'sell' && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Suggested Price (€)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm w-full max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">€</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>
                )}
                
                {/* Item Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="What items need to be removed? Are the items on the ground floor, upstairs or outside?"
                    required
                  />
                </div>
                
                {/* Item Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <div className="mt-1 flex flex-wrap gap-3">
                    {['like new', 'good', 'used', 'needs repair'].map((c) => (
                      <label key={c} className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-colors ${
                        condition === c ? 'bg-orange-100 border border-orange-500' : 'bg-gray-50 border border-gray-300 hover:bg-gray-100'
                      }`}>
                        <input
                          type="radio"
                          name="condition"
                          value={c}
                          checked={condition === c}
                          onChange={() => setCondition(c)}
                          className="sr-only"
                        />
                        <span className="capitalize">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
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
                </div>
              </div>
            )}
            
            {/* Step 2: Pickup Location */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">Pickup Location</h3>
                
                <div>
                  <LocationAutocomplete
                    label="Address"
                    value={address}
                    onChange={(value) => setAddress(value)}
                    placeholder="Street, City, Postal Code"
                    required
                    countryCode="nl"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                      Floor (Enter 0 for ground floor)
                    </label>
                    <input
                      type="number"
                      id="floor"
                      min="0"
                      value={floor}
                      onChange={e => setFloor(e.target.value)}
                      className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center">
                    <input 
                      id="elevator"
                      type="checkbox"
                      checked={elevatorAvailable}
                      onChange={e => setElevatorAvailable(e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="elevator" className="ml-2 block text-sm text-gray-700">
                      Elevator Available
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">Schedule Pickup</h3>
                
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                    Preferred Pickup Date
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={isDateFlexible}
                  />
                </div>
                
                <div className="flex items-center">
                  <input 
                    id="flexibleDate"
                    type="checkbox"
                    checked={isDateFlexible}
                    onChange={e => {
                      setIsDateFlexible(e.target.checked);
                      if (e.target.checked) setPreferredDate('');
                    }}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="flexibleDate" className="ml-2 block text-sm text-gray-700">
                    I'm flexible with the pickup date
                  </label>
                </div>
                
                <div>
                  <label htmlFor="preferredTimeSpan" className="block text-sm font-medium text-gray-700">
                    Preferred Time of Day
                  </label>
                  <select
                    id="preferredTimeSpan"
                    value={preferredTimeSpan}
                    onChange={e => setPreferredTimeSpan(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a time...</option>
                    <option value="morning">Morning (8:00 - 12:00)</option>
                    <option value="afternoon">Afternoon (12:00 - 16:00)</option>
                    <option value="evening">Evening (16:00 - 20:00)</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Step 4: Contact Information */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">Contact Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={contactInfo.firstName}
                      onChange={handleContactInfoChange}
                      className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={contactInfo.lastName}
                      onChange={handleContactInfoChange}
                      className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={contactInfo.email}
                      onChange={handleContactInfoChange}
                      className="mt-1 focus:ring-orange-500 focus:border-orange-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <PhoneNumberInput
                      value={contactInfo.phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    id="agreeTerms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-700">
                    I agree to the <a href="/terms" target="_blank" className="text-orange-600 hover:text-orange-500">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-orange-600 hover:text-orange-500">Privacy Policy</a>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button 
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" /> Previous
                </button>
              )}
              {step < 4 ? (
                <button 
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Next <FaArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ItemDonationPage;