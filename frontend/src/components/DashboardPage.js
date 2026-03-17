import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // list of past imports (summary only)
  const [imports, setImports] = useState([]);
  // the currently-selected import id
  const [selectedImportId, setSelectedImportId] = useState(null);
  // detailed data for the selected import
  const [importDetail, setImportDetail] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  // avoid rendering chart libraries that use hooks until after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Fetch the list of past imports ────────────────────────────────────
  useEffect(() => {
    const fetchImports = async () => {
      try {
        setLoadingList(true);
        const orgId = currentUser?.orgId || "null";
        const res = await fetch(`${API_BASE}/past-imports/${orgId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch imports");
        const data = await res.json();
        setImports(data);
        // auto-select latest
        if (data.length > 0) {
          setSelectedImportId(data[0]._id || data[0].id);
        }
      } catch (err) {
        console.error("Error loading imports:", err);
        setError("Could not load imported files.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch detailed data when selected import changes ──────────────────
  useEffect(() => {
    if (!selectedImportId) return;
    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const res = await fetch(`${API_BASE}/imports/${selectedImportId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch import detail");
        const data = await res.json();
        setImportDetail(data);
      } catch (err) {
        console.error("Error loading import detail", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImportId]);

  // ── Derived metrics ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!importDetail?.totals)
      return { revenue: 0, expenses: 0, profit: 0, cashFlow: 0 };
    const t = importDetail.totals;
    const revenue = t.Revenue || 0;
    const cogs = t.COGS || 0;
    const marketing = t.Marketing || 0;
    const admin = t.Admin || 0;
    const tax = t.Tax || 0;
    const expenses = cogs + marketing + admin + tax;
    const profit = revenue - expenses;
    const cashFlow = t.Cash || 0;
    return { revenue, expenses, profit, cashFlow };
  }, [importDetail]);

  // ── Chart data – revenue / expense trend by row (Date) ────────────────
  const trendData = useMemo(() => {
    if (!importDetail?.previewRows || importDetail.previewRows.length === 0)
      return [];
    return importDetail.previewRows.map((row) => {
      const rev =
        parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, "")) || 0;
      const cogs = parseFloat(String(row.COGS || 0).replace(/[,\s]/g, "")) || 0;
      const mkt =
        parseFloat(String(row.Marketing || 0).replace(/[,\s]/g, "")) || 0;
      const adm = parseFloat(String(row.Admin || 0).replace(/[,\s]/g, "")) || 0;
      const tax = parseFloat(String(row.Tax || 0).replace(/[,\s]/g, "")) || 0;
      const label = row.Date
        ? new Date(row.Date).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          })
        : `Row`;
      return {
        name: label,
        Revenue: rev,
        Expenses: cogs + mkt + adm + tax,
      };
    });
  }, [importDetail]);

  // ── Expense breakdown for pie chart ────────────────────────────────────
  const expenseBreakdown = useMemo(() => {
    if (!importDetail?.totals) return [];
    const t = importDetail.totals;
    const items = [
      { name: "COGS", value: t.COGS || 0 },
      { name: "Marketing", value: t.Marketing || 0 },
      { name: "Admin", value: t.Admin || 0 },
      { name: "Tax", value: t.Tax || 0 },
    ].filter((i) => i.value > 0);
    return items;
  }, [importDetail]);

  // ── Category revenue breakdown bar chart ──────────────────────────────
  const categoryData = useMemo(() => {
    if (!importDetail?.previewRows || importDetail.previewRows.length === 0)
      return [];
    const map = {};
    importDetail.previewRows.forEach((row) => {
      const cat = row.Category || row.Region || "Other";
      const rev =
        parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, "")) || 0;
      map[cat] = (map[cat] || 0) + rev;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      Revenue: value,
    }));
  }, [importDetail]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const profitMargin =
    metrics.revenue > 0
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
      : "0.0";

  if (loadingList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // ── Empty state — no imports yet ──────────────────────────────────────
  if (imports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            No Data Yet
          </h1>
          <p className="text-slate-500 mb-6">
            Import a CSV file to see your financial dashboard.
          </p>
          <button
            onClick={() => navigate("/import")}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Go to Import Page
          </button>
        </div>
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
            <p className="text-slate-500">
              Your financial overview at a glance
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            {/* CSV selector */}
            <select
              value={selectedImportId || ""}
              onChange={(e) => setSelectedImportId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-w-[220px] truncate"
            >
              {imports.map((imp) => (
                <option key={imp._id || imp.id} value={imp._id || imp.id}>
                  {imp.fileName}
                </option>
              ))}
            </select>

            <button
              onClick={() => navigate("/import")}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              New Report
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loadingDetail || !importDetail || !mounted ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue */}
              <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-2xl">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full group-hover:animate-ping"></div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {formatCurrency(metrics.revenue)}
                </div>
                <div className="text-sm text-slate-500">Total Revenue</div>
              </div>

              {/* Expenses */}
              <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-2xl">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full group-hover:animate-ping"></div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {formatCurrency(metrics.expenses)}
                </div>
                <div className="text-sm text-slate-500">Total Expenses</div>
              </div>

              {/* Net Profit */}
              <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 rounded-2xl">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:animate-ping"></div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {formatCurrency(metrics.profit)}
                </div>
                <div className="text-sm text-slate-500">Net Profit</div>
                <div
                  className={`text-xs font-medium mt-1 ${metrics.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {profitMargin}% margin
                </div>
              </div>

              {/* Cash Flow */}
              <div className="group bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-2xl">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12"
                      />
                    </svg>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:animate-ping"></div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {formatCurrency(metrics.cashFlow)}
                </div>
                <div className="text-sm text-slate-500">Cash Position</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  {metrics.cashFlow > 0 ? "Healthy" : "Low"}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Trend */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Revenue vs Expenses
                  </h2>
                  <span className="text-xs text-slate-400">
                    {importDetail?.fileName}
                  </span>
                </div>
                <div className="h-80">
                  {trendData.length > 0 && mounted ? (
                    <Line
                      data={{
                        labels: trendData.map((d) => d.name),
                        datasets: [
                          {
                            label: "Revenue",
                            data: trendData.map((d) => d.Revenue),
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.4)",
                            fill: true,
                            tension: 0.4,
                          },
                          {
                            label: "Expenses",
                            data: trendData.map((d) => d.Expenses),
                            borderColor: "#f97316",
                            backgroundColor: "rgba(249, 115, 22, 0.4)",
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "top" } },
                        scales: {
                          y: {
                            ticks: {
                              callback: (value) =>
                                `$${(value / 1000).toFixed(0)}K`,
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      {loadingDetail
                        ? "Loading Chart..."
                        : "No trend data available"}
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Breakdown Pie */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Expense Breakdown
                  </h2>
                </div>
                <div className="h-80">
                  {expenseBreakdown.length > 0 && mounted ? (
                    <Pie
                      data={{
                        labels: expenseBreakdown.map((item) => item.name),
                        datasets: [
                          {
                            data: expenseBreakdown.map((item) => item.value),
                            backgroundColor: PIE_COLORS,
                            borderWidth: 2,
                            borderColor: "#ffffff",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: { padding: 20, font: { size: 12 } },
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `$${context.parsed.toLocaleString()}`,
                            },
                          },
                        },
                        cutout: "50%", // Makes it a donut (remove for full pie)
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      {loadingDetail
                        ? "Loading Chart..."
                        : "No expense data available"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Revenue by Category */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Revenue by Category
              </h2>
              <div className="h-72">
                {categoryData.length > 0 && mounted ? (
                  <Bar
                    data={{
                      labels: categoryData.map((item) => item.name),
                      datasets: [
                        {
                          label: "Revenue",
                          data: categoryData.map((item) => item.Revenue),
                          backgroundColor: PIE_COLORS,
                          borderRadius: 8,
                          borderSkipped: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `$${context.parsed.y.toLocaleString()}`,
                          },
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            callback: (value) =>
                              `$${(value / 1000).toFixed(0)}K`,
                          },
                          grid: { color: "#e2e8f0" },
                        },
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 12 } },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    {loadingDetail
                      ? "Loading Chart..."
                      : "No category data available"}
                  </div>
                )}
              </div>

              {/* Data Preview */}
              {importDetail?.previewRows &&
                importDetail.previewRows.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Data Preview
                      </h2>
                      <span className="text-xs text-slate-400">
                        Showing {Math.min(importDetail.previewRows.length, 10)}{" "}
                        of {importDetail.records} records
                      </span>
                    </div>
                    <div className="overflow-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-50">
                            {importDetail.columns.map((col) => (
                              <th
                                key={col}
                                className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importDetail.previewRows
                            .slice(0, 10)
                            .map((row, i) => (
                              <tr
                                key={i}
                                className={
                                  i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                }
                              >
                                {importDetail.columns.map((col) => (
                                  <td
                                    key={col}
                                    className="px-4 py-2.5 text-slate-700 whitespace-nowrap"
                                  >
                                    {String(row[col] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
