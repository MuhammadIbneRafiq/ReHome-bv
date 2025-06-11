import { toast } from 'react-toastify';
import API_ENDPOINTS from '../api/config';

const fetchCheckoutUrl = async (amount: number): Promise<string | null> => {
    try {
        const response = await fetch(
            API_ENDPOINTS.PAYMENT.MOLLIE, // Update this to your backend URL
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount }),
            }
        );
        
        console.log("Response:", response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.checkoutUrl) {
            return data.checkoutUrl;
        } else {
            console.error("No checkout URL in response:", data);
            return null;
        }
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
        console.error("Error fetching checkout URL:", error);
        return null;
    }
};

export default fetchCheckoutUrl;
