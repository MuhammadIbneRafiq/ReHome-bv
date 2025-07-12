import React, { useState } from 'react';
import { FaShare, FaCopy, FaWhatsapp, FaFacebook, FaTwitter, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
  variant?: 'icon' | 'button';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  url,
  description = '',
  className = '',
  variant = 'button'
}) => {
  const [showDialog, setShowDialog] = useState(false);

  // Function to safely encode URLs and text
  const safeEncode = (text: string) => {
    try {
      return encodeURIComponent(text.trim());
    } catch (error) {
      console.error('Error encoding text:', error);
      return '';
    }
  };

  // Function to handle native sharing
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title,
          text: description,
          url: url
        };
        
        await navigator.share(shareData);
        toast.success('Link is copied!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
          setShowDialog(true);
        }
      }
    } else {
      setShowDialog(true);
    }
  };

  // Function to copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  // Share URLs for different platforms with safe encoding
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${safeEncode(`${title}\n\n${description}\n\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${safeEncode(url)}&quote=${safeEncode(title)}`,
    twitter: `https://twitter.com/intent/tweet?text=${safeEncode(title)}&url=${safeEncode(url)}`,
    email: `mailto:?subject=${safeEncode(title)}&body=${safeEncode(`${description}\n\n${url}`)}`
  };

  // Button styles based on variant
  const buttonStyles = variant === 'icon' 
    ? 'p-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md'
    : 'flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md';

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNativeShare();
        }}
        className={`${buttonStyles} ${className}`}
        title="Share this item"
      >
        <FaShare className={variant === 'icon' ? 'w-5 h-5 text-gray-600' : 'w-4 h-4 text-gray-600'} />
        {variant !== 'icon' && <span className="text-gray-700 font-medium">Share</span>}
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900">Share this item</DialogTitle>
          </DialogHeader>
          
          {/* Share link section */}
          <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg mb-6 border border-gray-100">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 text-sm bg-transparent border-none focus:outline-none text-gray-700 font-medium"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 group"
              title="Copy link"
            >
              <FaCopy className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>

          {/* Share buttons grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(shareUrls.whatsapp, '_blank', 'width=550,height=435');
              }}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-md group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#25D366] bg-opacity-10 rounded-full group-hover:bg-opacity-20 transition-all duration-200">
                <FaWhatsapp className="w-6 h-6 text-[#25D366]" />
              </div>
              <span className="text-sm font-medium text-gray-700">WhatsApp</span>
            </a>
            <a
              href={shareUrls.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(shareUrls.facebook, '_blank', 'width=550,height=435');
              }}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-md group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#1877F2] bg-opacity-10 rounded-full group-hover:bg-opacity-20 transition-all duration-200">
                <FaFacebook className="w-6 h-6 text-[#1877F2]" />
              </div>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </a>
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(shareUrls.twitter, '_blank', 'width=550,height=435');
              }}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-md group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-[#1DA1F2] bg-opacity-10 rounded-full group-hover:bg-opacity-20 transition-all duration-200">
                <FaTwitter className="w-6 h-6 text-[#1DA1F2]" />
              </div>
              <span className="text-sm font-medium text-gray-700">Twitter</span>
            </a>
            <a
              href={shareUrls.email}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = shareUrls.email;
              }}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-md group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-gray-500 bg-opacity-10 rounded-full group-hover:bg-opacity-20 transition-all duration-200">
                <FaEnvelope className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Email</span>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton; 