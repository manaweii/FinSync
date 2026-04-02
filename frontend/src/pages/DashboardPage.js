import { useState, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useDashboardSettings from "../store/useDashboardSettings";
import { Line, Bar, Pie } from "react-chartjs-2";
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
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import Plot from "react-plotly.js";
import Plotly from "plotly.js-dist-min";

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

  // Anomaly detection rules (configurable per metric)
  const [anomalyRules, setAnomalyRules] = useState({
    Revenue: { enabled: true, method: 'zscore', zScore: 2.0, lookback: 6, operator: '>' },
    Expenses: { enabled: true, method: 'zscore', zScore: 2.0, lookback: 6, operator: '>' },
    Profit: { enabled: true, method: 'threshold', operator: '<', threshold: 0 },
  });

  const updateRule = (metric, patch) =>
    setAnomalyRules((s) => ({ ...s, [metric]: { ...(s[metric] || {}), ...patch } }));

  // compute numeric series per metric from preview rows
  const seriesData = useMemo(() => {
    const rows = importDetail?.previewRows || [];
    const map = { Revenue: [], Expenses: [], Profit: [] };
    rows.forEach((row, i) => {
      const rev = parseFloat(String(row.Revenue || 0).replace(/[,\s]/g, '')) || 0;
      const cogs = parseFloat(String(row.COGS || 0).replace(/[,\s]/g, '')) || 0;
      const mkt = parseFloat(String(row.Marketing || 0).replace(/[,\s]/g, '')) || 0;
      const adm = parseFloat(String(row.Admin || 0).replace(/[,\s]/g, '')) || 0;
      const tax = parseFloat(String(row.Tax || 0).replace(/[,\s]/g, '')) || 0;
      const expenses = cogs + mkt + adm + tax;
      const profit = rev - expenses;
      const label = row.Date ? new Date(row.Date).toISOString().slice(0, 10) : `row-${i}`;
      map.Revenue.push({ i, x: label, y: rev });
      map.Expenses.push({ i, x: label, y: expenses });
      map.Profit.push({ i, x: label, y: profit });
    });
    return map;
  }, [importDetail]);

  // simple anomaly detection based on configured rules
  const anomalies = useMemo(() => {
    const out = [];
    Object.entries(anomalyRules).forEach(([metric, rule]) => {
      if (!rule || !rule.enabled) return;
      const series = seriesData[metric] || [];
      if (series.length === 0) return;
      if (rule.method === 'threshold') {
        series.forEach((pt) => {
          const v = pt.y;
          const op = rule.operator || '>';
          const thr = Number(rule.threshold || 0);
          let flag = false;
          if (op === '>') flag = v > thr;
          else if (op === '<') flag = v < thr;
          if (flag) out.push({ metric, index: pt.i, x: pt.x, value: v, rule });
        });
      } else if (rule.method === 'zscore') {
        const lb = Math.max(1, Number(rule.lookback || 6));
        series.forEach((pt, idx) => {
          if (idx < lb) return; // not enough history
          const window = series.slice(idx - lb, idx).map((w) => w.y);
          const mean = window.reduce((a, b) => a + b, 0) / window.length;
          const sd = Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length) || 0.00001;
          const z = Math.abs((pt.y - mean) / sd);
          if (z >= (Number(rule.zScore) || 2)) {
            out.push({ metric, index: pt.i, x: pt.x, value: pt.y, rule, z, window });
          }
        });
      }
    });
    // sort by latest first
    return out.sort((a, b) => (a.x < b.x ? 1 : -1));
  }, [anomalyRules, seriesData]);

  // modal for anomaly context
  const [anomalyContext, setAnomalyContext] = useState({ open: false, metric: null, point: null, window: [] });

  const openContext = (item) => {
    // if item already has a window, use it; otherwise construct from seriesData using lookback
    let windowPoints = item.window || [];
    if ((!windowPoints || windowPoints.length === 0) && seriesData[item.metric]) {
      const lookback = Number(anomalyRules[item.metric]?.lookback || 6);
      const series = seriesData[item.metric];
      const start = Math.max(0, item.index - lookback);
      windowPoints = series.slice(start, item.index).map((p) => ({ x: p.x, y: p.y }));
    }
    setAnomalyContext({ open: true, metric: item.metric, point: item, window: windowPoints });
  };
  const closeContext = () => setAnomalyContext({ open: false, metric: null, point: null, window: [] });

  // dashboard visibility settings
  const {
    showKPIs,
    showTrend,
    showExpensePie,
    showCategoryBar,
    showDataPreview,
  } = useDashboardSettings();

  // dashboard store (layout + helpers)
  const { layout, moveWidget, setLayout, saveToServer, loadFromServer } =
    useDashboardSettings();

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

  // helper to download chart image (JPEG only)
  const downloadChart = async (chartId, fileName = "chart.jpg") => {
    const ensureJpg = (name) => {
      if (!name) return "chart.jpg";
      return name.toLowerCase().endsWith(".jpg") ||
        name.toLowerCase().endsWith(".jpeg")
        ? name
        : `${name}.jpg`;
    };
    fileName = ensureJpg(fileName);
    const mime = "image/jpeg";
    try {
      console.debug("downloadChart called for", chartId, "mime", mime);
      const container = document.getElementById(chartId);
      console.debug("downloadChart container:", container);
      if (!container) {
        alert("Chart element not found");
        console.warn("downloadChart: no element with id", chartId);
        return;
      }

      // helper to trigger download from dataURL or blob URL
      const triggerDownload = (url, name) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      // helper: draw any image/canvas onto a white-background canvas and export jpeg
      const exportAsJpegFromImage = (imgOrCanvas, name) => {
        const w = imgOrCanvas.width || imgOrCanvas.naturalWidth || 1200;
        const h = imgOrCanvas.height || imgOrCanvas.naturalHeight || 800;
        const tmp = document.createElement("canvas");
        tmp.width = w;
        tmp.height = h;
        const ctx = tmp.getContext("2d");
        // fill white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(imgOrCanvas, 0, 0, w, h);
        const dataUrl = tmp.toDataURL("image/jpeg", 0.92);
        triggerDownload(dataUrl, name);
      };

      let canvas = null;
      if (container.tagName === "CANVAS") canvas = container;
      else canvas = container.querySelector("canvas");
      console.debug("downloadChart found canvas:", canvas);
      if (canvas && typeof canvas.toDataURL === "function") {
        try {
          // draw onto white canvas to avoid transparency
          exportAsJpegFromImage(canvas, fileName);
          return;
        } catch (e) {
          console.warn("downloadChart: canvas export failed", e);
        }
      }

      // 2) Try Plotly export on its graph div (request JPEG)
      const plotlyDiv =
        container.querySelector(".js-plotly-plot") ||
        container.querySelector(".plotly") ||
        container.querySelector("[data-plotly]") ||
        container;
      console.debug(
        "downloadChart plotlyDiv:",
        plotlyDiv,
        "Plotly available:",
        !!Plotly && typeof Plotly.toImage === "function",
      );
      if (plotlyDiv && Plotly && typeof Plotly.toImage === "function") {
        try {
          const result = await Plotly.toImage(plotlyDiv, {
            format: "jpeg",
            width: 1200,
            height: 800,
          });
          if (typeof result === "string" && result.startsWith("data:")) {
            // create image, draw to white canvas and export jpeg to ensure white background
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                try {
                  exportAsJpegFromImage(img, fileName);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              };
              img.onerror = (err) =>
                reject(err || new Error("Plotly image load error"));
              img.src = result;
            });
            return;
          }
          if (result instanceof Blob) {
            const url = URL.createObjectURL(result);
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                try {
                  exportAsJpegFromImage(img, fileName);
                  URL.revokeObjectURL(url);
                  resolve();
                } catch (err) {
                  URL.revokeObjectURL(url);
                  reject(err);
                }
              };
              img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(err || new Error("Plotly blob load error"));
              };
              img.src = url;
            });
            return;
          }
        } catch (e) {
          console.warn("downloadChart: Plotly.toImage failed", e);
        }
      }

      // 3) Try container as canvas
      if (typeof container.toDataURL === "function") {
        try {
          // composite onto white canvas to ensure white background
          exportAsJpegFromImage(container, fileName);
          return;
        } catch (e) {
          console.warn("downloadChart: container toDataURL failed", e);
        }
      }

      // 4) If there's an SVG, convert it to JPEG via temporary canvas
      const svg = container.querySelector("svg");
      if (svg) {
        try {
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(svg);
          const blob = new Blob([svgStr], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                const canvasEl = document.createElement("canvas");
                const rect = svg.getBoundingClientRect();
                canvasEl.width = rect.width || 1200;
                canvasEl.height = rect.height || 800;
                const ctx = canvasEl.getContext("2d");
                // white background for jpeg
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
                ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
                const dataUrl = canvasEl.toDataURL(mime, 0.92);
                triggerDownload(dataUrl, fileName);
                URL.revokeObjectURL(url);
                resolve();
              } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
              }
            };
            img.onerror = (err) => {
              URL.revokeObjectURL(url);
              reject(err || new Error("SVG image load error"));
            };
            img.src = url;
          });
          return;
        } catch (e) {
          console.warn("downloadChart: svg->jpeg failed", e);
        }
      }

      alert("Chart not available to download as JPEG");
      console.warn("downloadChart: no canvas/plotly/svg found in", container);
    } catch (err) {
      console.error("downloadChart err", err);
      alert("Failed to download chart");
    }
  };

  // local chart type for trend widget
  const [trendChartType, setTrendChartType] = useState("line");

  // Sortable widget wrapper
  function SortableWidget({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div
        ref={setNodeRef}
        className="w-full"
        style={style}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    );
  }

  // Memoized Trend widget: isolates local chart state so changing chart type doesn't re-render parent
  const TrendWidget = memo(function TrendWidget({
    trendData,
    mounted,
    loadingDetail,
    selectedImportId,
  }) {
    const [chartType, setChartType] = useState("line");
    const chartId = `trend-chart-${selectedImportId || "local"}`;

    // derive a simple OHLC series for candlestick (synthetic from Revenue)
    const ohlc = useMemo(() => {
      return trendData.map((d) => {
        const base = Number(d.Revenue || 0);
        const variance = Math.max(
          1,
          Math.abs(Number(d.Revenue || 0) - Number(d.Expenses || 0)) * 0.2,
        );
        const open = +(base - variance * 0.2).toFixed(2);
        const close = +base.toFixed(2);
        const high = +Math.max(base, base + variance * 0.5).toFixed(2);
        const low = +Math.min(base, base - variance * 0.5).toFixed(2);
        return { x: d.name, open, high, low, close };
      });
    }, [trendData]);

    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Visualization</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-2 rounded border bg-white text-sm"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="waterfall">Waterfall</option>
              <option value="boxplot">Box Plot</option>
              <option value="candlestick">Candlestick</option>
            </select>

            {/* Download icon button — uses the parent downloadChart helper for Plotly/canvas export */}
            <button
              onClick={() => downloadChart(chartId, `${chartId}.jpg`)}
              aria-label="Download chart"
              title="Download chart"
              className="p-2 rounded border bg-white hover:bg-slate-50 text-slate-700"
            >
              {/* Professional download icon (Heroicons-style) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 10l5 5 5-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15V3"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 md:h-80">
          {trendData.length > 0 && mounted ? (
            <>
              {chartType === "line" && (
                <Line
                  id={chartId}
                  data={{
                    labels: trendData.map((d) => d.name),
                    datasets: [
                      {
                        label: "Revenue",
                        data: trendData.map((d) => d.Revenue),
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16,185,129,0.12)",
                        fill: true,
                        tension: 0.3,
                      },
                      {
                        label: "Expenses",
                        data: trendData.map((d) => d.Expenses),
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.12)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => `$${(value / 1000).toFixed(0)}K`,
                        },
                      },
                    },
                  }}
                />
              )}

              {chartType === "area" && (
                <Line
                  id={chartId}
                  data={{
                    labels: trendData.map((d) => d.name),
                    datasets: [
                      {
                        label: "Revenue",
                        data: trendData.map((d) => d.Revenue),
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16,185,129,0.28)",
                        fill: "start",
                        tension: 0.3,
                      },
                      {
                        label: "Expenses",
                        data: trendData.map((d) => d.Expenses),
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.18)",
                        fill: "start",
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => `$${(value / 1000).toFixed(0)}K`,
                        },
                      },
                    },
                  }}
                />
              )}

              {chartType === "bar" && (
                <Bar
                  id={chartId}
                  data={{
                    labels: trendData.map((d) => d.name),
                    datasets: [
                      {
                        label: "Revenue",
                        data: trendData.map((d) => d.Revenue),
                        backgroundColor: "#10b981",
                      },
                      {
                        label: "Expenses",
                        data: trendData.map((d) => d.Expenses),
                        backgroundColor: "#f97316",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => `$${(value / 1000).toFixed(0)}K`,
                        },
                      },
                    },
                  }}
                />
              )}

              {chartType === "waterfall" && (
                <div id={chartId} style={{ width: "100%", height: "100%" }}>
                  <Plot
                    data={[
                      {
                        type: "waterfall",
                        measure: trendData.map(() => "relative"),
                        x: trendData.map((d) => d.name),
                        y: trendData.map((d) => d.Revenue - d.Expenses),
                        text: trendData.map(
                          (d) =>
                            `$${(d.Revenue - d.Expenses).toLocaleString()}`,
                        ),
                        decreasing: { marker: { color: "#ef4444" } },
                        increasing: { marker: { color: "#10b981" } },
                      },
                    ]}
                    layout={{
                      autosize: true,
                      margin: { t: 30, b: 40, l: 40, r: 20 },
                      yaxis: { tickformat: "$,~s" },
                    }}
                    useResizeHandler
                    style={{ width: "100%", height: "100%" }}
                    config={{ responsive: true }}
                  />
                </div>
              )}

              {chartType === "boxplot" && (
                <div id={chartId} style={{ width: "100%", height: "100%" }}>
                  <Plot
                    data={[
                      {
                        y: trendData.map((d) => d.Revenue),
                        type: "box",
                        name: "Revenue",
                        marker: { color: "#10b981" },
                      },
                      {
                        y: trendData.map((d) => d.Expenses),
                        type: "box",
                        name: "Expenses",
                        marker: { color: "#f97316" },
                      },
                    ]}
                    layout={{
                      autosize: true,
                      margin: { t: 30, b: 40, l: 40, r: 20 },
                    }}
                    useResizeHandler
                    style={{ width: "100%", height: "100%" }}
                    config={{ responsive: true }}
                  />
                </div>
              )}

              {chartType === "candlestick" && (
                <div id={chartId} style={{ width: "100%", height: "100%" }}>
                  <Plot
                    data={[
                      {
                        x: ohlc.map((p) => p.x),
                        open: ohlc.map((p) => p.open),
                        high: ohlc.map((p) => p.high),
                        low: ohlc.map((p) => p.low),
                        close: ohlc.map((p) => p.close),
                        type: "candlestick",
                        increasing: { line: { color: "#10b981" } },
                        decreasing: { line: { color: "#ef4444" } },
                      },
                    ]}
                    layout={{
                      autosize: true,
                      margin: { t: 30, b: 40, l: 40, r: 20 },
                    }}
                    useResizeHandler
                    style={{ width: "100%", height: "100%" }}
                    config={{ responsive: true }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              {loadingDetail ? "Loading Chart..." : "No trend data available"}
            </div>
          )}
        </div>
      </div>
    );
  });

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

            {/* Month selector */}
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
            {/* Draggable widget area */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const from = layout.indexOf(active.id);
                const to = layout.indexOf(over.id);
                if (from === -1 || to === -1) return;
                // update store
                moveWidget(from, to);
              }}
            >
              <SortableContext items={layout} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                  {layout.map((key) => {
                    // map keys to widgets
                    if (key === "kpis") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showKPIs && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
                              {/* KPI cards reused from above */}
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
                                <div className="text-sm text-slate-500">
                                  Total Revenue
                                </div>
                              </div>

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
                                <div className="text-sm text-slate-500">
                                  Total Expenses
                                </div>
                              </div>

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
                                <div className="text-sm text-slate-500">
                                  Net Profit
                                </div>
                                <div
                                  className={`text-xs font-medium mt-1 ${metrics.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                >
                                  {profitMargin}% margin
                                </div>
                              </div>

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
                                <div className="text-sm text-slate-500">
                                  Cash Position
                                </div>
                                <div className="text-xs text-blue-600 font-medium mt-1">
                                  {metrics.cashFlow > 0 ? "Healthy" : "Low"}
                                </div>
                              </div>
                            </div>
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
                              loadingDetail={loadingDetail}
                              selectedImportId={selectedImportId}
                            />
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "expensePie") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showExpensePie && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                              <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">
                                  Expense Breakdown
                                </h2>
                              </div>
                              <div className="h-64 sm:h-72 md:h-80">
                                {expenseBreakdown.length > 0 && mounted ? (
                                  <Pie
                                    data={{
                                      labels: expenseBreakdown.map(
                                        (item) => item.name,
                                      ),
                                      datasets: [
                                        {
                                          data: expenseBreakdown.map(
                                            (item) => item.value,
                                          ),
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
                                          labels: {
                                            padding: 20,
                                            font: { size: 12 },
                                          },
                                        },
                                        tooltip: {
                                          callbacks: {
                                            label: (context) =>
                                              `$${context.parsed.toLocaleString()}`,
                                          },
                                        },
                                      },
                                      cutout: "50%",
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
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "categoryBar") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showCategoryBar && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Revenue by Category
                              </h2>
                              <div className="h-56 sm:h-72 md:h-80">
                                {categoryData.length > 0 && mounted ? (
                                  <Bar
                                    data={{
                                      labels: categoryData.map(
                                        (item) => item.name,
                                      ),
                                      datasets: [
                                        {
                                          label: "Revenue",
                                          data: categoryData.map(
                                            (item) => item.Revenue,
                                          ),
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
                            </div>
                          )}
                        </SortableWidget>
                      );
                    }
                    if (key === "dataPreview") {
                      return (
                        <SortableWidget key={key} id={key}>
                          {showDataPreview &&
                            importDetail?.previewRows &&
                            importDetail.previewRows.length > 0 && (
                              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                  <h2 className="text-2xl font-bold text-slate-900">
                                    Data Preview
                                  </h2>
                                  <span className="text-xs text-slate-400">
                                    Showing{" "}
                                    {Math.min(
                                      importDetail.previewRows.length,
                                      10,
                                    )}{" "}
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
                                              i % 2 === 0
                                                ? "bg-white"
                                                : "bg-slate-50/50"
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
                        </SortableWidget>
                      );
                    }
                    if (key === "alerts") {
                      return (
                        <SortableWidget key={key} id={key}>
                          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-2xl font-bold text-slate-900">Anomaly Alerts</h2>
                            </div>

                            {anomalies.length === 0 ? (
                              <div className="text-center py-6 text-slate-400">No anomalies detected</div>
                            ) : (
                              <div className="space-y-4">
                                {anomalies.map((anomaly, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="text-sm text-slate-500">
                                        Anomaly in <span className="font-semibold">{anomaly.metric}</span>
                                      </div>
                                      <div className="text-lg font-bold text-slate-900">
                                        {formatCurrency(anomaly.value)}
                                      </div>
                                      <div className="text-xs text-slate-400">{anomaly.x}</div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <button
                                        onClick={() => openContext(anomaly)}
                                        className="px-3 py-1 text-xs rounded bg-teal-500 text-white"
                                      >
                                        View Details
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </SortableWidget>
                      );
                    }
                    return null;
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* Alerts context modal */}
            {anomalyContext.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl p-6 w-[min(900px,90%)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Anomaly Context — {anomalyContext.metric}</h3>
                    <button onClick={closeContext} className="text-slate-500">Close</button>
                  </div>
                  {anomalyContext.window && anomalyContext.window.length > 0 ? (
                    <div className="h-48">
                      <Line
                        data={{
                          labels: anomalyContext.window.map((p) => p.x),
                          datasets: [
                            {
                              label: anomalyContext.metric,
                              data: anomalyContext.window.map((p) => p.y),
                              borderColor: "#10b981",
                              backgroundColor: "rgba(16,185,129,0.12)",
                              fill: false,
                              tension: 0.3,
                            },
                            anomalyContext.point
                              ? {
                                  label: "Anomaly",
                                  data: anomalyContext.window.map((p) =>
                                    p.x === anomalyContext.point.x ? anomalyContext.point.value : null,
                                  ),
                                  pointBackgroundColor: "#ef4444",
                                  showLine: false,
                                  type: "scatter",
                                }
                              : null,
                          ].filter(Boolean),
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">No previous context available for this anomaly.</div>
                  )}
                </div>
              </div>
            )}

            {/* Controls for layout */}
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