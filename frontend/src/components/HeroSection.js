import React from "react";
import Navbar from "./Navbar";


export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center mb-6">
          {/* Logo */}
          <img
            src="YOUR_LOGO_SRC_HERE"
            alt="FinSync Logo"
            className="h-10 w-10 mr-2"
          />
          <span className="text-2xl font-semibold text-green-600">FinSync</span>
        </div>
        <div className="inline-flex items-center mb-6 px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          Trusted by 500+ Organizations
        </div>
        <h1 className="text-5xl font-bold mb-4 text-blue-700 leading-tight">
          Make Smarter Financial <br /> Decisions — All in One Place
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Streamline your accounting, visualize your financials, and reveal actionable business insights.
          SaaS-powered analytics for revenue, expenses, and growth—
          all secured by multi-tenant architecture.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold border border-gray-300 flex items-center justify-center shadow hover:bg-gray-100 transition">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="mr-2">
              <path d="M8 5v14l11-7z" fill="#4B5563"/>
            </svg>
            Watch Demo
          </button>
        </div>
        {/* Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
          <div>
            <div className="text-3xl font-bold text-green-600">500+</div>
            <div className="text-sm text-gray-500 mt-1">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">$2B+</div>
            <div className="text-sm text-gray-500 mt-1">Transactions Processed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">99.9%</div>
            <div className="text-sm text-gray-500 mt-1">Uptime</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-gray-500 mt-1">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
