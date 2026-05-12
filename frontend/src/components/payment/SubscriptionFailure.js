import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SubscriptionFailure = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const errorMessage =
    urlParams.get("message") ||
    "We couldn’t complete your subscription payment. Please try again.";

  const paymentStatus = urlParams.get("status") || "failed";
  const transactionId = urlParams.get("transactionId") || "Unavailable";
  const planName = urlParams.get("plan") || "Subscription";
  const amount = urlParams.get("amount") || "Unavailable";

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4">
      {/* Error Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-[#fee2e2] rounded-full flex items-center justify-center shadow-lg shadow-red-100">
          <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#1e40af] mb-2">
          Subscription payment failed
        </h1>
        <p className="text-slate-500 font-medium">
          Please review your payment details and try again
        </p>
      </div>

      {/* Details Card */}
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl shadow-blue-100/50 p-10">
        <div className="space-y-6">
          {/* Message */}
          <div className="bg-[#fef2f2] border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
          </div>

          {/* Transaction ID */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Transaction ID:</span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-mono tracking-wider">
              {transactionId}
            </span>
          </div>

          {/* Plan */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Plan:</span>
            <span className="bg-[#eff6ff] text-[#2563eb] px-4 py-1.5 rounded-full text-sm font-bold">
              {planName}{" "}
              <span className="font-normal text-blue-400">({amount})</span>
            </span>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="flex items-center gap-1.5 bg-[#fef2f2] text-[#dc2626] px-3 py-1 rounded-full text-sm font-bold border border-red-100">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7zm1 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 15z"
                  clipRule="evenodd"
                />
              </svg>
              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
            </span>
          </div>

          {/* Suggestions */}
          <div className="bg-[#f8fafc] rounded-2xl p-6 mt-4">
            <h3 className="text-slate-900 font-bold mb-4">Try this next:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#ef4444] text-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                      d="M13 5h6m0 0v6m0-6L10 14l-4-4-6 6"
                    />
                  </svg>
                </span>
                Check your card details and billing address
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#ef4444] text-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                      d="M13 5h6m0 0v6m0-6L10 14l-4-4-6 6"
                    />
                  </svg>
                </span>
                Try again with a different payment method
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#ef4444] text-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                      d="M13 5h6m0 0v6m0-6L10 14l-4-4-6 6"
                    />
                  </svg>
                </span>
                Contact support if the issue continues
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-200"
            >
              Back to plans
            </button>

            <button
              onClick={() => navigate("/subscription-detail")}
              className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Retry payment
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-500 text-sm">
        Need help?{" "}
        <button
          type="button"
          onClick={() => navigate("/contact")}
          className="text-slate-700 font-semibold hover:underline"
        >
          Contact support
        </button>
      </p>
    </div>
  );
};

export default SubscriptionFailure;
