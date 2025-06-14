import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import { LanguageProvider } from "./hooks/useLanguage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { CartProvider } from "./contexts/CartContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Pages
import LandingPage from "./lib/pages/LandingPage";
import LoginPage from "./lib/pages/LoginPage";
import SignupPage from "./lib/pages/SignupPage";
import MarketplacePage from "./lib/pages/MarketplacePage";
import ItemMovingPage from "./lib/pages/ItemMovingPage";
import HouseMovingPage from "./lib/pages/HouseMovingPage";
import ItemDonationPage from "./lib/pages/ItemDonationPage";
import WhyChooseUsPage from "./lib/pages/WhyChooseUsPage";
import ContactUsPage from "./lib/pages/ContactUsPage";
import AboutUsPage from "./lib/pages/AboutUsPage";
import SellerDashboard from "./lib/pages/SellerDashboard";
import SpecialRequestPage from "./lib/pages/SpecialRequestPage";
import AdminDashboard from "./lib/pages/AdminDashboard";
import MessagesPage from "./lib/pages/MessagesPage";
import HouseMovingLearnMore from "./lib/pages/HouseMovingLearnMore";
import ItemTransportLearnMore from "./lib/pages/ItemTransportLearnMore";
import SpecialRequestLearnMore from "./lib/pages/SpecialRequestLearnMore";
import MarketplaceLearnMore from "./lib/pages/MarketplaceLearnMore";
import TermsPage from "./lib/pages/TermsPage";
import PrivacyPage from "./lib/pages/PrivacyPage";
import CookiesPage from "./lib/pages/CookiesPage";

// const usePostData = <T,>(endpoint: string) => {
//   return useMutation<T, Error, T>(
//     async (payload: T) => {
//       const { data } = await axios.post<T>(`${import.meta.env.VITE_API_URL}/${endpoint}`, payload);
//       return data;
//     }
//   );
// };

// ✅ Main App Component
const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen">
              <Navbar />
              <main className="min-h-screen bg-orange-50">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/marketplace/learn-more" element={<MarketplaceLearnMore />} />
                  <Route path="/house-moving" element={<HouseMovingPage />} />
                  <Route path="/house-moving/learn-more" element={<HouseMovingLearnMore />} />
                  <Route path="/item-transport" element={<ItemMovingPage />} />
                  <Route path="/item-transport/learn-more" element={<ItemTransportLearnMore />} />
                  <Route path="/item-moving" element={<Navigate to="/item-transport" replace />} />
                  <Route path="/item-donation" element={<ItemDonationPage />} />
                  <Route path="/special-request" element={<SpecialRequestPage />} />
                  <Route path="/special-request/learn-more" element={<SpecialRequestLearnMore />} />
                  <Route path="/sell-dash" element={
                    <ProtectedRoute>
                      <SellerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/why-choose-us" element={<WhyChooseUsPage />} />
                  <Route path="/contact-us" element={<ContactUsPage />} />
                  <Route path="/about-us" element={<AboutUsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<SignupPage />} />
                </Routes>
              </main>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </BrowserRouter>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;