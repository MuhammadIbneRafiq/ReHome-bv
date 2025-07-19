// import { useTranslation } from 'react-i18next';
import { FaGavel, FaShieldAlt, FaHandshake, FaFileContract } from 'react-icons/fa';

export default function TermsPage() {
  // const { t } = useTranslation();

  const sections = [
    {
      icon: <FaFileContract className="h-8 w-8 text-orange-600" />,
      title: "Service Agreement",
      content: "By using ReHome's services, you agree to these terms and conditions. Our platform facilitates furniture marketplace transactions and moving services between users."
    },
    {
      icon: <FaShieldAlt className="h-8 w-8 text-orange-600" />,
      title: "User Responsibilities",
      content: "Users must provide accurate information, maintain account security, and comply with all applicable laws when using our services."
    },
    {
      icon: <FaHandshake className="h-8 w-8 text-orange-600" />,
      title: "Transaction Terms",
      content: "All transactions are between individual users. ReHome acts as a platform facilitator and is not responsible for the quality or delivery of items sold through our marketplace."
    },
    {
      icon: <FaGavel className="h-8 w-8 text-orange-600" />,
      title: "Dispute Resolution",
      content: "Disputes between users should be resolved amicably. ReHome may provide mediation assistance but is not liable for transaction outcomes."
    }
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-24">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Your agreement with ReHome B.V.
          </p>
          <p className="text-sm opacity-80">
            Last updated: January 2025
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to ReHome</h2>
            <p className="text-gray-600 mb-4">
              These Terms of Service ("Terms") govern your use of ReHome's platform and services. 
              By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <p className="text-gray-600">
              ReHome B.V. is a Netherlands-based company providing furniture marketplace and moving services 
              to help people buy, sell, and relocate furniture sustainably.
            </p>
          </div>

          {/* Key Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  {section.icon}
                  <h3 className="text-xl font-semibold ml-3">{section.title}</h3>
                </div>
                <p className="text-gray-600">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Detailed Terms */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Detailed Terms</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Account Registration</h3>
                <p className="text-gray-600">
                  You must provide accurate and complete information when creating an account. 
                  You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2. Marketplace Transactions</h3>
                <p className="text-gray-600">
                  Sellers are responsible for accurate item descriptions and pricing. 
                  Buyers should inspect items before purchase when possible. 
                  ReHome facilitates connections but does not guarantee transaction outcomes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3. Moving Services</h3>
                <p className="text-gray-600">
                  Moving services are provided by third-party providers. 
                  Pricing is calculated based on distance, item complexity, and additional services requested. 
                  No insurance coverage is provided for the items as of now.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4. Payment Terms</h3>
                <p className="text-gray-600">
                  Payment arrangements are made directly between users and service providers. 
                  Service fees are clearly disclosed before transaction completion. 
                  Refunds are processed according to our refund policy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5. Prohibited Activities</h3>
                <p className="text-gray-600">
                  Users may not engage in fraudulent activities, misrepresent items, 
                  spam other users, or violate any applicable laws while using our platform.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">6. Limitation of Liability</h3>
                <p className="text-gray-600">
                  ReHome's liability is limited to the service fees paid. 
                  We are not liable for damages resulting from user interactions, 
                  item defects, or delivery issues beyond our direct control.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">7. Modifications to Terms</h3>
                <p className="text-gray-600">
                  These Terms may be updated periodically. 
                  Users will be notified of significant changes via email or platform notifications. 
                  Continued use constitutes acceptance of updated Terms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">8. Contact Information</h3>
                <p className="text-gray-600">
                  For questions about these Terms, contact us at info@rehomebv.com or 
                  visit our Contact Us page for additional support options.
                </p>
              </div>
            </div>
          </div>

          {/* Company Information - Required by Dutch Law */}
          <div className="bg-orange-100 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Company Name:</p>
                <p className="text-gray-600">ReHome B.V.</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Legal Form:</p>
                <p className="text-gray-600">BV (Besloten Vennootschap)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Registered Address:</p>
                <p className="text-gray-600">Stedekestraat 74, 5041 DN Tilburg</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Chamber of Commerce (KvK):</p>
                <p className="text-gray-600">96235004</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">VAT Number:</p>
                <p className="text-gray-600">NL867525010B01</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Contact Email:</p>
                <p className="text-gray-600">info@rehomebv.com</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Contact Phone:</p>
                <p className="text-gray-600">+31 6 45839273</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">VAT Information:</p>
                <p className="text-gray-600">VAT is included in the price estimate for our services and in the prices for our furniture listings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 