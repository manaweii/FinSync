import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useDashboardSettings from "../store/useDashboardSettings";
import Footer from "../components/homepage/Footer";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableWidget from "../components/dashboard/SortableWidget";
import KpiCards from "../components/dashboard/KPICards";
import TrendWidget from "../components/dashboard/TrendWidget";
import ExpensePie from "../components/dashboard/ExpensePie";
import CategoryBar from "../components/dashboard/CategoryBar";
import DataPreview from "../components/dashboard/DataPreview";
import AlertsSection from "../components/dashboard/AlertsSection";
import QuickActions from "../components/dashboard/QuickActions";
import SupportCard from "../components/dashboard/SupportCard";
import DynamicChart from "../components/dashboard/Chart";
import {
  buildCategoryRevenueData,
  buildDashboardMetrics,
  buildExpenseBreakdown,
  buildTrendData,
  findDateBounds,
  formatCurrencyCompact,
} from "../utils/financialData";
import { buildRecordDataset } from "../utils/recordsData";

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

const DASHBOARD_WIDGET_KEYS = [
  "kpis",
  "trend",
  "dynamicChart",
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

  const [dbRecords, setDbRecords] = useState([]);
  const [orgSubscription, setOrgSubscription] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchImports = async () => {
      try {
        setLoadingList(true);
        const orgName = currentUser?.orgName || "";
        if (!orgName) {
          setDbRecords([]);
          return;
        }

        const recordsRes = await fetch(
          `${API_BASE}/records?orgName=${encodeURIComponent(orgName)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (!recordsRes.ok) throw new Error("Failed to fetch records");

        const recordsData = await recordsRes.json();
        setDbRecords(Array.isArray(recordsData) ? recordsData : []);
      } catch (err) {
        console.error("Error loading imports:", err);
        setError("Could not load records.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchImports();
  }, [API_BASE, currentUser?.orgName, token]);

  useEffect(() => {
    const fetchOrgSubscription = async () => {
      if (currentUser?.role !== "Admin" || !currentUser?.orgId) {
        setOrgSubscription(null);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/subscription/org/${currentUser.orgId}/latest`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!res.ok) {
          setOrgSubscription(null);
          return;
        }

        const data = await res.json();
        setOrgSubscription(data?.subscription || null);
      } catch (err) {
        console.error("Error loading subscription:", err);
        setOrgSubscription(null);
      }
    };

    fetchOrgSubscription();
  }, [API_BASE, currentUser?.orgId, currentUser?.role, token]);

  const importDetail = useMemo(
    () =>
      buildRecordDataset({
        dbRecords,
        selectedSource: "all",
      }),
    [dbRecords],
  );

  const transactionRows = useMemo(() => importDetail.rows || [], [importDetail]);

  const availableMonths = useMemo(() => {
    if (!transactionRows.length) return [];
    const set = new Set();

    transactionRows.forEach((row) => {
      const d = row.parsedDate;
      if (!d) return;
      set.add(d.toISOString().slice(0, 7));
    });

    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactionRows]);

  const formatMonthKey = (key) => {
    if (!key || key === "all") return "All Periods";
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  };

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "all") return transactionRows;
    return transactionRows.filter((row) => {
      const d = row.parsedDate;
      return d && d.toISOString().slice(0, 7) === selectedMonth;
    });
  }, [selectedMonth, transactionRows]);

  const dynamicChartFilters = useMemo(() => {
    if (selectedMonth === "all") return {};
    const [year, month] = selectedMonth.split("-").map((value) => Number(value));
    if (!year || !month) return {};
    const lastDay = new Date(year, month, 0).getDate();
    return {
      fromDate: `${selectedMonth}-01`,
      toDate: `${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [selectedMonth]);

  const metrics = useMemo(() => {
    const summary = buildDashboardMetrics(filteredTransactions);
    return {
      revenue: summary.revenue,
      expenses: summary.expenses,
      profit: summary.revenue - summary.expenses,
      cashFlow: summary.cashFlow,
    };
  }, [filteredTransactions]);

  const trendData = useMemo(() => buildTrendData(filteredTransactions), [filteredTransactions]);
  const expenseBreakdown = useMemo(
    () => buildExpenseBreakdown(filteredTransactions),
    [filteredTransactions],
  );
  const categoryData = useMemo(
    () => buildCategoryRevenueData(filteredTransactions),
    [filteredTransactions],
  );

  const periodLabel = useMemo(() => {
    const bounds = findDateBounds(filteredTransactions);
    if (!bounds.min || !bounds.max) return "No dated records";
    return `${bounds.min.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })} - ${bounds.max.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })}`;
  }, [filteredTransactions]);

  const profitMargin =
    metrics.revenue > 0 ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : "0.0";

  const {
    showKPIs,
    showTrend,
    showExpensePie,
    showCategoryBar,
    showDataPreview,
  } = useDashboardSettings();

  const { layout, moveWidget, setLayout, saveToServer, loadFromServer } = useDashboardSettings();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  useEffect(() => {
    (async () => {
      try {
        await loadFromServer(API_BASE, token, currentUser);
      } catch (e) {
        // ignore load errors
      }
    })();
  }, [API_BASE, currentUser, loadFromServer, token]);

  const handleSaveSettings = async () => {
    try {
      await saveToServer(API_BASE, token, currentUser);
      alert("Dashboard settings saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  };

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

  useEffect(() => {
    if (selectedMonth !== "all" && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth("all");
    }
  }, [availableMonths, selectedMonth]);

  const chartWidgetKeys = ["kpis", "trend", "dynamicChart", "expensePie", "categoryBar"];
  const sidebarWidgetKeys = ["alertsSection", "quickActions", "supportCard"];

  const orderedChartWidgets = visibleLayout.filter((key) =>
    chartWidgetKeys.includes(key),
  );
  const orderedSidebarWidgets = visibleLayout.filter((key) =>
    sidebarWidgetKeys.includes(key),
  );

  const renderWidget = (key) => {
    if (key === "kpis") {
      return showKPIs ? (
        <KpiCards
          metrics={metrics}
          formatCurrency={formatCurrencyCompact}
          profitMargin={profitMargin}
        />
      ) : null;
    }
    if (key === "trend") {
      return showTrend ? (
        <TrendWidget
          trendData={trendData}
          mounted={mounted}
          loadingDetail={false}
          periodLabel={periodLabel}
        />
      ) : null;
    }
    if (key === "dynamicChart") {
      return <DynamicChart data={transactionRows} filters={dynamicChartFilters} />;
    }
    if (key === "expensePie") {
      return showExpensePie ? (
        <ExpensePie
          expenseBreakdown={expenseBreakdown}
          mounted={mounted}
          loadingDetail={false}
        />
      ) : null;
    }
    if (key === "categoryBar") {
      return showCategoryBar ? (
        <CategoryBar
          categoryData={categoryData}
          mounted={mounted}
          loadingDetail={false}
        />
      ) : null;
    }
    if (key === "dataPreview") {
      return showDataPreview ? (
        <DataPreview importDetail={importDetail} loadingDetail={false} />
      ) : null;
    }
    if (key === "alertsSection") return <AlertsSection />;
    if (key === "quickActions") return <QuickActions />;
    if (key === "supportCard") return <SupportCard />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500">Your financial overview at a glance</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-w-[180px] truncate"
              >
                <option value="all">All Periods</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthKey(month)}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => navigate("/import")}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              New Report
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loadingList || !mounted ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        ) : importDetail.records === 0 ? (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-white/80 px-8 py-16 text-center shadow-sm">
            <div className="mx-auto max-w-2xl space-y-4">
              <span className="inline-flex rounded-full bg-teal-50 px-4 py-1 text-sm font-medium text-teal-700">
                No records yet
              </span>
              <h2 className="text-2xl font-semibold text-slate-900">
                Add records to start using the dashboard
              </h2>
              <p className="text-slate-500">
                Import a CSV or Excel file, or add records from the Records page, and
                we&apos;ll build your financial overview here.
              </p>
              <button
                onClick={() => navigate("/import")}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                Go to Imports
              </button>
            </div>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const from = visibleLayout.indexOf(active.id);
                const to = visibleLayout.indexOf(over.id);
                if (from === -1 || to === -1) return;
                moveWidget(from, to);
              }}
            >
              <SortableContext items={visibleLayout} strategy={rectSortingStrategy}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                    {orderedChartWidgets.map((key) => (
                        <SortableWidget
                          key={key}
                          id={key}
                          className={key === "dynamicChart" ? "sm:col-span-2" : ""}
                        >
                          {renderWidget(key)}
                        </SortableWidget>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <SortableWidget id="dataPreview">
                        {renderWidget("dataPreview")}
                      </SortableWidget>
                    </div>

                    <aside className="lg:col-span-1 flex flex-col gap-6">
                      {orderedSidebarWidgets.map((key) => (
                        <SortableWidget key={key} id={key}>
                          {renderWidget(key)}
                        </SortableWidget>
                      ))}
                    </aside>
                  </div>
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  useDashboardSettings.getState().reset();
                }}
                className="px-3 py-2 rounded border text-sm"
              >
                Reset Layout
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-3 py-2 rounded bg-teal-600 text-white text-sm"
              >
                Save Layout
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;
