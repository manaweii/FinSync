import React from "react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Quick Actions</h2>
      <p className="text-[11px] text-slate-400 mb-4">Common tasks and shortcuts</p>

      <div className="space-y-3">
        {/* Action Item 1 */}
        <button
          onClick={() => navigate("/records")}
          className="w-full flex items-center p-2.5 bg-teal-50 rounded-xl hover:bg-teal-100 transition-all group"
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <svg
              className="w-4 h-4 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight text-slate-900">Add Transaction</p>
            <p className="text-[10px] leading-tight text-slate-500">
              Record new income or expense
            </p>
          </div>
        </button>

        {/* Action Item 2 */}
        <button
          onClick={() => navigate("/reports")}
          className="w-full flex items-center p-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight text-slate-900">Generate Report</p>
            <p className="text-[10px] leading-tight text-slate-500">
              Create monthly financial sheets
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
