import axios from 'axios';
import { toast } from 'react-toastify';

const fetchCheckoutUrl = async (estimatedPrice: number) => {
    try {
        const response = await axios.post(
            'http://localhost:3000/mollie', // Update this to your backend URL
            { amount: estimatedPrice },
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
    }
};

export default fetchCheckoutUrl;
