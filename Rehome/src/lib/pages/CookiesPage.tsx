// import { useTranslation } from 'react-i18next';
import { FaCookie, FaChartBar, FaCog, FaShieldAlt } from 'react-icons/fa';

export default function CookiesPage() {
  // const { t } = useTranslation();

  const cookieTypes = [
    {
      icon: <FaCog className="h-8 w-8 text-orange-600" />,
      title: "Essential Cookies",
      content: "These cookies are necessary for the website to function properly. They enable basic features like page navigation, secure login, and access to protected areas.",
      required: true
    },
    {
      icon: <FaChartBar className="h-8 w-8 text-orange-600" />,
      title: "Analytics Cookies",
      content: "We use these cookies to understand how visitors interact with our website, helping us improve functionality and user experience.",
      required: false
    },
    {
      icon: <FaShieldAlt className="h-8 w-8 text-orange-600" />,
      title: "Security Cookies",
      content: "These cookies help us detect and prevent fraudulent activity, ensuring a secure environment for all users.",
      required: true
    },
    {
      icon: <FaCookie className="h-8 w-8 text-orange-600" />,
      title: "Preference Cookies",
      content: "These cookies remember your preferences and settings to provide a personalized experience on future visits.",
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-24">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Cookie Policy
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            How we use cookies to enhance your experience
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
            <h2 className="text-2xl font-bold mb-4">Understanding Cookies</h2>
            <p className="text-gray-600 mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better, faster, and safer experience.
            </p>
            <p className="text-gray-600">
              This Cookie Policy explains what cookies are, how we use them on ReHome's platform, 
              and how you can manage your cookie preferences.
            </p>
          </div>

          {/* Cookie Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {cookieTypes.map((cookie, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  {cookie.icon}
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold">{cookie.title}</h3>
                    {cookie.required && (
                      <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                    {!cookie.required && (
                      <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600">{cookie.content}</p>
              </div>
            ))}
          </div>

          {/* Detailed Cookie Information */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Detailed Cookie Information</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">What Are Cookies?</h3>
                <p className="text-gray-600">
                  Cookies are small pieces of data stored on your device by websites you visit. 
                  They're widely used to make websites work more efficiently and provide a better user experience. 
                  Cookies can remember your preferences, login status, and other information to personalize your visit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">How We Use Cookies</h3>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• To keep you logged in as you navigate between pages</li>
                  <li>• To remember your language and location preferences</li>
                  <li>• To analyze website traffic and optimize performance</li>
                  <li>• To prevent fraudulent activity and enhance security</li>
                  <li>• To provide personalized content and recommendations</li>
                  <li>• To remember your cart contents during shopping</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Third-Party Cookies</h3>
                <p className="text-gray-600 mb-2">
                  We may use third-party services that place cookies on your device. These include:
                </p>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• Google Analytics for website usage statistics</li>
                  <li>• Payment processors for secure transaction handling</li>
                  <li>• Authentication services for secure login</li>
                  <li>• Content delivery networks for faster loading</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Cookie Duration</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700">Session Cookies</p>
                    <p className="text-gray-600">These are temporary cookies that are deleted when you close your browser.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Persistent Cookies</p>
                    <p className="text-gray-600">These remain on your device for a specified period or until you delete them manually.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Managing Your Cookie Preferences</h3>
                <p className="text-gray-600 mb-3">
                  You have several options for managing cookies:
                </p>
                <ul className="text-gray-600 space-y-2 ml-4">
                  <li>• Use our cookie preference center (available in the footer)</li>
                  <li>• Adjust settings in your web browser</li>
                  <li>• Use browser extensions that block tracking cookies</li>
                  <li>• Clear cookies and browsing data regularly</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  Note: Disabling essential cookies may affect website functionality and your user experience.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Browser-Specific Instructions</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700">Chrome</p>
                    <p className="text-gray-600">Settings → Privacy and Security → Cookies and other site data</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Firefox</p>
                    <p className="text-gray-600">Settings → Privacy & Security → Cookies and Site Data</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Safari</p>
                    <p className="text-gray-600">Preferences → Privacy → Cookies and website data</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Edge</p>
                    <p className="text-gray-600">Settings → Cookies and site permissions → Cookies and site data</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Updates to This Policy</h3>
                <p className="text-gray-600">
                  We may update this Cookie Policy from time to time to reflect changes in our practices 
                  or applicable laws. We will notify you of any significant changes by posting the updated 
                  policy on our website with a new "Last updated" date.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
                <p className="text-gray-600">
                  If you have questions about our use of cookies or this Cookie Policy, 
                  please contact us at cookies@rehome.nl or through our Contact Us page.
                </p>
              </div>
            </div>
          </div>

          {/* Cookie Settings */}
          <div className="bg-orange-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Manage Your Cookie Preferences</h3>
            <p className="text-gray-600 mb-4">
              You can adjust your cookie preferences at any time by visiting our cookie settings page 
              or using your browser's privacy controls.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
                Cookie Settings
              </button>
              <button className="bg-white text-orange-600 border border-orange-600 px-4 py-2 rounded hover:bg-orange-50 transition-colors">
                Learn More About Privacy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
