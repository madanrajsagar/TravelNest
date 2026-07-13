import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50 text-slate-500">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200/50 pb-6 sm:flex-row">
          
          {/* Socials using FontAwesome */}
          <div className="flex items-center gap-4 text-slate-400">
            <a href="#" className="transition-colors hover:text-slate-700" aria-label="Facebook">
              <i className="fa-brands fa-facebook text-lg"></i>
            </a>
            <a href="#" className="transition-colors hover:text-slate-700" aria-label="Instagram">
              <i className="fa-brands fa-instagram text-lg"></i>
            </a>
            <a href="#" className="transition-colors hover:text-slate-700" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin text-lg"></i>
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            <Link to="/privacy" className="transition-colors hover:text-slate-800">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-slate-800">Terms</Link>
            <Link to="/listings" className="transition-colors hover:text-slate-800">Destinations</Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs sm:flex-row">
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} TravelNest Private Limited. All rights reserved.
          </p>
          <p className="text-slate-400">
            Made with 🤍 for travelers around the world.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
