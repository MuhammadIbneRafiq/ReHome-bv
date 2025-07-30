import React from 'react';
import { FaLightbulb, FaCalendarAlt, FaTools, FaMoneyBillWave, FaClock } from 'react-icons/fa';

interface BookingTipsModalProps {
    isOpen: boolean;
    onContinue: () => void;
    serviceType?: 'item-transport' | 'house-moving';
}

const BookingTipsModal: React.FC<BookingTipsModalProps> = ({ 
    isOpen, 
    onContinue, 
    serviceType = 'item-transport' 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 pt-20 sm:pt-24">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <FaLightbulb className="h-6 w-6 sm:h-8 sm:w-8" />
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold">Smart Booking Tips</h2>
                                <p className="text-blue-100 text-sm sm:text-base">Save money with these insider tips</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Introduction */}
                    <div className="text-center mb-4 sm:mb-6">
                        <p className="text-base sm:text-lg text-gray-700">
                            Before you continue the booking process, take a look at the information below. 
                            This can help you customize your {serviceType === 'item-transport' ? 'transport' : 'move'} for your needs while keeping the cost as low as possible.
                        </p>
                    </div>

                    {/* Tips Grid */}
                    <div className="grid gap-4 sm:gap-6">
                        {/* Tip 1: Smart Scheduling */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-200">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <FaCalendarAlt className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">
                                        Smart Scheduling = Lower Prices
                                    </h3>
                                    <p className="text-sm sm:text-base text-green-700">
                                        Our pricing depends on route efficiency. If you are not 
                                        tied to a specific date, make sure to check through different options.
                                    </p>
                                </div>
                            </div>
                        </div>

                        
                        {/* Tip 2: Flexible Dates */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FaCalendarAlt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">
                                        Is your date flexible?
                                    </h3>
                                    <p className="text-sm sm:text-base text-blue-700">
                                        Selecting a date range or letting us suggest a moving date can unlock major savings. 
                                        The more flexible you are, the more we can optimize our routes and pass the savings to you.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tip 3: Customize and Save */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-6 rounded-lg border border-orange-200">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                        <FaTools className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-2">
                                        Customize your {serviceType === 'item-transport' ? 'transport' : 'move'} and Save
                                    </h3>
                                    <p className="text-sm sm:text-base text-orange-700">
                                        Need help with stair carrying or furniture assembly? Our add-on services are here 
                                        to assist you beyond the transport alone. To keep the cost low, select these add-on 
                                        services only for the items where it's truly needed. You can select for each item 
                                        if you require our assistance. If you only need transport, leave them unchecked 
                                        and benefit from the cheapest price.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Tip 3.1: Early booking */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg border border-red-200">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                                        Early Booking Discount
                                    </h3>
                                    <p className="text-sm sm:text-base text-red-700">
                                        Booking 2 weeks in advance will give you a 10 percent discount on the total price.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Tip 4: Student Discount */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg border border-purple-200">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <FaMoneyBillWave className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-2">
                                        Student Discount Available
                                    </h3>
                                    <p className="text-sm sm:text-base text-purple-700">
                                        Are you a student? Don't forget to check the student discount option and upload 
                                        your student ID for an additional 10% off your total price.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 sm:p-6 rounded-b-xl">
                    <div className="flex justify-end">
                        <button
                            onClick={onContinue}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                        >
                            Ok
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingTipsModal; 