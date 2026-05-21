import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SupportCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#a3d2ca] rounded-[28px] p-5 text-center border border-teal-200/50">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Need Help?</h2>
      <p className="text-xs text-slate-700 mb-4 leading-tight">
        Our support team is here to assist you with any questions.
      </p>
      <button
        onClick={() => navigate("/contact")}
        className="w-full py-2.5 bg-[#3d8c7e] text-white rounded-xl text-sm font-semibold hover:bg-[#2d6b60] transition-colors shadow-lg shadow-teal-900/10"
      >
        Contact Us
      </button>
    </div>
  );
}
