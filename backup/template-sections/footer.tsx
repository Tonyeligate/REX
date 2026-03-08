import React from 'react';

const Footer = () => {
  return (
    <footer className="px-lg-4 px-md-2 px-0 py-3 mt-auto">
      <div className="container-fluid">
        <div className="flex flex-col md:flex-row items-center justify-between border-t pt-3">
          <p className="mb-0 text-[#9ca3af] text-[14px] font-normal leading-[1.5]">
            © 2023 <a href="https://themeforest.net/user/thememakker" target="_blank" rel="noreferrer" className="text-[#F07000] hover:underline">ThemeMakker</a>, All Rights Reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center md:justify-end mb-0 list-none p-0">
            <li className="px-3 py-1">
              <a 
                href="#" 
                className="text-[14px] text-[#4b5563] hover:text-[#F07000]"
              >
                Support
              </a>
            </li>
            <li className="px-3 py-1">
              <a 
                href="#" 
                className="text-[14px] text-[#4b5563] hover:text-[#F07000]"
              >
                Docs
              </a>
            </li>
            <li className="px-3 py-1">
              <a 
                href="#" 
                className="text-[14px] text-[#4b5563] hover:text-[#F07000]"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;