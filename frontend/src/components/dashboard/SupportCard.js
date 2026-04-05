import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SupportCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#a3d2ca] rounded-[32px] p-8 text-center border border-teal-200/50">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Need Help?</h2>
      <p className="text-sm text-slate-700 mb-8 leading-relaxed">
        Our support team is here to assist you with any questions.
      </p>
      <button
        onClick={() => navigate("/contact")}
        className="w-full py-4 bg-[#3d8c7e] text-white rounded-2xl font-bold hover:bg-[#2d6b60] transition-colors shadow-lg shadow-teal-900/10"
      >
        Contact Us
      </button>
    </div>
  );
}