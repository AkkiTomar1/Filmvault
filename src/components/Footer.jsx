import React from "react";

const Footer = () => {
  return (
    <footer className=" bg-gray-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center h-[20px]">
        {/* Left Section */}
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h2 className="text-lg font-bold">MovieApp</h2>
          <p className="text-sm text-gray-400">© 2025 MovieApp. Created by Akki.</p>
        </div>

        {/* Middle Section */}
        <div className="flex space-x-4 mb-4 md:mb-0">
          <a href="#" className="text-gray-400 hover:text-white transition">
            About
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            Contact
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            Privacy Policy
          </a>
          
        </div>

        {/* Right Section - Social Icons */}
        <div className="flex space-x-4">
          <a href="https://www.facebook.com/akki.tomar.9081" className="text-gray-400 hover:text-white transition">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="https://x.com/ASTOMAR98" className="text-gray-400 hover:text-white transition">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://www.instagram.com/suk0on1" className="text-gray-400 hover:text-white transition">
            <i className="fab fa-instagram"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
