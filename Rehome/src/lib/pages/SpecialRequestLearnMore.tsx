import React from 'react';
import { Link } from 'react-router-dom';
import { FaHandshake, FaArrowLeft, FaArchive, FaBroom, FaGlobe, FaEnvelope } from 'react-icons/fa';
import Footer from '../../components/Footer';

const SpecialRequestLearnMore: React.FC = () => {
  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-8">
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-orange-500 rounded-full p-4">
                <FaHandshake className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tailored Services for Storage, Junk Removal, and International or Large-Scale Moves
            </h1>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              ReHome's Special Request section covers services that go beyond standard moving or transport jobs. 
              These include short- and long-term item storage, junk removal, and full or international relocations — 
              all tailored to your specific situation and handled with care and efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {/* Storage Services */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-orange-500 rounded-full p-3 mr-4">
                  <FaArchive className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Storage Services</h2>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  Need to store furniture or appliances for a few weeks or months? We offer secure short- and long-term 
                  storage within the Netherlands. You decide whether you drop off the items yourself or request pickup 
                  from your home. We also offer redelivery when your storage period ends. Storage is charged on a daily 
                  basis (minimum two weeks).
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center">
                    <FaEnvelope className="h-5 w-5 text-orange-500 mr-2" />
                    <p className="font-medium">
                      Just send us a list of items to store and the intended duration — we'll reply with a tailored quote.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Junk Removal */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-orange-500 rounded-full p-3 mr-4">
                  <FaBroom className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Junk Removal</h2>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  From broken furniture to leftover clutter after a move, we offer affordable and responsible junk removal. 
                  Our team handles collection and disposal, with a focus on sustainability whenever possible.
                </p>
                <p>
                  You'll receive a quote based on the volume and type of items. Whether it's a single heavy piece or 
                  a full room clearance, we'll take care of it.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center">
                    <FaEnvelope className="h-5 w-5 text-orange-500 mr-2" />
                    <p className="font-medium">
                      Provide a list or photos of what needs removing, along with the location, and we'll respond 
                      within 24 hours with a quote.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full & International Moves */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-orange-500 rounded-full p-3 mr-4">
                  <FaGlobe className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Full & International Moves</h2>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  For more complex moves — across the Netherlands or abroad — we provide flexible, end-to-end relocation 
                  services. This includes packing, carrying, disassembly/reassembly, floor delivery, and logistics planning 
                  for international or long-distance jobs.
                </p>
                <p>
                  Whether you're moving an entire household to another city or relocating abroad, we'll coordinate every step. 
                  All services are modular — you choose what to include.
                </p>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center">
                    <FaEnvelope className="h-5 w-5 text-orange-500 mr-2" />
                    <p className="font-medium">
                      Tell us your pickup and drop-off locations, your item list, and any services you need — 
                      we'll build a custom plan and quote for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="text-center">
            <p className="text-lg text-gray-700 leading-relaxed">
              Fill out the form for the specific service you need under Special Request, and we'll get back to you 
              shortly with your custom quote.
            </p>
          </div>
        </div>
      </div>

      {/* Service Features */}
      <div className="py-16 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose Our Special Request Services?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Fully Customizable</h3>
              <p className="text-gray-600">Every service is tailored to your specific needs and requirements.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Professional Handling</h3>
              <p className="text-gray-600">Experienced team with proper equipment for all types of special requests.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Sustainable Approach</h3>
              <p className="text-gray-600">Focus on responsible disposal and environmental consciousness.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">Fast quotes and efficient service delivery for all special requests.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Have a Special Request?</h2>
          <Link 
            to="/special-request" 
            className="inline-block bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Booking Process
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SpecialRequestLearnMore; 