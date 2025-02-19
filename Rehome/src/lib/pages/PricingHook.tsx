import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Pricing = () => {
    const [isLoading, setIsLoading] = useState(false);

    const fetchCheckoutUrl = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:3000/mollie', // Update this to your backend URL
                { plan: 'BASIC' },
                {}
            );
            console.log("Response:", response);
            window.location.href = response.data.checkoutUrl;
        } catch (error) {
            toast.error('There was an error. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            console.error("Error creating Mollie checkout session:", error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Redirecting to payment...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 text-black dark:text-white">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center w-full max-w-xs">
                    <p className="text-3xl font-bold mb-1">€0.01</p>
                    <p className="text-sm mb-4">Test Mollie Payment</p>
                    <button 
                        onClick={fetchCheckoutUrl} 
                        className="w-full py-2 mb-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                    >
                        Test Mollie Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
