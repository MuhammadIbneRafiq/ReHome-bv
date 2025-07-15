import React from 'react';
import { useCart } from '../../contexts/CartContext';
import logoImage from "../../assets/logorehome.png";

interface CheckoutConfirmationProps {
  orderNumber: string;
  onClose: () => void;
}

const CheckoutConfirmation: React.FC<CheckoutConfirmationProps> = ({ orderNumber, onClose }) => {
  const { items, clearCart } = useCart();
  
  // Format price to show 2 decimal places
  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  // Sample confirmation email content
  const confirmationEmail = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #f97316; padding: 20px; text-align: center;">
        <img src="${logoImage}" alt="ReHome Logo" style="width: 50px; height: 50px; border-radius: 50%;">
        <h2 style="color: white; margin-top: 10px;">Order Confirmation</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hi [Customer's Name],</p>
        <p>Your order for [Item Name] has been placed! <b>We are now integrating it in our delivery schedule.</b></p>
        <p>After that we will be in touch and provide the delivery date and an invoice with a payment link.</p>
        
        <div style="margin: 30px 0; padding: 15px; border: 1px solid #e0e0e0; background-color: white;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order #:</strong> ${orderNumber}</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <th style="text-align: left; padding: 10px 0;">Item</th>
              <th style="text-align: right; padding: 10px 0;">Price</th>
            </tr>
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px 0;">${item.name} x${item.quantity}</td>
                <td style="text-align: right; padding: 10px 0;">${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Total</td>
              <td style="text-align: right; padding: 10px 0; font-weight: bold;">${formatPrice(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</td>
            </tr>
          </table>
        </div>
        
        <p>We will be in touch soon with your delivery date and an invoice with a payment link.</p>
        <p>Thank you for your order! 🚚 📦</p>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>© 2025 ReHome B.V. All rights reserved.</p>
      </div>
    </div>
  `;

  const handleCloseAndClear = () => {
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Confirmation</h2>
            <button onClick={handleCloseAndClear} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">Thank you for your order! Check your Email</p>
              </div>
              <p className="text-green-600 mt-2">
                Your order has been received. We'll send a confirmation email with details on next steps.
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Order #{orderNumber}</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded-md object-cover" src={item.image_url?.[0] || ''} alt={item.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-bold">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      {formatPrice(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Email Confirmation</h3>
            <div className="border rounded-md p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">
                You'll receive an email like this:
              </p>
              <div 
                className="border rounded-md p-4 bg-white" 
                dangerouslySetInnerHTML={{ __html: confirmationEmail }}
              />
            </div>
          </div>
          
          <div className="text-right">
            <button
              onClick={handleCloseAndClear}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmation; 