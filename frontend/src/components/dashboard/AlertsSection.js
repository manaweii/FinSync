import React from 'react';

// 1. REUSABLE ICON COMPONENT (No libraries needed)
const StatusIcon = ({ type }) => {
  if (type === "milestone") {
    return (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  }
  if (type === "danger") {
    return (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  // Default Warning Icon
  return (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
};

export default function AlertsSection() {
  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Alerts & Anomalies</h2>
          <p className="text-xs text-slate-400">Important notifications</p>
        </div>
        <button className="text-teal-600 text-sm font-semibold hover:underline">View all</button>
      </div>

      {/* Alerts Container */}
      <div className="space-y-4">
        
        {/* 1. Revenue Milestone (From your latest attachment) */}
        <div className="flex gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 group cursor-pointer hover:bg-blue-100/50 transition-all">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <StatusIcon type="milestone" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-bold text-blue-900">Revenue milestone reached</h4>
            </div>
            <p className="text-xs text-blue-700 mt-1">Monthly revenue exceeded <span className="font-bold">$850k</span> target</p>
            <span className="text-[10px] text-blue-400 mt-2 block">1 day ago</span>
          </div>
        </div>

        {/* 3. Payment Due Alert */}
        <div className="flex gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 group cursor-pointer hover:bg-orange-100/50 transition-all">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <StatusIcon type="warning" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-orange-900">Payment due soon</h4>
            <p className="text-xs text-orange-700 mt-1">AWS invoice ($2,340) due in 3 days</p>
            <span className="text-[10px] text-orange-400 mt-2 block">5 hours ago</span>
          </div>
        </div>
        {/* 2. Unusual Spending Alert */}
        <div className="flex gap-4 p-4 rounded-2xl bg-red-50 border border-red-100 group cursor-pointer hover:bg-red-100/50 transition-all">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <StatusIcon type="danger" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-900">Unusual spending detected</h4>
            <p className="text-xs text-red-700 mt-1">Marketing expenses 45% higher than average</p>
            <span className="text-[10px] text-red-400 mt-2 block">2 hours ago</span>
          </div>
        </div>


      </div>
    </div>
  );
}