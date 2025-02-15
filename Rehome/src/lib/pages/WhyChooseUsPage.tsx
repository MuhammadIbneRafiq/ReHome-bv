import { FaDollarSign, FaTree, FaTruck, FaHandshake, FaStore, FaUsers } from 'react-icons/fa';
import logo from "../../assets/logorehome.jpg";

const WhyChooseUsPage = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 pt-24">
            <img src={logo} alt="Rehome Logo" className="mx-auto mb-6 max-w-xs" /> {/* Logo added here */}
            <h1 className="text-3xl font-bold mb-6">Why Choose Us?</h1>
            <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaDollarSign className="text-orange-500" /> 1. Affordable & Transparent Pricing
                    </h2>
                    <p>No hidden fees—just fair, upfront pricing for moving services and second-hand furniture. Whether you need a full house move or a single item transported, we provide cost-effective solutions.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaTree className="text-orange-500" /> 2. Eco-Friendly & Sustainable
                    </h2>
                    <p>Every second-hand furniture purchase helps reduce waste and save trees. By choosing pre-loved items, you’re making a conscious choice for the environment while saving money.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaTruck className="text-orange-500" /> 3. Reliable & Professional Team
                    </h2>
                    <p>Our experienced movers handle your belongings with care and efficiency. From bulky furniture to delicate items, we ensure safe transportation and delivery.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaHandshake className="text-orange-500" /> 4. Convenience at Your Fingertips
                    </h2>
                    <p>Need furniture? Browse our second-hand collection. Need something moved? Book our quick and efficient transport service. Need a quote? Simply message us, and we’ll respond fast.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaStore className="text-orange-500" /> 5. Serving Expats, Students & Locals
                    </h2>
                    <p>Whether you're a student moving into a new dorm, an expat settling in, or a local upgrading your home, we’re here to help with affordable moving and furniture solutions.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaUsers className="text-orange-500" /> 6. Social Impact & Community Support
                    </h2>
                    <p>We help connect donated furniture with students at low costs, making home essentials accessible and sustainable.</p>
                </div>
            </div>
            <div className="mt-6 text-center">
                <h2 className="text-2xl font-bold">Ready to Move or Furnish Your Home?</h2>
                <p>Contact us today for a free quote and let us help you with your moving or furniture needs!</p>
                <p className="font-semibold">Sustainable. Affordable. Hassle-Free.</p>
            </div>
        </div>
    );
};

export default WhyChooseUsPage;