import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const data = location.state || {
    orgId: "org_abc123XYZ",
    transactionId: "txn_789def456GHI",
    planName: "Growth Plan",
    price: "NPR 990/month",
    nextBilling: "April 29, 2026"
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col items-center justify-center p-4">
      
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 bg-[#a7f3d0] rounded-full flex items-center justify-center shadow-lg shadow-green-100">
          <div className="w-14 h-14 bg-[#10b981] rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#1e40af] mb-2">Subscription confirmed!</h1>
        <p className="text-slate-500 font-medium">Your organization is now active on FinSync</p>
      </div>

      {/* Details Card */}
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl shadow-blue-100/50 p-10">
        <div className="space-y-6">
          
          {/* Organization ID */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Organization ID:</span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-mono tracking-wider">
              {data.orgId}
            </span>
          </div>

          {/* Transaction ID */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Transaction ID:</span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm font-mono tracking-wider">
              {data.transactionId}
            </span>
          </div>

          {/* Plan */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Plan:</span>
            <div className="flex items-center gap-2">
              <span className="bg-[#eff6ff] text-[#2563eb] px-4 py-1.5 rounded-full text-sm font-bold">
                {data.planName} <span className="font-normal text-blue-400">({data.price})</span>
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#16a34a] px-3 py-1 rounded-full text-sm font-bold border border-green-100">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Active
            </span>
          </div>

          {/* Next Billing */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
            <span className="text-slate-500 font-medium">Next billing:</span>
            <span className="text-slate-900 font-semibold">{data.nextBilling}</span>
          </div>

          {/* Checklist Section */}
          <div className="bg-[#f8fafc] rounded-2xl p-6 mt-4">
            <h3 className="text-slate-900 font-bold mb-4">What you can do now:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#10b981] text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Set up your financial dashboards
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#10b981] text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Import CSV/Excel transaction data
              </li>
              <li className="flex items-center gap-3 text-slate-600 text-sm">
                <span className="w-5 h-5 bg-[#10b981] text-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Invite team members
              </li>
            </ul>
          </div>

          {/* Gradient Button */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 bg-gradient-to-r from-[#3b82f6] to-[#10b981] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-8 text-slate-500 text-sm">
        Need help getting started? <button className="text-slate-700 font-semibold hover:underline">Contact support</button>
      </p>

    </div>
  );
};

export default SubscriptionSuccess;