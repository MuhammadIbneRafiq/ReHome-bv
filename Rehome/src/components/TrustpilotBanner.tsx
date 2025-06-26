import { FaStar, FaRegStar } from 'react-icons/fa';

const TrustpilotBanner = () => {
  return (
    <div className="bg-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          href="https://nl.trustpilot.com/review/rehomebv.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          {/* Trustpilot Logo */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-[#00b67a]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 .5l3.09 6.26L22 7.77l-5 4.87 1.18 6.88L12 16.31l-6.18 3.22L7 12.64l-5-4.87 6.91-1.01L12 .5z" />
            </svg>
            <span className="text-3xl font-bold text-gray-800 tracking-tighter">
              Trustpilot
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="h-5 w-5 text-white" style={{ backgroundColor: '#00b67a', padding: '2px' }} />
              ))}
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              Excellent 4.8
            </p>
          </div>

          {/* Reviews Link */}
          <p className="text-gray-600">
            Based on <span className="font-bold underline">100+ reviews</span>
          </p>
        </a>
      </div>
    </div>
  );
};

export default TrustpilotBanner; 