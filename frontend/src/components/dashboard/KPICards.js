import React from 'react';

const KpiCards = ({ metrics, formatCurrency, profitMargin }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-2xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full group-hover:animate-ping"></div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(metrics.revenue)}</div>
        <div className="text-sm text-slate-500">Total Revenue</div>
      </div>

      <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-2xl">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="w-3 h-3 bg-orange-500 rounded-full group-hover:animate-ping"></div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(metrics.expenses)}</div>
        <div className="text-sm text-slate-500">Total Expenses</div>
      </div>

      <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 rounded-2xl">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:animate-ping"></div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(metrics.profit)}</div>
        <div className="text-sm text-slate-500">Net Profit</div>
        <div className={`text-xs font-medium mt-1 ${metrics.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{profitMargin}% margin</div>
      </div>

      <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-2xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12" />
            </svg>
          </div>
          <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:animate-ping"></div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{formatCurrency(metrics.cashFlow)}</div>
        <div className="text-sm text-slate-500">Cash Position</div>
        <div className="text-xs text-blue-600 font-medium mt-1">{metrics.cashFlow > 0 ? "Healthy" : "Low"}</div>
      </div>
    </div>
  );
};

export default KpiCards;
