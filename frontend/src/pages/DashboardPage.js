import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useDashboardSettings from "../store/useDashboardSettings";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, } from "chart.js";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

// Import extracted components
import SortableWidget from "../components/dashboard/SortableWidget";
import KpiCards from "../components/dashboard/KPICards";
import TrendWidget from "../components/dashboard/TrendWidget";
import ExpensePie from "../components/dashboard/ExpensePie";
import CategoryBar from "../components/dashboard/CategoryBar";
import DataPreview from "../components/dashboard/DataPreview";
import AlertsSection from "../components/dashboard/AlertsSection";
import QuickActions from "../components/dashboard/QuickActions";
import SupportCard from "../components/dashboard/SupportCard";
import { downloadChart } from "../utils/chartUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const DASHBOARD_WIDGET_KEYS = [
  "kpis",
  "trend",
  "expensePie",
  "categoryBar",
  "dataPreview",
  "alertsSection",
  "quickActions",
  "supportCard",
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // list of past imports (summary only)
  const [imports, setImports] = useState([]);
  // the currently-selected import id
  const [selectedImportId, setSelectedImportId] = useState(null);
  // selected month (YYYY-MM) or 'all'
  const [selectedMonth, setSelectedMonth] = useState('all');
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

  // available months derived from import preview rows (YYYY-MM)
  const availableMonths = useMemo(() => {
    if (!importDetail?.previewRows) return [];
    const set = new Set();
    importDetail.previewRows.forEach((row) => {
      if (!row.Date) return;
      const d = new Date(row.Date);
      if (isNaN(d)) return;
      set.add(d.toISOString().slice(0, 7));
    });
    // sort descending (latest first)
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [importDetail]);

  const formatMonthKey = (key) => {
    if (!key || key === 'all') return 'All Periods';
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  // filtered preview rows according to selectedMonth
  const filteredPreviewRows = useMemo(() => {
    if (!importDetail?.previewRows) return [];
    if (selectedMonth === 'all') return importDetail.previewRows;
    return importDetail.previewRows.filter((row) => {
      if (!row.Date) return false;
      const d = new Date(row.Date);
      if (isNaN(d)) return false;
      return d.toISOString().slice(0, 7) === selectedMonth;
    });
  }, [importDetail, selectedMonth]);

  // totals recomputed from filtered rows
  const totalsFromFiltered = useMemo(() => {
    const totals = {};
    (filteredPreviewRows || []).forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k === 'Date' || k === 'Category' || k === 'Region') return;
        const v = parseFloat(String(row[k] || 0).replace(/[,\s]/g, '')) || 0;
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return totals;
  }, [filteredPreviewRows]);

  // ── Derived metrics (from filtered rows) ─────────────────────────────────
  const metrics = useMemo(() => {
    const t = totalsFromFiltered || {};
    const revenue = t.Revenue || 0;
    const cogs = t.COGS || 0;
    const marketing = t.Marketing || 0;
    const admin = t.Admin || 0;
    const tax = t.Tax || 0;
    const expenses = cogs + marketing + admin + tax;
    const profit = revenue - expenses;
    const cashFlow = t.Cash || 0;
    return { revenue, expenses, profit, cashFlow };
  }, [totalsFromFiltered]);

  // ── Chart data – revenue / expense trend by row (Date) from filtered rows ─
  const trendData = useMemo(() => {
    if (!filteredPreviewRows || filteredPreviewRows.length === 0) return [];
    return filteredPreviewRows.map((row) => {
      const rev = parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, '')) || 0;
      const cogs = parseFloat(String(row.COGS || 0).replace(/[,\s]/g, '')) || 0;
      const mkt = parseFloat(String(row.Marketing || 0).replace(/[,\s]/g, '')) || 0;
      const adm = parseFloat(String(row.Admin || 0).replace(/[,\s]/g, '')) || 0;
      const tax = parseFloat(String(row.Tax || 0).replace(/[,\s]/g, '')) || 0;
      const label = row.Date
        ? new Date(row.Date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : `Row`;
      return { name: label, Revenue: rev, Expenses: cogs + mkt + adm + tax };
    });
  }, [filteredPreviewRows]);

  // ── Expense breakdown for pie chart ────────────────────────────────────
  const expenseBreakdown = useMemo(() => {
    const t = totalsFromFiltered || {};
    const items = [
      { name: 'COGS', value: t.COGS || 0 },
      { name: 'Marketing', value: t.Marketing || 0 },
      { name: 'Admin', value: t.Admin || 0 },
      { name: 'Tax', value: t.Tax || 0 },
    ].filter((i) => i.value > 0);
    return items;
  }, [totalsFromFiltered]);

  // ── Category revenue breakdown bar chart ──────────────────────────────
  const categoryData = useMemo(() => {
    if (!filteredPreviewRows || filteredPreviewRows.length === 0) return [];
    const map = {};
    filteredPreviewRows.forEach((row) => {
      const cat = row.Category || row.Region || 'Other';
      const rev = parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, '')) || 0;
      map[cat] = (map[cat] || 0) + rev;
    });
    return Object.entries(map).map(([name, value]) => ({ name, Revenue: value }));
  }, [filteredPreviewRows]);

  // // ── Helpers ───────────────────────────────────────────────────────────
  const formatCurrency = (value) =>
    `Rs. ${new Intl.NumberFormat("en-NP", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)}`;

  const profitMargin =
    metrics.revenue > 0
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
      : "0.0";

  // dashboard visibility settings
  const {
    showKPIs,
    showTrend,
    showExpensePie,
    showCategoryBar,
    showDataPreview,
  } = useDashboardSettings();

  // dashboard store (layout + helpers)
  const { layout, moveWidget, setLayout, saveToServer, loadFromServer } = useDashboardSettings();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // load server settings on mount (if any)
  useEffect(() => {
    (async () => {
      try {
        await loadFromServer(API_BASE, token, currentUser);
      } catch (e) {
        // ignore load errors
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: save settings to server
  const handleSaveSettings = async () => {
    try {
      await saveToServer(API_BASE, token, currentUser);
      alert("Dashboard settings saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  };

  // local chart type for trend widget
  const [trendChartType, setTrendChartType] = useState("line");

  const visibleLayout = useMemo(() => {
    const currentLayout = Array.isArray(layout) ? layout : [];
    const seen = new Set();
    const ordered = currentLayout.filter((key) => {
      if (!DASHBOARD_WIDGET_KEYS.includes(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const missingKeys = DASHBOARD_WIDGET_KEYS.filter((key) => !seen.has(key));
    return [...ordered, ...missingKeys];
  }, [layout]);

  useEffect(() => {
    if (JSON.stringify(layout) !== JSON.stringify(visibleLayout)) {
      setLayout(visibleLayout);
    }
  }, [layout, setLayout, visibleLayout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">Dashboard</h1>
            <p className="text-slate-500">Your financial overview at a glance</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            {/* CSV selector */}
            <select value={selectedImportId || ""} onChange={(e) => setSelectedImportId(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-w-[220px] truncate">
              {imports.map((imp) => (
                <option key={imp._id || imp.id} value={imp._id || imp.id}>{imp.fileName}</option>
              ))}
            </select>

            {/* Month selector */}
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-w-[180px] truncate">
              <option value="all">All Periods</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>{formatMonthKey(month)}</option>
              ))}
            </select>

            <button onClick={() => navigate("/import")} className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200">New Report</button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loadingDetail || !importDetail || !mounted ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {/* Draggable widget area */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const from = visibleLayout.indexOf(active.id);
              const to = visibleLayout.indexOf(over.id);
              if (from === -1 || to === -1) return;
              // update store
              moveWidget(from, to);
            }}>
              <SortableContext items={visibleLayout} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                  {visibleLayout.map((key) => {
                    if (key === "kpis") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showKPIs && <KpiCards metrics={metrics} formatCurrency={formatCurrency} profitMargin={profitMargin} />}
                        </SortableWidget>
                      );
                    }
                    if (key === "trend") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showTrend && <TrendWidget trendData={trendData} mounted={mounted} loadingDetail={loadingDetail} selectedImportId={selectedImportId} />}
                        </SortableWidget>
                      );
                    }
                    if (key === "expensePie") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showExpensePie && <ExpensePie expenseBreakdown={expenseBreakdown} mounted={mounted} loadingDetail={loadingDetail} />}
                        </SortableWidget>
                      );
                    }
                    if (key === "categoryBar") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showCategoryBar && <CategoryBar categoryData={categoryData} mounted={mounted} loadingDetail={loadingDetail} />}
                        </SortableWidget>
                      );
                    }
                    if (key === "dataPreview") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showDataPreview && <DataPreview importDetail={importDetail} loadingDetail={loadingDetail} />}
                        </SortableWidget>
                      );
                    }
                    if (key === "quickActions") {
                      return (
                        <SortableWidget key={key} id={key}>
                          <QuickActions />
                        </SortableWidget>
                      );
                    }
                    if (key === "supportCard") {
                      return (
                        <SortableWidget key={key} id={key}>
                          <SupportCard />
                        </SortableWidget>
                      );
                    }
                    if (key === "alertsSection") {
                      return (
                        <SortableWidget key={key} id={key}>
                          <AlertsSection />
                        </SortableWidget>
                      );
                    }
                    return null;
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* Controls for layout */}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { useDashboardSettings.getState().reset(); }} className="px-3 py-2 rounded border text-sm">Reset Layout</button>
              <button onClick={handleSaveSettings} className="px-3 py-2 rounded bg-teal-600 text-white text-sm">Save Layout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
