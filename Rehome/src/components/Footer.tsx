import { Link } from "react-router-dom"; // Import Link
import { useTranslation } from "react-i18next";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

const socialMedia = [
  {
    id: 1,
    icon: <FaInstagram size={20} />,
    link: "https://www.instagram.com/rehome.move/",
  },
  {
    id: 2,
    icon: <FaFacebook size={20} />,
    link: "https://www.facebook.com/profile.php?id=61572410534379#",
  }
];

const Footer = () => {
  const { t } = useTranslation();
  const phoneNumber = "31612265704"; // Without + for WhatsApp link

  return (
    <footer className="w-full pt-20 pb-10 bg-gray-100">
      {/* background grid */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex space-x-4"> {/* Flex container for side-by-side buttons */}
          <Link
            to="/sell-dash"
            className="rehome-button"
          >
            {t("footer.create_listing")}
          </Link>
          <Link
            to="/item-donation" // Link to the item donation page
            className="rehome-button" // Same styling as the sell button
          >
            {t("footer.item_donation")}
          </Link>
        </div>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${phoneNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-lg transition-colors duration-200"
        >
          <FaWhatsapp size={24} />
          <span className="font-medium">{t("footer.whatsapp_us")}</span>
        </a>

        {/* Social Media Links */}
        <div className="flex gap-4 mt-6">
          {socialMedia.map((platform) => (
            <a
              key={platform.id}
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {platform.icon}
            </a>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-600">
        <p>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
};

export default Footer;
