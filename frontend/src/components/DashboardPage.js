import React, { useState, useEffect } from "react";

const DashboardPage = () => {
  const [metrics, setMetrics] = useState({
    revenue: 124560,
    expenses: 85600,
    cashFlow: 38960,
    profit: 38960
  });
  const [chartData, setChartData] = useState({
    revenueTrend: [12000, 28000, 35000, 42000, 52000, 62000],
    expenseTrend: [8000, 15000, 22000, 30000, 38000, 45000]
  });
  const [loading, setLoading] = useState(true);
  const [orgId] = useState('default-org-id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const id = localStorage.getItem('currentOrgId') || orgId;
        
        const [metricsRes, chartsRes] = await Promise.all([
          fetch(`/api/organizations/${id}/metrics`),
          fetch(`/api/organizations/${id}/charts`)
        ]);
        
        const metricsData = await metricsRes.json();
        const chartsData = await chartsRes.json();
        
        setMetrics(metricsData);
        setChartData(chartsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500">Your financial overview at a glance</p>
          </div>
          <div className="flex justify-end">
            <button className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200">
              New Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="text-sm text-slate-500">Revenue YTD</div>
            <div className="text-xs text-green-600 font-medium mt-1">+18.2%</div>
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
            <div className="text-xs text-orange-600 font-medium mt-1">+7.1%</div>
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
            <div className="text-xs text-emerald-600 font-medium mt-1">+24.6%</div>
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
            <div className="text-sm text-slate-500">Cash Flow</div>
            <div className="text-xs text-blue-600 font-medium mt-1">Healthy</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Revenue Trend</h2>
              <select className="text-sm text-slate-500 border border-slate-200 rounded-xl px-3 py-1.5">
                <option>Last 6 months</option>
              </select>
            </div>
            <div className="h-80 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-6">
              <svg className="w-full h-full" viewBox="0 0 500 300">
                <defs>
                  <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981"/>
                    <stop offset="100%" stopColor="#34d399"/>
                  </linearGradient>
                </defs>
                <path d="M20 260 L20 200 L80 180 L140 140 L200 100 L260 80 L320 120 L380 90 L440 70 L460 60 L460 260 L20 260 Z" 
                      fill="url(#revenueGrad)" opacity="0.6" stroke="#10b981" strokeWidth="2"/>
                <path d="M20 260 L20 200 L80 180 L140 140 L200 100 L260 80 L320 120 L380 90 L440 70 L460 60 L460 260" 
                      fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                {[0,1,2,3,4,5].map(i => (
                  <g key={i}>
                    <circle cx={80 + i*80} cy={260 - chartData.revenueTrend[i]/1000*40} r="6" fill="#10b981"/>
                    <text x={80 + i*80} y={290} textAnchor="middle" fontSize="12" fill="slate-600">
                      M{i+1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Expenses Chart */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
              <select className="text-sm text-slate-500 border border-slate-200 rounded-xl px-3 py-1.5">
                <option>Categories</option>
              </select>
            </div>
            <div className="h-80 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-6 flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">$45.2K</div>
                  <div className="text-xs text-slate-500">Marketing</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">$28.9K</div>
                  <div className="text-xs text-slate-500">Operations</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Budget</span>
                  <span className="font-semibold">$95K</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  Actual
                  <span className="text-lg">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Insights */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Best Insights</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-2xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">Revenue growth accelerating</div>
                  <div className="text-sm text-slate-500">Customer acquisition up 28% MoM</div>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">Cost efficiency improving</div>
                  <div className="text-sm text-slate-500">COGS down to 42% of revenue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-xl rounded-3xl p-8 border border-teal-200/30 shadow-2xl">
            <h2 className="text-2xl font-bold text-teal-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="group bg-white/80 hover:bg-white rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Import Data</div>
                <div className="text-xs text-slate-500">CSV/Excel</div>
              </button>
              <button className="group bg-white/80 hover:bg-white rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Generate Report</div>
                <div className="text-xs text-slate-500">PDF Export</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
