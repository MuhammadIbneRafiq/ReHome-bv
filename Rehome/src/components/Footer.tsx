import { Link } from "react-router-dom"; // Import Link
import { useTranslation } from "react-i18next";

const socialMedia = [
  {
    id: 1,
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png", // Instagram logo
    link: "https://www.instagram.com/rehome.move/",
  },
  {
    id: 2,
    img: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    link: "https://www.facebook.com/profile.php?id=61572410534379#",
  }
];

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full pt-20 pb-10 bg-gray-100">
      {/* background grid */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex space-x-4"> {/* Flex container for side-by-side buttons */}
          <Link
            to="/sell-dash"
            className="rehome-button"
          >
            {t('dashboard.createListing')}
          </Link>
          <Link
            to="/item-donation" // Link to the item donation page
            className="rehome-button" // Same styling as the sell button
          >
            Item Donation
          </Link>
        </div>
      </div>
      <div className="flex mt-16 md:flex-row flex-col justify-around items-center">
        <p className="md:text-base text-sm md:font-normal font-light text-black dark:text-white">
          {t('footer.copyright')}
        </p>

        <div className="flex items-center md:gap-3 gap-6">
          {socialMedia.map((info: any) => (
            <a key={info.id} href={info.link}>
              <div
                className="w-10 h-10 cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg saturate-180 bg-opacity-75 bg-black-200 rounded-lg border border-black-300"
              >
                <img src={info.img} alt="icons" width={20} height={20} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
