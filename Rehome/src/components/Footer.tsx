import { Link } from "react-router-dom"; // Import Link

const socialMedia = [
  {
    id: 1,
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png", // Instagram logo
    link: "https://www.instagram.com/autolandingaiofficial/",
  },
  {
    id: 2,
    img: "https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png", // YouTube logo
    link: "https://www.youtube.com/channel/UCbmFzKaDReXV7XpUi6HTfXw",
  },
  {
    id: 3,
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Linkedin_icon.svg", // LinkedIn logo
    link: "https://www.linkedin.com/in/muhammad-ibne-rafiq/",
  }
];

const Footer = () => {
  return (
    <footer className="w-full pt-20 pb-10 bg-gray-100">
      {/* background grid */}
      <div className="flex flex-col items-center mb-8">
        <Link
          to="/sell"
          className="rehome-button"
        >
          Looking to Sell?
        </Link>
      </div>
      <div className="flex mt-16 md:flex-row flex-col justify-around items-center">
        <p className="md:text-base text-sm md:font-normal font-light text-black dark:text-white">
          Copyright © 2024 ReHome B.v.
        </p>

        <div className="flex items-center md:gap-3 gap-6">
          {socialMedia.map((info: any) => (
            <a key={info.id} href={info.link}>
              <div
                key={info.id}
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