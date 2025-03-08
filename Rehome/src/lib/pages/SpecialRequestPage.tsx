import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'; // Import axios for making HTTP requests

const SpecialRequestPage = () => {
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices({
      ...selectedServices,
      [serviceId]: !selectedServices[serviceId],
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    if (Object.keys(selectedServices).length === 0) {
      newErrors.selectedServices = 'Please select at least one service.';
      isValid = false;
    }

    if (!message.trim()) {
      newErrors.message = 'Please describe your needs.';
      isValid = false;
    }

    if (!contactInfo.trim()) {
      newErrors.contactInfo = 'Please provide your contact information.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop if the form is not valid
    }

    setIsLoading(true); // Set loading to true at the start

    const requestData = {
      selectedServices,
      message,
      contactInfo,
    };

    try {
      const response = await axios.post(
        'https://rehome-backend.vercel.app/api/special-request', 
        requestData
        ); 
      console.log('Server Response:', response.data);
      toast.success('Special request submitted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      // Clear the form after successful submission
      setSelectedServices({});
      setMessage('');
      setContactInfo('');
      setErrors({}); // Clear errors on success
    } catch (error:any) {
      console.error('Error submitting special request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit request. Please try again.';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false); // Set loading to false after request completes
    }
  };

  const services = [
    { id: 'fullHouseMove', name: 'Full house move' },
    { id: 'internationalMove', name: 'International move/ transport' },
    { id: 'temporaryItemStorage', name: 'Temporary Item storage' },
    { id: 'junkRemoval', name: 'Junk removal' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-transform transform hover:scale-105">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6 animate-pulse">
            Special Request
          </h1>
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

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Describe Your Needs
              </label>
              {errors.message && (
                <p className="text-red-500 text-sm">{errors.message}</p>
              )}
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Write us a message and we will be in touch with a personalized quote."
              />
            </div>

            {/* Contact Info */}
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
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Phone number or email"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading} // Disable the button while loading
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