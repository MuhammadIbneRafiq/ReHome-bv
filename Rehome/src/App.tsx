import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";

// Import Pages
import LandingPage from "./lib/pages/LandingPage";
import LoginPage from "./lib/pages/LoginPage";
import SignupPage from "./lib/pages/SignupPage";
import Pricing from "./lib/pages/PricingHook";
import MarketplacePage from "./lib/pages/MarketplacePage";
import ItemMovingPage from "./lib/pages/ItemMovingPage";
import HouseMovingPage from "./lib/pages/HouseMovingPage";
import ItemDonationPage from "./lib/pages/ItemDonationPage";
import WhyChooseUsPage from "./lib/pages/WhyChooseUsPage";
import ContactUsPage from "./lib/pages/ContactUsPage";
import AboutUsPage from "./lib/pages/AboutUsPage";
import SellerDashboard from "./lib/pages/SellerDashboard";
import SpecialRequestPage from "./lib/pages/SpecialRequestPage";


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
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <main className="min-h-screen bg-orange-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/house-moving" element={<HouseMovingPage />} />
              <Route path="/item-moving" element={<ItemMovingPage />} />
              <Route path="/item-donation" element={<ItemDonationPage />} />
              <Route path="/special-request" element={<SpecialRequestPage />} />
              <Route path="/sell-dash" element={<SellerDashboard />} />
              <Route path="/why-choose-us" element={<WhyChooseUsPage />} />
              <Route path="/contact-us" element={<ContactUsPage />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/pricing" element={<Pricing />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;