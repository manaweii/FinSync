import React from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  // Social Media Data with SVGs and mailto link
  const socialLinks = [
    { 
      label: 'Twitter', 
      href: 'https://twitter.com',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/>
        </svg>
      )
    },
    { 
      label: 'LinkedIn', 
      href: 'https://linkedin.com',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    { 
      label: 'GitHub', 
      href: 'https://github.com',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      )
    },
    { 
      label: 'Email', 
      href: 'mailto:finsync2026@gmail.com', 
      icon: <EnvelopeIcon className="h-5 w-5" /> 
    }
  ];

  return (
    <footer className="bg-[#0f172a] text-slate-400 py-16 px-6 md:px-12 font-sans border-t border-slate-800/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center space-x-2">
              <img
                src="./FinSync_Icon.png"
                alt="FinSync Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-[#4ade80] font-medium text-xl tracking-tight">FinSync</span>
            </div>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-xs">
              Empowering organizations with intelligent financial management. 
              Make smarter decisions with real-time insights and secure, scalable infrastructure.
            </p>
            
            {/* Social Icons Section */}
            <div className="flex space-x-3">
              {socialLinks.map((item, i) => (
                <a 
                  key={i} 
                  href={item.href}
                  aria-label={item.label}
                  className="w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all duration-200 text-slate-300"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-base">Product</h3>
            <ul className="space-y-4 text-[15px]">
              <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-base">Company</h3>
            <ul className="space-y-4 text-[15px]">
              <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-base">Resources</h3>
            <ul className="space-y-4 text-[15px]">
              <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Legal & Copyright */}
        <div className="border-t border-slate-800/60 pt-10 flex flex-col items-center space-y-4">
          <p className="text-sm text-slate-500">
            © 2026 FinSync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;