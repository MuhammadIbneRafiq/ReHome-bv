import { useTranslation } from 'react-i18next';
import { FaLock, FaUserShield, FaCookie, FaDatabase } from 'react-icons/fa';

export default function PrivacyPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <FaDatabase className="h-8 w-8 text-orange-600" />,
      title: "Data Collection",
      content: "We collect information you provide directly, such as account details, listing information, and communication data to provide our services effectively."
    },
    {
      icon: <FaUserShield className="h-8 w-8 text-orange-600" />,
      title: "Data Protection",
      content: "Your personal information is protected using industry-standard security measures. We never sell your data to third parties."
    },
    {
      icon: <FaLock className="h-8 w-8 text-orange-600" />,
      title: "Data Usage",
      content: "We use your data to provide services, improve user experience, process transactions, and communicate important updates about your account."
    },
    {
      icon: <FaCookie className="h-8 w-8 text-orange-600" />,
      title: "Cookies & Tracking",
      content: "We use essential cookies for functionality and analytics cookies to improve our services. You can manage cookie preferences in your browser."
    }
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-24">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            How we protect and use your information
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
            <h2 className="text-2xl font-bold mb-4">Your Privacy Matters</h2>
            <p className="text-gray-600 mb-4">
              At ReHome B.V., we are committed to protecting your privacy and ensuring transparency 
              about how we collect, use, and safeguard your personal information.
            </p>
            <p className="text-gray-600">
              This Privacy Policy explains our practices regarding data collection and usage 
              when you use our furniture marketplace and moving services platform.
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

          {/* Detailed Privacy Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Detailed Privacy Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• Account information (name, email, phone number)</li>
                  <li>• Profile information and preferences</li>
                  <li>• Listing details and photos</li>
                  <li>• Transaction and payment information</li>
                  <li>• Communication records and messages</li>
                  <li>• Location data for service delivery</li>
                  <li>• Usage analytics and website interactions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• Provide and maintain our marketplace services</li>
                  <li>• Process transactions and facilitate communications</li>
                  <li>• Send important account and service notifications</li>
                  <li>• Improve our platform functionality and user experience</li>
                  <li>• Prevent fraud and ensure platform security</li>
                  <li>• Comply with legal requirements and regulations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3. Information Sharing</h3>
                <p className="text-gray-600 mb-2">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share information only in these limited circumstances:
                </p>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• With your explicit consent</li>
                  <li>• To complete transactions you've initiated</li>
                  <li>• With service providers who assist our operations</li>
                  <li>• When required by law or legal process</li>
                  <li>• To protect our rights or prevent harm</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
                <p className="text-gray-600">
                  We implement robust security measures including encryption, secure servers, 
                  and regular security audits. However, no internet transmission is 100% secure, 
                  and we cannot guarantee absolute security of your data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5. Your Rights (GDPR Compliance)</h3>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• Right to access your personal data</li>
                  <li>• Right to correct inaccurate information</li>
                  <li>• Right to delete your data (right to be forgotten)</li>
                  <li>• Right to restrict processing</li>
                  <li>• Right to data portability</li>
                  <li>• Right to object to processing</li>
                  <li>• Right to withdraw consent</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">6. Data Retention</h3>
                <p className="text-gray-600">
                  We retain your personal information only as long as necessary to provide our services 
                  and comply with legal obligations. Account data is typically deleted within 30 days 
                  of account closure, unless required for legal or business purposes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">7. International Data Transfers</h3>
                <p className="text-gray-600">
                  As a Netherlands-based company, we primarily process data within the EU. 
                  Any international transfers are conducted with appropriate safeguards 
                  and in compliance with applicable data protection laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">8. Contact Us</h3>
                <p className="text-gray-600">
                  For privacy-related questions or to exercise your rights, contact our 
                  Data Protection Officer at privacy@rehome.nl or use our Contact Us page.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-orange-100 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold mb-2">Data Protection Officer</h3>
            <p className="text-gray-600">
              Email: privacy@rehome.nl<br />
              Address: ReHome B.V., Amsterdam, Netherlands<br />
              Phone: +31 6 1234 5678
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 