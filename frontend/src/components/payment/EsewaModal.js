import React from "react";

const EsewaModal = ({ isOpen, onClose, onPay, plan, formData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[420px] rounded-[2rem] shadow-2xl overflow-hidden relative transform transition-all duration-300 scale-100 opacity-100">
        
        {/* Header & Close Button */}
        <div className="p-6 md:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mt-3 mb-6 md:mb-8">
            <img
              src="/esewa.png" 
              alt="eSewa Logo"
              className="h-10 w-10 mx-auto object-contain mb-3"
            />
            <h3 className="text-xl md:text-2xl font-bold text-slate-900">Payment Gateway</h3>
            <p className="text-slate-500 text-sm mt-1">Complete your payment securely</p>
          </div>

          {/* Amount Due Card */}
          <div className="bg-[#f0fdfd] rounded-2xl p-5 md:p-6 mb-6 md:mb-8 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-slate-500 text-xs md:text-sm">Amount to pay:</p>
              <p className="text-teal-700 font-medium text-xs md:text-sm">
                Merchant: <span className="font-semibold text-slate-900">FinSync</span>
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900">NPR {plan.price}</p>
              <p className="text-xs md:text-sm text-slate-500 font-medium">{plan.name} Plan</p>
            </div>
          </div>

          {/* Data Summary */}
          <div className="space-y-3 mb-8 text-sm px-1">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500">Organization</span>
              <span className="font-semibold text-slate-900 truncate max-w-[180px]">{formData.orgName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500">Billing Email</span>
              <span className="font-semibold text-slate-900 truncate max-w-[180px]">{formData.billingEmail}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={onPay}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-xl transition duration-200 shadow-md text-sm md:text-base"
            >
              Pay NPR {plan.price}
            </button>
            <button
              onClick={onClose}
              className="w-full text-slate-500 bg-white border border-slate-200 text-sm md:text-base font-semibold py-3 md:py-3.5 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>

          {/* Secure Footer */}
          <div className="text-center text-[10px] md:text-xs text-slate-400 mt-8 pt-4 border-t border-slate-50 flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your payment is secured by eSewa
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsewaModal;