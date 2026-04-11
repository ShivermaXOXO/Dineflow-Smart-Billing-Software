import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200 py-10 ">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">

        {/* Developed By */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-white"> Developed & Managed By</h4>
          <p className="text-gray-400">TechieGuys</p>
          <p className="text-gray-400">Empowering Cafés with Smart Billing Solutions</p>
        </div>

        {/* About Us */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-white"> About Us</h4>
          <p className="text-gray-400">
            We provide a modern, cloud-powered billing system tailored for hotels and cafés.
            Real-time dashboards, smart staff management, and insightful analytics — all in one platform.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-white"> Contact Us</h4>
          <p className="text-gray-400">Email: <a href="vermashivam8868@gmail.com" className="underline">vermashivam8868@gmail.com</a></p>
          <p className="text-gray-400">Phone: +91 7017203912</p>
          <p className="text-gray-400">
            Website: <a href="https://techieguys.vercel.app/" target="_blank" rel="noopener noreferrer" className="underline text-blue-400">TechieGuys.com</a>
          </p>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="text-center text-xs text-gray-500 mt-10 border-t border-gray-800 pt-4">
        © {new Date().getFullYear()} <span className="font-medium">TechieGuys</span>. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
