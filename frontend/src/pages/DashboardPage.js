import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FunnelIcon } from "@heroicons/react/24/outline";
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
import { isAdminRole } from "../utils/roles";

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

const CHART_WIDGET_KEYS = [
  "kpis",
  "trend",
  "dynamicChart",
  "expensePie",
  "categoryBar",
];
const SIDEBAR_WIDGET_KEYS = ["alertsSection", "quickActions", "supportCard"];

const parseDateInput = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuthStore();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [dbRecords, setDbRecords] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [draftDateRange, setDraftDateRange] = useState({ from: "", to: "" });
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const dateRangeRef = useRef(null);
  const isOrgAdmin = isAdminRole(currentUser?.role);

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

  const importDetail = useMemo(
    () =>
      buildRecordDataset({
        dbRecords,
        selectedSource: "all",
      }),
    [dbRecords],
  );

  const transactionRows = useMemo(
    () => importDetail.rows || [],
    [importDetail],
  );

  const filteredTransactions = useMemo(() => {
    const fromDate = parseDateInput(dateRange.from);
    const toDate = parseDateInput(dateRange.to, true);
    if (!fromDate && !toDate) return transactionRows;

    return transactionRows.filter((row) => {
      const d = row.parsedDate;
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [dateRange.from, dateRange.to, transactionRows]);

  const dynamicChartFilters = useMemo(() => {
    const filters = {};
    if (dateRange.from) filters.fromDate = dateRange.from;
    if (dateRange.to) filters.toDate = dateRange.to;
    return filters;
  }, [dateRange.from, dateRange.to]);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return "All periods";
    const formatDate = (value) =>
      parseDateInput(value)?.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    }
    if (dateRange.from) return `From ${formatDate(dateRange.from)}`;
    return `Until ${formatDate(dateRange.to)}`;
  }, [dateRange.from, dateRange.to]);

  const hasInvalidDateRange =
    draftDateRange.from &&
    draftDateRange.to &&
    parseDateInput(draftDateRange.from) >
      parseDateInput(draftDateRange.to, true);

  const metrics = useMemo(() => {
    const summary = buildDashboardMetrics(filteredTransactions);
    return {
      revenue: summary.revenue,
      expenses: summary.expenses,
      profit: summary.revenue - summary.expenses,
      cashFlow: summary.cashFlow,
    };
  }, [filteredTransactions]);

  const trendData = useMemo(
    () => buildTrendData(filteredTransactions),
    [filteredTransactions],
  );
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
    metrics.revenue > 0
      ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
      : "0.0";

  const {
    showKPIs,
    showTrend,
    showExpensePie,
    showCategoryBar,
    showDataPreview,
    layout,
    moveWidget,
    setLayout,
    saveToServer,
    loadFromServer,
  } = useDashboardSettings();

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
    const handleClickOutside = (event) => {
      if (
        dateRangeRef.current &&
        !dateRangeRef.current.contains(event.target)
      ) {
        setIsDateRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDateRangeToggle = () => {
    setDraftDateRange(dateRange);
    setIsDateRangeOpen((open) => !open);
  };

  const applyDateRange = () => {
    if (hasInvalidDateRange) return;
    setDateRange(draftDateRange);
    setIsDateRangeOpen(false);
  };

  const clearDateRange = () => {
    const emptyRange = { from: "", to: "" };
    setDraftDateRange(emptyRange);
    setDateRange(emptyRange);
    setIsDateRangeOpen(false);
  };

  useEffect(() => {
    if (!transactionRows.length && (dateRange.from || dateRange.to)) {
      const emptyRange = { from: "", to: "" };
      setDraftDateRange(emptyRange);
      setDateRange(emptyRange);
      setIsDateRangeOpen(false);
    }
  }, [dateRange.from, dateRange.to, transactionRows.length]);

  const orderedChartWidgets = visibleLayout.filter((key) =>
    CHART_WIDGET_KEYS.includes(key),
  );
  const orderedSidebarWidgets = visibleLayout.filter((key) =>
    SIDEBAR_WIDGET_KEYS.includes(key),
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
      return (
        <DynamicChart data={transactionRows} filters={dynamicChartFilters} />
      );
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
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
              <button
                onClick={() => navigate("/import")}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                New Report
              </button>

              <div
                className="relative"
                ref={dateRangeRef}
              >
                <button
                  type="button"
                  onClick={handleDateRangeToggle}
                  aria-label="Choose dashboard date range"
                  title={dateRangeLabel}
                  aria-expanded={isDateRangeOpen}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-teal-200 hover:text-teal-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <FunnelIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {isDateRangeOpen && (
                  <div className="absolute right-0 z-30 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="dashboard-from-date"
                          className="mb-1.5 block text-xs font-medium text-slate-600"
                        >
                          From Date
                        </label>
                        <input
                          id="dashboard-from-date"
                          type="date"
                          value={draftDateRange.from}
                          onChange={(e) =>
                            setDraftDateRange((range) => ({
                              ...range,
                              from: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="dashboard-to-date"
                          className="mb-1.5 block text-xs font-medium text-slate-600"
                        >
                          To Date
                        </label>
                        <input
                          id="dashboard-to-date"
                          type="date"
                          value={draftDateRange.to}
                          onChange={(e) =>
                            setDraftDateRange((range) => ({
                              ...range,
                              to: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                      </div>

                      {hasInvalidDateRange && (
                        <p className="text-xs font-medium text-red-500">
                          From Date must be before To Date.
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          onClick={clearDateRange}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={applyDateRange}
                          disabled={hasInvalidDateRange}
                          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                  Add initial investment to start using the dashboard
                </h2>
                <p className="text-slate-500">
                  Organization admins can initialize capital as a balanced cash
                  and equity transaction from the Records page.
                </p>
                <button
                  onClick={() =>
                    navigate(isOrgAdmin ? "/records?setup=investment" : "/records")
                  }
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {isOrgAdmin ? "Set Initial Investment" : "View Records"}
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
                <SortableContext
                  items={visibleLayout}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                      {orderedChartWidgets.map((key) => (
                        <SortableWidget
                          key={key}
                          id={key}
                          className={
                            key === "dynamicChart" ? "sm:col-span-2" : ""
                          }
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
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;
