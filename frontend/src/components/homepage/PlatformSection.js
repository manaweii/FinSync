import React from 'react';
import { 
  WalletIcon, 
  CreditCardIcon, 
  ArrowTrendingUpIcon, 
  UserGroupIcon,
  ArrowUpIcon 
} from '@heroicons/react/24/outline';

const PlatformSection = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: 'Rs. 847,392',
      change: '12.5%',
      isPositive: true,
      icon: <WalletIcon className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: 'Expenses',
      value: 'Rs. 423,156',
      change: '3.2%',
      isPositive: false, // In your screenshot the text is red
      icon: <CreditCardIcon className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Net Profit',
      value: 'Rs. 424,236',
      change: '18.7%',
      isPositive: true,
      icon: <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: 'Active Clients',
      value: '1,249',
      change: '8.3%',
      isPositive: true,
      icon: <UserGroupIcon className="w-5 h-5 text-blue-600" />,
    },
  ];

  return (
    <div id="platformSection" className="min-h-screen bg-white font-sans text-[#1a1c1e] p-8 md:p-16 flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center mb-16 max-w-2xl">
        {/* small label */}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
          Platform
        </span>
        <h1 className="text-4xl font-semibold mb-4 tracking-tight">Real-Time Insights at Your Fingertips</h1>
        <p className="text-gray-500 text-xl leading-relaxed">
          Monitor your financial health with customizable dashboards and anomaly detection.
        </p>
      </div>

      {/* Browser Mockup */}
      <div className="w-full max-w-6xl rounded-xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
        {/* Browser Top Bar */}
        <div className="bg-[#f9fafb] border-b border-gray-100 p-4 flex items-center space-x-2">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="bg-gray-100 rounded-md px-4 py-1 text-xs text-gray-400 w-full max-w-3xl">
            app.finsync.io/dashboard
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 bg-white">
          <header className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Financial Overview</h2>
            <p className="text-sm text-gray-400 mt-1">Recently updated</p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                  {stat.icon}
                </div>
                <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                <div className={`text-xs font-medium ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="border border-gray-100 rounded-xl p-8 bg-white shadow-sm min-h-[400px] flex flex-col">
            <h3 className="text-lg font-medium text-gray-800 mb-auto">Revenue vs Expenses</h3>
            
            {/* X-Axis labels */}
            <div className="mt-auto">
              <div className="flex justify-between text-xs text-gray-400 px-10 mb-6">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
              <div className="border-t border-gray-100 pt-6 flex justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-500">Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSection;