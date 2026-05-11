import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const StatusBadge = ({ status }) => {
  const colors = {
    Active: 'bg-emerald-100 text-emerald-700',
    Disabled: 'bg-rose-100 text-rose-700',
    Pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function SubscriptionLogs() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const [logs, setLogs] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/subscription/logs`);
      if (!response.ok) throw new Error('Failed to fetch subscription logs');
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : data.logs || []);
      setTotalPayments(data?.totalPayments || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#eafcf8] p-6 md:p-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscription Logs</h1>
            <p className="mt-1 text-slate-500">Track all subscription payment activity across tenants</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export logs
            </button>

            <button
              onClick={fetchSubscriptions}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Refresh logs
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_24px_180px_120px]">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />

          <div className="flex items-center justify-center text-slate-300">—</div>

          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />

          <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 transition hover:bg-slate-50">
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading logs...</div>
        ) : error ? (
          <div className="py-20 text-center text-rose-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">Timestamp</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Organization</th>
                  <th className="px-4 py-4">Subscription Plan</th>
                  <th className="px-4 py-4">Result</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id || log.id} className="text-sm text-slate-700 transition hover:bg-slate-50/80">
                    <td className="px-4 py-4 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{log.user}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{log.role}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{log.organization || log.org || "N/A"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{log.plan}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={log.result || log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
          <span>Showing {logs.length} logs</span>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <span className="font-semibold text-emerald-700">Total payments processed: NPR {Number(totalPayments || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
