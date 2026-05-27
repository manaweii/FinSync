import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// ─── Brand ────────────────────────────────────────────────────────────────────
const B = {
  blue: "#2563EB",
  blueHover: "#1D4ED8",
  blueLight: "#EFF6FF",
  teal: "#0D9488",
  tealHover: "#0F766E",
  tealLight: "#F0FDFA",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPageWindow(cur, total, size = 5) {
  if (total <= size) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(size / 2);
  let start = Math.max(1, cur - half);
  let end = start + size - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - size + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function parseLogDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function toCSV(rows) {
  const headers = [
    "Timestamp",
    "User",
    "Role",
    "Organization",
    "Plan",
    "Type",
    "Status",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.timestamp,
        r.user,
        r.role,
        r.organization || r.org || "",
        r.plan,
        r.type || r.subscriptionType || "signup",
        r.result || r.status,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Active: { bg: "#ECFDF5", color: "#065F46", ring: "#6EE7B7", dot: "#10B981" },
  Disabled: {
    bg: "#FFF1F2",
    color: "#9F1239",
    ring: "#FECDD3",
    dot: "#F43F5E",
  },
  Canceled: {
    bg: "#FFF1F2",
    color: "#9F1239",
    ring: "#FECDD3",
    dot: "#F43F5E",
  },
  Pending: { bg: "#FFFBEB", color: "#92400E", ring: "#FDE68A", dot: "#F59E0B" },
};
const DEFAULT_STATUS = {
  bg: "#F8FAFC",
  color: "#475569",
  ring: "#CBD5E1",
  dot: "#94A3B8",
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || DEFAULT_STATUS;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: s.bg,
        color: s.color,
        boxShadow: `0 0 0 1px ${s.ring}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, accent, Icon, trend, isPlaceholder }) => (
  <div
    style={{
      position: "relative",
      background: "#fff",
      borderRadius: 16,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      boxShadow: "0 1px 3px rgba(15,23,42,.07), 0 4px 16px rgba(15,23,42,.05)",
      border: "1px solid #E2E8F0",
      overflow: "hidden",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderRadius: "16px 16px 0 0",
        background: accent,
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#94A3B8",
          margin: 0,
        }}
      >
        {label}
      </p>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent + "18",
        }}
      >
        <Icon style={{ width: 18, height: 18, color: accent }} />
      </span>
    </div>
    <div>
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: isPlaceholder ? "#CBD5E1" : "#0F172A",
          margin: 0,
        }}
      >
        {isPlaceholder ? "—" : value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: "#64748B",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {trend === "up" && (
            <span style={{ color: "#10B981", fontWeight: 700 }}>↑</span>
          )}
          {trend === "down" && (
            <span style={{ color: "#EF4444", fontWeight: 700 }}>↓</span>
          )}
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ─── Shared button styles ─────────────────────────────────────────────────────
const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 16px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};
const btnOutline = {
  ...btnBase,
  background: "#fff",
  color: "#374151",
  border: "1px solid #E2E8F0",
  boxShadow: "0 1px 2px rgba(15,23,42,.05)",
};
const btnPrimary = {
  ...btnBase,
  color: "#fff",
  border: "none",
  background: `linear-gradient(135deg, ${B.blue}, ${B.teal})`,
  boxShadow: "0 1px 3px rgba(37,99,235,.25)",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const PER_PAGE = 10;
  const WINDOW_SIZE = 5;

  // Data
  const [logs, setLogs] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/subscription/logs`);
      if (!res.ok) throw new Error("Failed to fetch subscription logs");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.logs || []);
      setTotalPayments(data?.totalPayments || 0);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const csv = toCSV(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscription-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, search, startDate, endDate]);

  // ── Filtered logs ──────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let r = logs;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((l) =>
        [
          l.user,
          l.role,
          l.organization,
          l.org,
          l.plan,
          l.type,
          l.subscriptionType,
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
      );
    }
    if (startDate) {
      const from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      r = r.filter((l) => {
        const d = parseLogDate(l.timestamp);
        return d && d >= from;
      });
    }
    if (endDate) {
      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
      r = r.filter((l) => {
        const d = parseLogDate(l.timestamp);
        return d && d <= to;
      });
    }
    return r;
  }, [logs, search, startDate, endDate]);

  useEffect(() => setCurrentPage(1), [filteredLogs]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PER_PAGE));
  const pageStart = (currentPage - 1) * PER_PAGE;
  const currentLogs = filteredLogs.slice(pageStart, pageStart + PER_PAGE);
  const showingStart = filteredLogs.length ? pageStart + 1 : 0;
  const showingEnd = Math.min(
    pageStart + currentLogs.length,
    filteredLogs.length,
  );
  const pageWindow = getPageWindow(currentPage, totalPages, WINDOW_SIZE);

  // ── KPI values ─────────────────────────────────────────────────────────────
  const activeCount = logs.filter(
    (l) => (l.result || l.status) === "Active",
  ).length;
  const pendingCount = logs.filter(
    (l) => (l.result || l.status) === "Pending",
  ).length;
  const canceledCount = logs.filter((l) =>
    ["Disabled", "Canceled"].includes(l.result || l.status),
  ).length;
  const churnRate = logs.length
    ? ((canceledCount / logs.length) * 100).toFixed(1)
    : "0.0";
  const hasData = logs.length > 0;

  const TABLE_COLS = [
    "Timestamp",
    "User",
    "Role",
    "Organization",
    "Plan",
    "Type",
    "Status",
  ];

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputCls =
    "rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400";

  return (
    <>
      {/* Google Fonts — Geist-style clean stack */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        .fs-dashboard * { font-family: 'DM Sans', system-ui, sans-serif; }
        .btn-outline:hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; }
        .btn-primary:hover { opacity: 0.92; }
        .row-hover:hover { background: #F0F9FF !important; }
        .page-btn:hover { background: #F1F5F9 !important; }
      `}</style>

      <div
        className="fs-dashboard"
        style={{ minHeight: "100vh", background: "#F8FAFC", padding: "0" }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "36px 24px 60px",
          }}
        >
          {/* ── Dashboard Header ───────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
              padding: "24px 32px",
              marginBottom: 32,
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #F1F5F9",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  margin: 0,
                  background:
                    "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Superadmin Dashboard
              </h1>
              <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
                Manage and monitor the subscriptions.
              </span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleExport}
                style={{
                  ...btnOutline,
                  padding: "10px 18px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  color: "#475569",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#F1F5F9";
                  e.target.style.borderColor = "#CBD5E1";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#F8FAFC";
                  e.target.style.borderColor = "#E2E8F0";
                }}
              >
                <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                Export
              </button>

              <button
                onClick={fetchSubscriptions}
                style={{
                  ...btnPrimary,
                  padding: "10px 18px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  background:
                    "linear-gradient(135deg, #2563EB 0%, #0891B2 100%)", // Fin Blue to Sync Teal
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                }}
                onMouseOver={(e) => {
                  e.target.style.opacity = 0.9;
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = 1;
                }}
              >
                <ArrowPathIcon style={{ width: 16, height: 16 }} />
                Refresh Data
              </button>
            </div>
          </div>

          {/* ── KPI Cards ──────────────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/*
             * To hook up real data: remove `isPlaceholder` and pass the value directly.
             * e.g. value={`NPR ${revenue.toLocaleString()}`}
             */}
            <KPICard
              label="Total Revenue"
              value={`NPR ${Number(totalPayments).toLocaleString()}`}
              sub="All-time payments processed"
              accent={B.blue}
              Icon={CurrencyDollarIcon}
              trend="up"
              isPlaceholder={!hasData && totalPayments === 0}
            />
            <KPICard
              label="Active Subscriptions"
              value={activeCount.toLocaleString()}
              sub="Currently active tenants"
              accent={B.teal}
              Icon={UsersIcon}
              trend="up"
              isPlaceholder={!hasData}
            />
            <KPICard
              label="Churn Rate"
              value={`${churnRate}%`}
              sub="Canceled or disabled / total"
              accent="#DC2626"
              Icon={ArrowTrendingDownIcon}
              trend="down"
              isPlaceholder={!hasData}
            />
            <KPICard
              label="Pending Renewals"
              value={pendingCount.toLocaleString()}
              sub="Awaiting activation or payment"
              accent="#D97706"
              Icon={ClockIcon}
              isPlaceholder={!hasData}
            />
          </div>

          {/* ── Table Card ─────────────────────────────────────────────────── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #E2E8F0",
              boxShadow:
                "0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.05)",
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  Subscription Logs
                </h2>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>
                  {filteredLogs.length !== logs.length
                    ? `${filteredLogs.length} of ${logs.length} records match filters`
                    : `${logs.length} total records`}
                </p>
              </div>
            </div>

            {/* Filters row */}
            <div
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid #F1F5F9",
                background: "#FAFAFA",
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
              }}
            >
              {/* Search */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 220px",
                  minWidth: 180,
                }}
              >
                <MagnifyingGlassIcon
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 15,
                    height: 15,
                    color: "#94A3B8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search user, plan, org, role…"
                  className={inputCls}
                  style={{ paddingLeft: 34, width: "100%" }}
                />
              </div>

              {/* Date range */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={inputCls}
                aria-label="Start date"
                style={{ flex: "0 1 160px" }}
              />
              <span
                style={{
                  color: "#CBD5E1",
                  fontWeight: 500,
                  userSelect: "none",
                }}
              >
                –
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={inputCls}
                aria-label="End date"
                style={{ flex: "0 1 160px" }}
              />

              {/* Clear */}
              {(search || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#94A3B8",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    padding: 0,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Table body */}
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "80px 0",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `3px solid #E2E8F0`,
                    borderTopColor: B.teal,
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>Loading logs…</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
                  {error}
                </p>
                <button
                  onClick={fetchSubscriptions}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "#94A3B8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "inherit",
                  }}
                >
                  Try again
                </button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                  No logs match your current filters.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: B.blue,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "inherit",
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        background: "#FAFAFA",
                      }}
                    >
                      {TABLE_COLS.map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: "11px 20px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "#94A3B8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log, idx) => (
                      <tr
                        key={log._id || log.id || idx}
                        className="row-hover"
                        style={{
                          borderBottom: "1px solid #F8FAFC",
                          background: idx % 2 === 0 ? "#fff" : "#FAFCFF",
                          transition: "background 0.1s",
                        }}
                      >
                        <td
                          style={{
                            padding: "13px 20px",
                            whiteSpace: "nowrap",
                            fontFamily: "monospace",
                            fontSize: 11,
                            color: "#94A3B8",
                          }}
                        >
                          {log.timestamp}
                        </td>
                        <td
                          style={{
                            padding: "13px 20px",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0F172A",
                          }}
                        >
                          {log.user}
                        </td>
                        <td
                          style={{ padding: "13px 20px", whiteSpace: "nowrap" }}
                        >
                          <span
                            style={{
                              background: "#F1F5F9",
                              color: "#475569",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {log.role}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 20px",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                            color: "#475569",
                          }}
                        >
                          {log.organization || log.org || (
                            <span
                              style={{ color: "#CBD5E1", fontStyle: "italic" }}
                            >
                              N/A
                            </span>
                          )}
                        </td>
                        <td
                          style={{ padding: "13px 20px", whiteSpace: "nowrap" }}
                        >
                          <span
                            style={{
                              background: B.blueLight,
                              color: B.blue,
                              borderRadius: 6,
                              padding: "3px 9px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {log.plan}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 20px",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                            color: "#475569",
                          }}
                        >
                          {log.type || log.subscriptionType || "signup"}
                        </td>
                        <td
                          style={{ padding: "13px 20px", whiteSpace: "nowrap" }}
                        >
                          <StatusBadge status={log.result || log.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                Showing{" "}
                <span style={{ fontWeight: 700, color: "#475569" }}>
                  {showingStart}–{showingEnd}
                </span>{" "}
                of{" "}
                <span style={{ fontWeight: 700, color: "#475569" }}>
                  {filteredLogs.length}
                </span>{" "}
                records
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    color: "#64748B",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeftIcon style={{ width: 14, height: 14 }} />
                </button>

                {/* First page anchor */}
                {pageWindow[0] > 1 && (
                  <>
                    <button
                      className="page-btn"
                      onClick={() => setCurrentPage(1)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        background: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      1
                    </button>
                    {pageWindow[0] > 2 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#CBD5E1",
                          padding: "0 2px",
                        }}
                      >
                        …
                      </span>
                    )}
                  </>
                )}

                {/* Sliding window */}
                {pageWindow.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border:
                        currentPage === page ? "none" : "1px solid #E2E8F0",
                      background:
                        currentPage === page
                          ? `linear-gradient(135deg, ${B.blue}, ${B.teal})`
                          : "#fff",
                      color: currentPage === page ? "#fff" : "#475569",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow:
                        currentPage === page
                          ? "0 2px 6px rgba(37,99,235,.3)"
                          : "none",
                    }}
                  >
                    {page}
                  </button>
                ))}

                {/* Last page anchor */}
                {pageWindow[pageWindow.length - 1] < totalPages && (
                  <>
                    {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#CBD5E1",
                          padding: "0 2px",
                        }}
                      >
                        …
                      </span>
                    )}
                    <button
                      className="page-btn"
                      onClick={() => setCurrentPage(totalPages)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        background: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #E2E8F0",
                    background: "#fff",
                    color: "#64748B",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  <ChevronRightIcon style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: B.teal,
                  margin: 0,
                }}
              >
                Total processed:{" "}
                <span style={{ fontSize: 13 }}>
                  NPR {Number(totalPayments).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          {/* end table card */}
        </div>
      </div>
    </>
  );
}
