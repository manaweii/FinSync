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

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // state: imports list and selected import detail
  const [imports, setImports] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [importDetail, setImportDetail] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  // avoid rendering chart libs until client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // fetch available imports for the user's org and auto-select latest
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
        if (data.length > 0) setSelectedImportId(data[0]._id || data[0].id);
      } catch (err) {
        console.error(err);
        setError("Could not load imported files.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch selected import detail
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
        console.error(err);
        setError("Could not load import detail.");
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedImportId]);

  // Derived chart data
  const trendData = useMemo(() => {
    if (!importDetail?.previewRows || importDetail.previewRows.length === 0) return [];
    return importDetail.previewRows.map((row) => {
      const rev = parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, "")) || 0;
      const cogs = parseFloat(String(row.COGS || 0).replace(/[,\s]/g, "")) || 0;
      const mkt = parseFloat(String(row.Marketing || 0).replace(/[,\s]/g, "")) || 0;
      const adm = parseFloat(String(row.Admin || 0).replace(/[,\s]/g, "")) || 0;
      const tax = parseFloat(String(row.Tax || 0).replace(/[,\s]/g, "")) || 0;
      const label = row.Date
        ? new Date(row.Date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        : `Row`;
      return { name: label, Revenue: rev, Expenses: cogs + mkt + adm + tax };
    });
  }, [importDetail]);

  const expenseBreakdown = useMemo(() => {
    if (!importDetail?.totals) return [];
    const t = importDetail.totals;
    return [
      { name: "COGS", value: t.COGS || 0 },
      { name: "Marketing", value: t.Marketing || 0 },
      { name: "Admin", value: t.Admin || 0 },
      { name: "Tax", value: t.Tax || 0 },
    ].filter((i) => i.value > 0);
  }, [importDetail]);

  const categoryData = useMemo(() => {
    if (!importDetail?.previewRows || importDetail.previewRows.length === 0) return [];
    const map = {};
    importDetail.previewRows.forEach((row) => {
      const cat = row.Category || row.Region || "Other";
      const rev = parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, "")) || 0;
      map[cat] = (map[cat] || 0) + rev;
    });
    return Object.entries(map).map(([name, value]) => ({ name, Revenue: value }));
  }, [importDetail]);

  if (loadingList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Visualizations</h1>
          {/* keep simple selector to switch imports if needed */}
          <select
            value={selectedImportId || ""}
            onChange={(e) => setSelectedImportId(e.target.value)}
            className="px-3 py-2 bg-white border rounded-lg text-sm"
          >
            {imports.map((imp) => (
              <option key={imp._id || imp.id} value={imp._id || imp.id}>
                {imp.fileName}
              </option>
            ))}
          </select>
        </div>

        {loadingDetail || !mounted ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow">
                <h2 className="text-lg font-semibold mb-4">Revenue vs Expenses</h2>
                {trendData.length > 0 ? (
                  <Line
                    data={{
                      labels: trendData.map((d) => d.name),
                      datasets: [
                        {
                          label: "Revenue",
                          data: trendData.map((d) => d.Revenue),
                          borderColor: "#10b981",
                          backgroundColor: "rgba(16,185,129,0.3)",
                          fill: true,
                          tension: 0.4,
                        },
                        {
                          label: "Expenses",
                          data: trendData.map((d) => d.Expenses),
                          borderColor: "#f97316",
                          backgroundColor: "rgba(249,115,22,0.3)",
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: "top" } },
                      scales: { y: { ticks: { callback: (v) => `$${(v/1000).toFixed(0)}K` } } },
                    }}
                  />
                ) : (
                  <div className="text-sm text-slate-400">No trend data available</div>
                )}
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow">
                <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
                {expenseBreakdown.length > 0 ? (
                  <div className="h-64">
                    <Pie
                      data={{
                        labels: expenseBreakdown.map((i) => i.name),
                        datasets: [{ data: expenseBreakdown.map((i) => i.value), backgroundColor: PIE_COLORS }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No expense breakdown available</div>
                )}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow">
              <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
              {categoryData.length > 0 ? (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: categoryData.map((c) => c.name),
                      datasets: [{ label: 'Revenue', data: categoryData.map((c) => c.Revenue), backgroundColor: PIE_COLORS }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                  />
                </div>
              ) : (
                <div className="text-sm text-slate-400">No category data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
