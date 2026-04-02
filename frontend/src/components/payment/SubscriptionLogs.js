import React, { useState, useEffect } from "react";

const SubscriptionLogs = () => {
  // 1. Setup State
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Sample data (In a real app, this would come from an API)
  const logs = [
    { timestamp: "2026-03-27 10:32", user: "john@gmail.com", role: "Admin", org: "Alpha Corp", plan: "Growth Plan", result: "Completed", amount: 990 },
    { timestamp: "2026-03-27 10:28", user: "jane@acme.com", role: "Admin", org: "Acme Inc", plan: "Starter Plan", result: "Failed", amount: 0 },
    { timestamp: "2026-03-27 10:15", user: "bob@tech.com", role: "Admin", org: "Beta Ltd", plan: "Growth Plan", result: "Failed", amount: 0 },
    { timestamp: "2026-03-27 09:45", user: "alice@startup.io", role: "Admin", org: "Startup IO", plan: "Enterprise Plan", result: "Completed", amount: 1470 },
    { timestamp: "2026-03-27 09:32", user: "dev@demo.com", role: "Admin", org: "Demo Inc", plan: "Basic Plan", result: "Pending", amount: 0 },
    { timestamp: "2026-03-27 09:15", user: "billing@test.com", role: "Admin", org: "Test Corp", plan: "Growth Plan", result: "Failed", amount: 0 },
  ];

  // 2. Logic: Filter the logs based on the search input
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.org.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 3. Logic: Calculate total successful payments
  const totalAmount = filteredLogs.reduce((sum, log) => sum + log.amount, 0);

  // Helper function for status colors
  const getStatusStyle = (status) => {
    if (status === "Completed") return "bg-emerald-100 text-emerald-700";
    if (status === "Failed") return "bg-red-100 text-red-700";
    return "bg-orange-100 text-orange-700"; // Pending
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans text-slate-700">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subscription Logs</h1>
            <p className="text-slate-500 text-sm">Monitor and manage all payment transactions</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
              <span>⬇</span> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#00bfa5] text-white rounded-lg text-sm font-semibold hover:bg-[#00a892] transition-all">
              <span>↻</span> Refresh logs
            </button>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search by email or organization..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Date Inputs */}
            <div className="flex items-center gap-2">
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              <span className="text-slate-400">to</span>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            {/* Filter Dropdown */}
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option>All Statuses</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Organization</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{log.user}</div>
                      <div className="text-xs text-slate-400">{log.role}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.org}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.plan}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${getStatusStyle(log.result)}`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER --- */}
          <div className="p-5 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredLogs.length}</span> logs
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white">←</button>
                <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white">→</button>
              </div>
              <div className="text-sm font-bold text-[#00bfa5]">
                TOTAL REVENUE: NPR {totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLogs;