import Footer from "../../components/Footer";
// Import Images - Assuming you have these files in assets
import sofaImage from "../../assets/IMG-20250208-WA0001.jpg";
import tableImage from "../../assets/IMG-20250208-WA0010.jpg";
import chairImage from "../../assets/IMG-20250208-WA0013.jpg";
import { motion } from "framer-motion"; // Import Framer Motion
import { FaHandshake, FaStar, FaHome, FaUserGraduate } from "react-icons/fa"; // Import Icons
import { Link } from "react-router-dom";
import { MdCheckCircle, MdSupportAgent } from "react-icons/md";
import { FurnitureItem } from "../../types/furniture";

const LandingPage = () => {
  // Framer Motion Variants

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

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900"
              >
                <motion.span className="text-orange-600">Re</motion.span>start and{" "}
                <motion.span className="text-orange-600">re</motion.span>locate your home and life!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-4 text-xl text-gray-500"
              >
              Affordable and Flexible Moving Solutions Tailored to Your Needs
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-8"
              >
                <Link
                  to="/marketplace"
                  className="inline-block rehome-button"
                >
                  Explore the Marketplace
                </Link>
              </motion.div>
            </div>
            <div>
              {/*  Add your animated illustration here (e.g., a moving truck) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="animate-pulse"
              >
                <img src="https://static.vecteezy.com/system/resources/previews/024/800/829/non_2x/a-delivery-truck-flat-design-home-delivery-service-concept-with-a-delivery-van-delivery-van-on-a-highway-flat-illustration-free-png.png" alt="Moving Truck" className="w-full md:w-3/4 mx-auto" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      

      
  

      {/* Features Section */}
      <div className="py-12 bg-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-12">
            Why Choose ReHome?
          </h2>
          <Link to="/why-choose-us">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <FaUserGraduate className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Student-Friendly</h3>
              <p className="text-gray-600">
                Ideal for small moves with minimal items.
              </p>
            </motion.div>
            {/* Feature 2 */}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <FaHome className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Flexible & Customizable: </h3>
              <p className="text-lg"></p>
              <p className="text-gray-600">
              Pricing based on item count, distance, and floor level.              </p>
            </motion.div>
            {/* Feature 3 */}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <FaHandshake className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Collaborative Model: </h3>
              <p className="text-gray-600">
              Engage in the moving process to save costs.

              </p>
            </motion.div>
          </div>
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-12 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-gray-800 text-center mb-6">
            What Our Customers Say
          </h2>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaStar className="inline-block text-yellow-500 text-4xl mb-2" />
            <p className="text-xl font-semibold text-gray-800 mb-2">
              4.8 <span className="text-gray-500">/ 5</span>
            </p>
            <p className="text-gray-600 mb-4">Based on 8,100+ Google Reviews</p>
            <p className="text-gray-700 italic">
              "Great service, amazing furniture, and a smooth moving experience! Highly recommend."
            </p>
          </div>
        </div>
      </div>
      {/* Featured Items Section */}
      <div className="py-12 bg-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-semibold text-gray-800 text-center mb-6">Featured Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dummyData.map((item) => (
                      <motion.div
                          key={item.id}
                          className="bg-white shadow-lg rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer"
                          whileHover={{ scale: 1.05 }} // Add hover animation
                          onClick={() => window.location.href = '/marketplace'} // Navigate to marketplace on click
                      >
                          <img src={item.image_url[0]} alt={item.name} className="w-full h-48 object-cover rounded-md" />
                          <h3 className="text-xl font-semibold mt-2">{item.name}</h3>
                          <p className="text-gray-600">{item.description}</p>
                          <p className="text-red-500 font-bold mt-2">${item.price}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>

      {/* About Us, Contact Us, Why Choose Us Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Us */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">About Us</h3>
              <p className="text-gray-700">
                ReHome B.v. is dedicated to providing high-quality, pre-loved furniture and appliances. We are committed to sustainability and helping our customers create beautiful homes.
              </p>
            </div>

            {/* Contact Us */}
            <div className="bg-orange-100 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h3>
              <p className="text-gray-700">
                Have questions or need assistance? Contact us at{" "}
                <a href="mailto:info@rehome.com" className="text-orange-500">info@rehome.com</a>{" "}
                or call us at{" "}
                <a href="tel:+15551234567" className="text-orange-500">+1 (555) 123-4567</a>.
              </p>
            </div>

            {/* Why Choose Us */}
             <div className="bg-white rounded-lg shadow-md p-6">
                <Link to="/why-choose-us">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Why Choose Us</h3>
                      <ul className="space-y-3">
                        <motion.li
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center text-gray-700"
                        >
                          <MdCheckCircle className="text-orange-500 mr-2 h-5 w-5" /> Wide selection of quality pre-loved furniture.
                        </motion.li>
                        <motion.li
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center text-gray-700"
                        >
                          <MdCheckCircle className="text-orange-500 mr-2 h-5 w-5" /> Sustainable and eco-friendly choices.
                        </motion.li>
                        <motion.li
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center text-gray-700"
                        >
                          <MdSupportAgent className="text-orange-500 mr-2 h-5 w-5" /> Excellent customer service and support.
                        </motion.li>
                        <motion.li
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center text-gray-700"
                        >
                          <MdCheckCircle className="text-orange-500 mr-2 h-5 w-5" /> Competitive pricing.
                        </motion.li>
                      </ul>
                 </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer /> {/* Use the Footer component here */}
    </div>
  );
};

export default LandingPage;