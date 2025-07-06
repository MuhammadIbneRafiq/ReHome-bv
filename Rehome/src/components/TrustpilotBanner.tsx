import { useEffect } from 'react';
import { FaStar } from 'react-icons/fa';

// Add type declaration for Trustpilot
declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null) => void;
    };
  }
}

const TrustpilotBanner = () => {
  useEffect(() => {
    // First, check if script already exists
    if (!document.getElementById('trustpilot-script')) {
      const script = document.createElement('script');
      script.id = 'trustpilot-script';
      script.type = 'text/javascript';
      script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
      script.async = true;
      
      // Add the script to head
      document.head.appendChild(script);

      // Force widget reload after script loads
      script.onload = () => {
        if (window.Trustpilot) {
          window.Trustpilot.loadFromElement(document.getElementById('trustpilot-widget'));
        }
      };
    } else {
      // If script exists, just reload the widget
      if (window.Trustpilot) {
        window.Trustpilot.loadFromElement(document.getElementById('trustpilot-widget'));
      }
    }

    return () => {
      const script = document.getElementById('trustpilot-script');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="bg-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          {/* Rating Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FaStar 
                  key={i} 
                  className={i < Math.floor(4.6) ? 'text-[#00b67a]' : 'text-gray-300'} 
                  size={24}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              4.6 out of 5
            </span>
            <span className="text-gray-600">
              Based on <span className="font-semibold">21 reviews</span>
            </span>
          </div>

          {/* TrustBox widget - Review Collector */}
          <div 
            id="trustpilot-widget"
            className="trustpilot-widget" 
            data-locale="nl-NL" 
            data-template-id="56278e9abfbbba0bdcd568bc" 
            data-businessunit-id="684d9a7a6deaf67934e33945" 
            data-style-height="52px" 
            data-style-width="100%"
          >
            <a href="https://nl.trustpilot.com/review/rehomebv.com" target="_blank" rel="noopener">Trustpilot</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustpilotBanner; 