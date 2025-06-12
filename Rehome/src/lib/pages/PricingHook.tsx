import { toast } from 'react-toastify';

const createOrder = async (orderData: {
    items: any[];
    totalAmount: number;
    userId?: string;
}): Promise<{ success: boolean; orderNumber?: string; error?: string }> => {
    try {
        const orderNumber = `RH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        const response = await fetch(
            '/api/orders', // You can implement this endpoint later
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    ...orderData,
                    orderNumber,
                    createdAt: new Date().toISOString(),
                }),
            }
        );
        
        console.log("Order creation response:", response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        
        toast.success(`Order created successfully! Order #${orderNumber}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        
        return { success: true, orderNumber };
        
    } catch (error) {
        toast.error('There was an error creating your order. Please try again.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        console.error("Error creating order:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

export default createOrder;
