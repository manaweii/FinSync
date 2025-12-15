import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-none px-8 py-4 flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <img
          src="/FinSync_Icon.png"
          alt="FinSync Logo"
          className="h-20 w-20 rounded-xl"
        />
        {/* Logo Text */}
        <span className="text-2xl font-semibold">
          <span className="text-blue-600">Fin</span>
          <span className="text-green-500">Sync</span>
        </span>
      </div>
      <div className="flex items-center gap-12">
        <a href="#features" className="text-gray-600 text-lg font-medium hover:text-blue-600 transition">Features</a>
        <a href="#platform" className="text-gray-600 text-lg font-medium hover:text-blue-600 transition">Platform</a>
        <a href="#pricing" className="text-gray-600 text-lg font-medium hover:text-blue-600 transition">Pricing</a>
        <a href="#about" className="text-gray-600 text-lg font-medium hover:text-blue-600 transition">About</a>
        <a href="#contact" className="text-gray-600 text-lg font-medium hover:text-blue-600 transition">Contact</a>
      </div>
      <div className="flex items-center gap-4">
        <Link 
          to="/Login" 
          className="text-gray-600 text-lg font-medium hover:text-blue-600 transition"
        >
          Login
        </Link>
        <Link
          to="/Signup"
          className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-xl text-lg font-semibold shadow hover:from-blue-600 hover:to-green-600 transition"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
