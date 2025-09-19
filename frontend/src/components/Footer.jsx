import React from "react";
import { Link } from "react-router-dom";
import { GiKnifeFork } from "react-icons/gi";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-8 md:pt-12 lg:pt-16 pb-6 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">

          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-1 mb-6 md:mb-8">
            <div className="flex items-center mb-3">
              <GiKnifeFork size={24} className="text-gray-300 md:hidden" />
              <GiKnifeFork size={28} className="text-gray-300 hidden md:block" />
              <span className="bg-gradient-to-r from-orange-500 via-orange-700 to-orange-700 bg-clip-text text-lg md:text-xl font-bold text-transparent ml-2">MoodBite</span>
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Delivering happiness, one bite at a time. Your favorite dishes delivered fresh to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mb-6 md:mb-8">
            <h6 className="font-bold mb-3 md:mb-4 text-base md:text-lg">Quick Links</h6>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-orange-400 transition-colors text-sm md:text-base">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-orange-400 transition-colors text-sm md:text-base">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-gray-300 hover:text-orange-400 transition-colors text-sm md:text-base">
                  Offers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-orange-400 transition-colors text-sm md:text-base">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mb-6 md:mb-8">
            <h6 className="font-bold mb-3 md:mb-4 text-base md:text-lg">Contact Info</h6>
            <div className="space-y-2">
              <div className="flex items-center">
                <FaEnvelope className="text-orange-500 mr-2 text-sm" />
                <span className="text-sm md:text-base text-gray-300">support@moodbite.com</span>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-orange-500 mr-2 text-sm" />
                <span className="text-sm md:text-base text-gray-300">+91 98765 43210</span>
              </div>
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-orange-500 mr-2 text-sm mt-1 flex-shrink-0" />
                <span className="text-sm md:text-base text-gray-300">123 Food Street, Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-6 md:mb-8">
            <h6 className="font-bold mb-3 md:mb-4 text-base md:text-lg">Follow Us</h6>
            <div className="flex space-x-3 md:space-x-4">
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF size={14} className="md:hidden" />
                <FaFacebookF className="hidden md:block" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={14} className="md:hidden" />
                <FaInstagram className="hidden md:block" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter size={14} className="md:hidden" />
                <FaTwitter className="hidden md:block" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 md:w-10 md:h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={14} className="md:hidden" />
                <FaLinkedinIn className="hidden md:block" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="text-center py-4 md:py-6 border-t border-gray-700">
          <small className="text-gray-400 text-xs md:text-sm">
            © {new Date().getFullYear()} MoodBite. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
