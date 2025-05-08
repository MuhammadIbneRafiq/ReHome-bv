import Footer from "../../components/Footer";
// Import Images - Assuming you have these files in assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";
import logoImage from "../../assets/logorehome.jpg"; // Import the ReHome logo
import { motion } from "framer-motion"; // Import Framer Motion
import { FaHandshake, FaStar, FaHome } from "react-icons/fa"; // Import Icons
import { Link } from "react-router-dom";
import { MdCheckCircle, MdSupportAgent } from "react-icons/md";
import { FurnitureItem } from "../../types/furniture";
import { useTranslation } from "react-i18next";
import { translateFurnitureItem } from "../utils/dynamicTranslation";
import { useState } from "react";

const LandingPage = () => {
  const { t } = useTranslation();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Dummy Furniture Data with Images (You can keep this or fetch from API)
  const dummyData: FurnitureItem[] = [
    {
      id: 1,
      name: "Cozy Sofa",
      image_url: [sofaImage],
      description: "A comfortable and stylish sofa for your living room.",
      price: 299,
      created_at: new Date().toISOString(),
      seller_email: "info@rehome.com",
      city_name: "Amsterdam",
      sold: false,
      isrehome: true
    },
    {
      id: 2,
      name: "Wooden Dining Table",
      image_url: [tableImage],
      description: "A sturdy wooden dining table that seats 6 people.",
      price: 399,
      created_at: new Date().toISOString(),
      seller_email: "info@rehome.com",
      city_name: "Amsterdam",
      sold: false,
      isrehome: true
    },
    {
      id: 3,
      name: "Modern Office Chair",
      image_url: [chairImage],
      description: "An ergonomic office chair for maximum comfort.",
      price: 199,
      created_at: new Date().toISOString(),
      seller_email: "info@rehome.com",
      city_name: "Amsterdam",
      sold: false,
      isrehome: true
    },
  ];

  // Translate furniture items
  const translatedItems = dummyData.map(item => {
    const translated = translateFurnitureItem(item);
    return {
      ...item,
      name: translated.name,
      description: translated.description
    };
  });

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div className="flex flex-col justify-center items-start">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2"
              >
                <motion.span className="text-orange-600">Re</motion.span>furnish and{" "}
                <motion.span className="text-orange-600">Re</motion.span>locate your Home
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-2 text-lg text-gray-500"
              >
                Display Affordable House Moving and Transport for your Items.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-8"
              >
                <button
                  className="inline-block rehome-button"
                  onClick={() => setShowBookingModal(true)}
                >
                  Start Booking Process
                </button>
              </motion.div>
            </div>
            {/* Right: Truck Image */}
            <div>
              <div className="relative h-[300px] overflow-hidden flex items-center justify-center">
                {/* Road background */}
                <motion.div
                  className="absolute bottom-0 w-full h-32 bg-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Road markings - infinite animation */}
                <motion.div
                  className="absolute bottom-[14px] w-full flex justify-center"
                  initial={{ x: "100%" }}
                  animate={{ x: "-100%" }}
                  transition={{
                    duration: 4.0,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 0
                  }}
                >
                  <div className="flex gap-12">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-16 h-2 bg-white" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
                    ))}
                  </div>
                </motion.div>
                {/* Truck with orange box and logo overlay */}
                <motion.div
                  animate={{
                    y: [-2, 2],
                    rotate: [-0.5, 0.5]
                  }}
                  transition={{
                    y: {
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    },
                    rotate: {
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }}
                  className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                >
                  <div className="relative flex items-center">
                    {/* Truck base image (hide original box) */}
                    <img 
                      src="https://static.vecteezy.com/system/resources/previews/024/800/829/non_2x/a-delivery-truck-flat-design-home-delivery-service-concept-with-a-delivery-van-delivery-van-on-a-highway-flat-illustration-free-png.png" 
                      alt="Moving Truck" 
                      className="w-96 h-auto"
                      style={{ filter: 'brightness(0.85)' }}
                    />
                    {/* Orange box overlay */}
                    <div className="absolute top-[0%] left-[0%] w-[195px] h-[109px] bg-[#F97316] rounded-md flex items-center justify-center z-10">
                      <img 
                        src={logoImage} 
                        alt="ReHome Logo" 
                        className="w-16 h-16 object-contain" 
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Choose Service</h3>
            <div className="flex flex-col gap-4">
              <Link to="/item-transport" className="rehome-button text-center">Item Transport</Link>
              <Link to="/house-moving" className="rehome-button text-center">House Moving</Link>
            </div>
            <button className="mt-6 text-gray-500 hover:text-orange-600" onClick={() => setShowBookingModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('homepage.services')}
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              {t('homepage.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Service 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                    <FaHome className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-lg font-medium text-gray-900">
                      {t('navbar.houseMoving')}
                    </dt>
                  </div>
                </div>
                <div className="mt-4">
                  <dd className="text-base text-gray-500">
                    {t('houseMoving.subtitle')}
                  </dd>
                </div>
                <div className="mt-5">
                  <Link to="/house-moving" className="text-orange-600 hover:text-orange-700">
                    {t('homepage.learnMore')} &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Service 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                    <FaHandshake className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-lg font-medium text-gray-900">
                      {t('navbar.itemMoving')}
                    </dt>
                  </div>
                </div>
                <div className="mt-4">
                  <dd className="text-base text-gray-500">
                    {t('itemMoving.subtitle')}
                  </dd>
                </div>
                <div className="mt-5">
                  <Link to="/item-moving" className="text-orange-600 hover:text-orange-700">
                    {t('homepage.learnMore')} &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Service 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                    <MdSupportAgent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-lg font-medium text-gray-900">
                      {t('navbar.specialRequest')}
                    </dt>
                  </div>
                </div>
                <div className="mt-4">
                  <dd className="text-base text-gray-500">
                    {t('specialRequest.subtitle')}
                  </dd>
                </div>
                <div className="mt-5">
                  <Link to="/special-request" className="text-orange-600 hover:text-orange-700">
                    {t('homepage.learnMore')} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('homepage.featuredItems')}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {translatedItems.map((item) => (
              <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={item.image_url[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  <p className="mt-2 text-lg font-semibold text-orange-600">€{item.price}</p>
                  <div className="mt-4">
                    <Link
                      to="/marketplace"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {t('marketplace.viewDetails')} &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/marketplace"
              className="inline-block rehome-button"
            >
              {t('homepage.viewAll')}
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <Link to="/why-choose-us" className="block hover:bg-orange-100 transition-colors">
        <div className="py-16 bg-orange-50 hover:bg-orange-100 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Why Choose ReHome?
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Reason 1 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                    <MdCheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Professional Service</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Our team consists of trained professionals who handle your belongings with care.
                  </p>
                </div>
              </div>

              {/* Reason 2 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                    <FaStar className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Quality Guaranteed</h3>
                  <p className="mt-2 text-base text-gray-500">
                    We guarantee the quality of our service and the condition of marketplace items.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <span className="inline-flex items-center px-6 py-3 text-base font-medium text-orange-600">
                Click anywhere to learn more
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>

      <Footer />
    </div>
  );
};

export default LandingPage;