import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useDashboardSettings from "../store/useDashboardSettings";
import { useNotifications } from "../components/nav/NotificationContext";
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
import {
  buildCategoryRevenueData,
  buildDashboardMetrics,
  buildExpenseBreakdown,
  buildTrendData,
  findDateBounds,
  formatCurrencyCompact,
} from "../utils/financialData";
import { buildRecordDataset, getImportId, loadManualRows } from "../utils/recordsData";

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
  const { addNotification } = useNotifications();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [imports, setImports] = useState([]);
  const [manualRows, setManualRows] = useState([]);
  const [orgSubscription, setOrgSubscription] = useState(null);
  const [selectedImportId, setSelectedImportId] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const lastExpiryNoticeKey = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setManualRows(loadManualRows(currentUser?.orgId));
  }, [currentUser?.orgId]);

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
        setImports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading imports:", err);
        setError("Could not load imported files.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchImports();
  }, [API_BASE, currentUser?.orgId, token]);

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

  useEffect(() => {
    if (currentUser?.role !== "Admin" || !orgSubscription?.nextBilling) {
      return;
    }

    const nextBillingDate = new Date(orgSubscription.nextBilling);
    const today = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilExpiration = Math.ceil(
      (nextBillingDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / msPerDay,
    );

    const isActive = (orgSubscription.status || "").toLowerCase() === "active";
    const notificationKey = `${orgSubscription.orgId || currentUser?.orgId}-${orgSubscription.nextBilling}`;

    if (
      isActive &&
      daysUntilExpiration >= 0 &&
      daysUntilExpiration <= 7 &&
      lastExpiryNoticeKey.current !== notificationKey
    ) {
      addNotification({
        type: "payment_update",
        role: "Admin",
        title: "Plan Expiring Soon",
        message: `Your ${orgSubscription.planName || "current"} plan expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? "" : "s"}. Renew now to maintain your financial records.`,
      });
      lastExpiryNoticeKey.current = notificationKey;
    }
  }, [addNotification, currentUser?.orgId, currentUser?.role, orgSubscription]);

  const importDetail = useMemo(
    () =>
      buildRecordDataset({
        imports,
        manualRows,
        selectedSource: selectedImportId,
      }),
    [imports, manualRows, selectedImportId],
  );

  const transactionRows = useMemo(() => importDetail.rows || [], [importDetail]);
  const hasSelectableSources = imports.length > 0 || manualRows.length > 0;

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
            {hasSelectableSources && (
              <select
                value={selectedImportId}
                onChange={(e) => setSelectedImportId(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 max-w-[220px] truncate"
              >
                <option value="all">All Records</option>
                {imports.map((imp) => (
                  <option key={getImportId(imp)} value={getImportId(imp)}>
                    {imp.fileName}
                  </option>
                ))}
              </select>
            )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                  {visibleLayout.map((key) => {
                    if (key === "kpis") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showKPIs && (
                            <KpiCards
                              metrics={metrics}
                              formatCurrency={formatCurrencyCompact}
                              profitMargin={profitMargin}
                            />
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "trend") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showTrend && (
                            <TrendWidget
                              trendData={trendData}
                              mounted={mounted}
                              loadingDetail={false}
                              selectedImportId={selectedImportId}
                              periodLabel={periodLabel}
                            />
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "expensePie") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showExpensePie && (
                            <ExpensePie
                              expenseBreakdown={expenseBreakdown}
                              mounted={mounted}
                              loadingDetail={false}
                            />
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "categoryBar") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showCategoryBar && (
                            <CategoryBar
                              categoryData={categoryData}
                              mounted={mounted}
                              loadingDetail={false}
                            />
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "dataPreview") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showDataPreview && (
                            <DataPreview importDetail={importDetail} loadingDetail={false} />
                          )}
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
  );
};

export default DashboardPage;
