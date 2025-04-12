import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Link to="/" className="text-lg font-semibold text-primary-600">ReliableRecruiter.Space</Link>
              <span className="ml-4 text-sm text-neutral-500">© {currentYear} All rights reserved</span>
            </div>
            <div className="flex space-x-6 text-sm text-neutral-500">
              <Link to="/" className="hover:text-neutral-700">Home</Link>
              <a href="#" className="hover:text-neutral-700">About</a>
              <a href="#" className="hover:text-neutral-700">Privacy</a>
              <a href="#" className="hover:text-neutral-700">Terms</a>
              <a href="#" className="hover:text-neutral-700">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
