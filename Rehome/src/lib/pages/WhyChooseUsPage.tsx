import { FaDollarSign, FaTree, FaTruck, FaHandshake, FaStore, FaUsers } from 'react-icons/fa';
import logo from "../../assets/logorehome.png"
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const WhyChooseUsPage = () => {
    const [showBookingModal, setShowBookingModal] = useState(false);
    return (
        <div className="max-w-4xl mx-auto p-6 pt-24 bg-orange-0">  {/* Added pt-24 */}
            <img src={logo} alt="Rehome Logo" className="mx-auto mb-6 max-w-xs" /> {/* Logo added here */}
            <div className="pt-16">
            <h1 className="text-4xl font-bold mb-12">Who We Are</h1>
                <div className="space-y-8">
                    <p className="text-lg leading-relaxed">
                    ReHome is a student-founded and student-led company, created by a team of Tilburg University students who experienced first-hand how expensive, inflexible, and wasteful moving and furnishing can be — especially for students and internationals.
                    </p>

                    <p className="text-lg leading-relaxed">
                    What started as a practical solution for local student needs has grown into a full-service platform for <span className="font-semibold">affordable moving, item transport</span>, and a <span className="font-semibold">sustainable furniture marketplace</span> that serves customers across the Netherlands.
                    </p>

                    <p className="text-lg leading-relaxed">
                    We believe relocating or furnishing a space shouldn't be stressful or overpriced. Our goal is to make these services <span className="font-semibold">simple, transparent, and accessible</span> — for everyone.
                    </p>
                </div>
            </div>

        <div className="mt-16 mb-16">
          <h2 className="text-2xl font-bold mb-6">We offer:</h2>
          <ul className="list-disc pl-8 space-y-3 text-lg">
            <li>Fast and affordable house moving and item transport</li>
            <li>Special requests like storage, junk removal, and international moves</li>
            <li>A second-hand marketplace combining curated and user-listed furniture</li>
            <li>Donation and resale services to keep good items in use and out of landfills</li>
          </ul>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-10">Why Choose ReHome?</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaDollarSign className="text-orange-500" /> Modular Services
              </h2>
              <p className="text-lg">Only pay for what you need — nothing more. Whether it's full support or just transport, you stay in control.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaTruck className="text-orange-500" /> Customizable Every Step of the Way
              </h2>
              <p className="text-lg">We don't force a one-size-fits-all approach. You decide what gets carried, assembled, or handled.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaStore className="text-orange-500" /> Nationwide Reach
              </h2>
              <p className="text-lg">We operate across most major cities in the Netherlands — from local moves to intercity deliveries.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaUsers className="text-orange-500" /> Own Collection + Community Marketplace
              </h2>
              <p className="text-lg">We offer hand-picked second-hand items with optional delivery and extras — plus a community-driven listing platform.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaHandshake className="text-orange-500" /> Fast, Friendly, Human Service
              </h2>
              <p className="text-lg">We respond quickly, confirm personally, and carry out services with care. No call centers. No bots.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaTree className="text-orange-500" /> Student Spirit, Professional Standards
              </h2>
              <p className="text-lg">We combine the agility and creativity of a student-led team with the reliability of a well-run logistics operation.</p>
            </div>
          </div>
        </div>

            <div className="bg-orange-50 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Move or Furnish Your Home?</h2>
            <p className="text-lg mb-4">Contact us today for a free quote and let us help you with your moving or furniture needs!</p>
            <p className="text-xl font-semibold">Sustainable. Affordable. Convenient.</p>
            <Button
                onClick={() => setShowBookingModal(true)}
                className="mt-6 bg-orange-600 text-white hover:bg-orange-700"
                size="lg"
            >
                Get a Free Quote
            </Button>
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
        </div>
    );
};

export default WhyChooseUsPage;