import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Link to="/" className="text-lg font-semibold text-primary-600 dark:text-primary-400">ReliableRecruiter.Space</Link>
              <span className="ml-4 text-sm text-neutral-500 dark:text-neutral-400">© {currentYear} All rights reserved</span>
            </div>
            <div className="flex space-x-6 text-sm text-neutral-500 dark:text-neutral-400">
              <Link to="/" className="hover: dark:hover:text-neutral-200">Home</Link>
              <a href="#" className="hover: dark:hover:text-neutral-200">About</a>
              <a href="#" className="hover: dark:hover:text-neutral-200">Privacy</a>
              <a href="#" className="hover: dark:hover:text-neutral-200">Terms</a>
              <a href="#" className="hover: dark:hover:text-neutral-200">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
