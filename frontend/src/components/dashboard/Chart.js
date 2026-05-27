import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Line, Pie, Scatter } from "react-chartjs-2";
import Plot from "react-plotly.js";
import { downloadChart } from "../../utils/chartUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
);

const CHART_TYPES = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar / Column" },
  { value: "waterfall", label: "Waterfall" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
];

const AXIS_FIELD_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "account", label: "Account" },
  { value: "accountType", label: "Account Type" },
  { value: "amount", label: "Amount" },
  { value: "category", label: "Category" },
];

const AXIS_FIELD_LABELS = AXIS_FIELD_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const CATEGORICAL_AXIS_FIELDS = new Set(["account", "accountType", "category"]);

const CHART_HINTS = {
  line: "Best for tracking trends over time",
  bar: "Best for comparing categories side-by-side",
  waterfall: "Best for showing stepwise gains and losses",
  pie: "Best for quick proportion views (keep slices limited)",
  scatter: "Best for exploring relationships between two fields",
};

const DEFAULT_AXIS_BY_CHART = {
  line: { x: "date", y: "amount" },
  bar: { x: "category", y: "amount" },
  waterfall: { x: "category", y: "amount" },
  pie: { x: "category", y: "amount" },
  scatter: { x: "date", y: "amount" },
};

const DATE_GROUPING_OPTIONS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const PIE_COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#15803d",
  "#047857",
  "#b45309",
  "#be123c",
  "#334155",
  "#0891b2",
];

const FINANCE_COLORS = {
  positive: "#15803d",
  negative: "#b91c1c",
  neutral: "#1d4ed8",
};

/**
 * @typedef {Object} FinanceChartRow
 * @property {string|Date} [Date]
 * @property {string} [Account]
 * @property {string} ["Account Type"]
 * @property {number|string} [Amount]
 * @property {string} [Description]
 * @property {string} [Category]
 */

/**
 * @typedef {Object} FinanceChartFilters
 * @property {string|string[]} [category]
 * @property {string[]} [categories]
 * @property {string|string[]} [account]
 * @property {string[]} [accounts]
 * @property {string|string[]} [accountType]
 * @property {string[]} [accountTypes]
 * @property {string|Date} [fromDate]
 * @property {string|Date} [toDate]
 * @property {string} [search]
 */

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeString(value, fallback = "") {
  return String(value || "").trim() || fallback;
}

function normalizeValues(values) {
  if (!values) return [];
  const rawValues = Array.isArray(values) ? values : [values];
  return rawValues
    .map((value) => normalizeString(value).toLowerCase())
    .filter(Boolean);
}

function formatCurrency(value, locale = "en-NP", currency = "NPR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatBucketLabel(date, mode) {
  if (!date) return "Unknown Date";
  if (mode === "year") return String(date.getFullYear());
  if (mode === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getRawRows(data, rows) {
  if (Array.isArray(data) && data.length > 0) return data;
  if (Array.isArray(rows) && rows.length > 0) return rows;
  if (Array.isArray(data)) return data;
  if (Array.isArray(rows)) return rows;
  return [];
}

function getXAxisOptionsForChartType(chartType) {
  void chartType;
  return AXIS_FIELD_OPTIONS;
}

function getDefaultXAxisForChartType(chartType) {
  return DEFAULT_AXIS_BY_CHART[chartType]?.x || "category";
}

function getDefaultYAxisForChartType(chartType) {
  return DEFAULT_AXIS_BY_CHART[chartType]?.y || "amount";
}

function resolveBucketFromRow(row, xAxisField) {
  if (!row) return null;

  if (xAxisField === "date" || xAxisField === "date_year") {
    const parsedDate =
      row.parsedDate || parseDate(row.Date || row.date || row.transactionDate || row.dateRaw);
    if (!parsedDate) return null;

    const year = parsedDate.getFullYear();
    if (xAxisField === "date_year") {
      return {
        key: String(year),
        label: formatBucketLabel(parsedDate, "year"),
        sortValue: new Date(year, 0, 1).getTime(),
      };
    }

    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    return {
      key: `${year}-${month}`,
      label: formatBucketLabel(parsedDate, "month"),
      sortValue: new Date(year, parsedDate.getMonth(), 1).getTime(),
    };
  }

  if (xAxisField === "account") {
    const label = normalizeString(row.account || row.Account, "Unassigned Account");
    return { key: label, label };
  }

  if (xAxisField === "accountType") {
    const label = normalizeString(row.accountType || row["Account Type"], "Unspecified");
    return { key: label, label };
  }

  if (xAxisField === "amount") {
    const amount = Number(toNumber(row.amount ?? row.Amount).toFixed(2));
    const label = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return { key: String(amount), label, sortValue: amount };
  }

  const label = normalizeString(row.category || row.Category, "Uncategorized");
  return { key: label, label };
}

function transformDataForChart(data, xAxisField, yAxisField, chartType) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const isYearGroupedDate = xAxisField === "date_year";
  const normalizedXAxisField = isYearGroupedDate ? "date" : xAxisField;
  const validXAxisOptions = getXAxisOptionsForChartType(chartType).map((option) => option.value);
  const safeBaseXAxis = validXAxisOptions.includes(normalizedXAxisField)
    ? normalizedXAxisField
    : getDefaultXAxisForChartType(chartType);
  const safeXAxisField = safeBaseXAxis === "date" && isYearGroupedDate ? "date_year" : safeBaseXAxis;
  const safeYAxisField = AXIS_FIELD_OPTIONS.some((option) => option.value === yAxisField)
    ? yAxisField
    : getDefaultYAxisForChartType(chartType);

  const grouped = new Map();

  data.forEach((row) => {
    const bucket = resolveBucketFromRow(row, safeXAxisField);
    if (!bucket) return;

    const amount = toNumber(row.amount ?? row.Amount);
    const existing = grouped.get(bucket.key) || {
      key: bucket.key,
      label: bucket.label,
      sortValue: bucket.sortValue ?? null,
      totalAmount: 0,
      transactionCount: 0,
    };

    existing.totalAmount += amount;
    existing.transactionCount += 1;
    if (bucket.sortValue !== undefined) existing.sortValue = bucket.sortValue;
    grouped.set(bucket.key, existing);
  });

  const output = Array.from(grouped.values()).map((item) => ({
    ...item,
    totalAmount: Number(item.totalAmount.toFixed(2)),
    value: safeYAxisField === "amount" ? Number(item.totalAmount.toFixed(2)) : item.transactionCount,
  }));

  if (safeXAxisField === "date" || safeXAxisField === "date_year" || safeXAxisField === "amount") {
    output.sort((a, b) => (a.sortValue || 0) - (b.sortValue || 0));
  } else {
    output.sort((a, b) => a.label.localeCompare(b.label));
  }

  return output;
}

function getFieldLabelFromRow(row, axisField) {
  if (axisField === "account") {
    return normalizeString(row.account || row.Account, "Unassigned Account");
  }
  if (axisField === "accountType") {
    return normalizeString(row.accountType || row["Account Type"], "Unspecified");
  }
  if (axisField === "category") {
    return normalizeString(row.category || row.Category, "Uncategorized");
  }
  return "";
}

function resolveScatterAxisValue(row, axisField, dateGrouping, categoricalIndexes) {
  if (!row) return null;

  if (axisField === "amount") {
    const amount = toNumber(row.amount ?? row.Amount);
    return Number.isFinite(amount) ? amount : null;
  }

  if (axisField === "date") {
    const parsedDate =
      row.parsedDate || parseDate(row.Date || row.date || row.transactionDate || row.dateRaw);
    if (!parsedDate) return null;
    if (dateGrouping === "year") return new Date(parsedDate.getFullYear(), 0, 1).getTime();
    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1).getTime();
  }

  if (CATEGORICAL_AXIS_FIELDS.has(axisField)) {
    const label = getFieldLabelFromRow(row, axisField);
    if (!label) return null;
    const indexMap = categoricalIndexes[axisField];
    if (!indexMap) return null;
    const indexValue = indexMap.get(label);
    return Number.isInteger(indexValue) ? indexValue : null;
  }

  return null;
}

function rowMatchesFilters(row, normalizedFilters) {
  const {
    categories,
    accounts,
    accountTypes,
    fromDate,
    toDate,
    search,
  } = normalizedFilters;

  if (categories.length && !categories.includes(row.categoryLower)) return false;
  if (accounts.length && !accounts.includes(row.accountLower)) return false;
  if (accountTypes.length && !accountTypes.includes(row.accountTypeLower)) return false;
  if (fromDate && (!row.parsedDate || row.parsedDate < fromDate)) return false;
  if (toDate && (!row.parsedDate || row.parsedDate > toDate)) return false;
  if (search) {
    const haystack = `${row.account} ${row.accountType} ${row.category} ${row.description}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  return true;
}

/**
 * Production-ready dynamic finance chart.
 *
 * @param {{
 *   data?: FinanceChartRow[],
 *   rows?: FinanceChartRow[],
 *   filters?: FinanceChartFilters,
 *   title?: string,
 *   locale?: string,
 *   currency?: string
 * }} props
 */
export default function DynamicChart({
  data = [],
  rows = [],
  filters = {},
  title = "Financial Activity",
  locale = "en-NP",
  currency = "NPR",
}) {
  const chartId = "dynamic-finance-chart";
  const [chartType, setChartType] = useState("bar");
  const [xAxisField, setXAxisField] = useState(getDefaultXAxisForChartType("bar"));
  const [dateGrouping, setDateGrouping] = useState("month");
  const [yAxisField, setYAxisField] = useState(getDefaultYAxisForChartType("bar"));

  const sourceRows = useMemo(() => getRawRows(data, rows), [data, rows]);
  const xAxisOptions = useMemo(() => getXAxisOptionsForChartType(chartType), [chartType]);
  const yAxisOptions = AXIS_FIELD_OPTIONS;
  const shouldShowDateGrouping = xAxisField === "date" || (chartType === "scatter" && yAxisField === "date");

  useEffect(() => {
    const defaultXAxis = getDefaultXAxisForChartType(chartType);
    const defaultYAxis = getDefaultYAxisForChartType(chartType);
    const isValidXAxis = xAxisOptions.some((option) => option.value === xAxisField);
    const isValidYAxis = yAxisOptions.some((option) => option.value === yAxisField);

    if (!isValidXAxis) {
      setXAxisField(defaultXAxis);
    }

    if (!isValidYAxis) {
      setYAxisField(defaultYAxis);
    }
  }, [chartType, xAxisField, xAxisOptions, yAxisField, yAxisOptions]);

  const normalizedTransactions = useMemo(() => {
    if (!Array.isArray(sourceRows)) return [];

    return sourceRows
      .map((entry, index) => {
        const dateRaw = entry.Date || entry.date || entry.transactionDate || "";
        const parsedDate = parseDate(dateRaw);
        const account = normalizeString(entry.Account || entry.account, "Unassigned Account");
        const accountType = normalizeString(
          entry["Account Type"] || entry.accountType,
          "Unspecified",
        );
        const category = normalizeString(entry.Category || entry.category, "Uncategorized");
        const description = normalizeString(entry.Description || entry.description, "No Description");
        const amount = toNumber(entry.Amount ?? entry.amount);

        const hasAnyValue =
          Boolean(dateRaw) ||
          Boolean(account) ||
          Boolean(accountType) ||
          Boolean(category) ||
          Boolean(description) ||
          amount !== 0;

        if (!hasAnyValue) return null;

        return {
          id: entry.id || entry.__recordId || index,
          dateRaw,
          parsedDate,
          account,
          accountLower: account.toLowerCase(),
          accountType,
          accountTypeLower: accountType.toLowerCase(),
          amount,
          description,
          category,
          categoryLower: category.toLowerCase(),
        };
      })
      .filter(Boolean);
  }, [sourceRows]);

  const normalizedFilters = useMemo(() => {
    const fromDateRaw = parseDate(filters.fromDate);
    const toDateRaw = parseDate(filters.toDate);
    const fromDate = fromDateRaw
      ? new Date(
          fromDateRaw.getFullYear(),
          fromDateRaw.getMonth(),
          fromDateRaw.getDate(),
          0,
          0,
          0,
          0,
        )
      : null;
    const toDate = toDateRaw
      ? new Date(
          toDateRaw.getFullYear(),
          toDateRaw.getMonth(),
          toDateRaw.getDate(),
          23,
          59,
          59,
          999,
        )
      : null;
    const normalizedSearch = normalizeString(filters.search).toLowerCase();

    return {
      categories: normalizeValues(filters.categories || filters.category),
      accounts: normalizeValues(filters.accounts || filters.account),
      accountTypes: normalizeValues(filters.accountTypes || filters.accountType),
      fromDate,
      toDate,
      search: normalizedSearch,
    };
  }, [filters]);

  const filteredTransactions = useMemo(
    () => normalizedTransactions.filter((row) => rowMatchesFilters(row, normalizedFilters)),
    [normalizedTransactions, normalizedFilters],
  );

  const xAxisFieldForTransform = useMemo(() => {
    if (xAxisField !== "date") return xAxisField;
    return dateGrouping === "year" ? "date_year" : "date";
  }, [dateGrouping, xAxisField]);

  const groupedData = useMemo(() => {
    return transformDataForChart(filteredTransactions, xAxisFieldForTransform, yAxisField, chartType);
  }, [chartType, filteredTransactions, xAxisFieldForTransform, yAxisField]);

  const labels = useMemo(() => groupedData.map((item) => item.label), [groupedData]);
  const yValues = useMemo(() => groupedData.map((item) => item.value), [groupedData]);

  const datasetLabel = useMemo(
    () =>
      yAxisField === "amount"
        ? "Total Amount"
        : `Transaction Count (by ${AXIS_FIELD_LABELS[yAxisField] || "Selected Field"})`,
    [yAxisField],
  );

  const usesCurrency = yAxisField === "amount";

  const barColors = useMemo(() => {
    if (!usesCurrency) {
      return yValues.map(() => "rgba(29, 78, 216, 0.82)");
    }
    return yValues.map((value) => {
      if (value > 0) return "rgba(21, 128, 61, 0.85)";
      if (value < 0) return "rgba(185, 28, 28, 0.82)";
      return "rgba(71, 85, 105, 0.6)";
    });
  }, [usesCurrency, yValues]);

  const isLineChart = chartType === "line";

  const baseChartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: yValues,
          borderColor: isLineChart ? FINANCE_COLORS.neutral : FINANCE_COLORS.positive,
          backgroundColor:
            isLineChart
              ? "rgba(29, 78, 216, 0.15)"
              : chartType === "bar"
                ? barColors
                : "rgba(29, 78, 216, 0.82)",
          borderWidth: 2,
          borderRadius: chartType === "bar" ? 8 : 0,
          borderSkipped: chartType === "bar" ? false : undefined,
          pointRadius: isLineChart ? 3 : 0,
          pointHoverRadius: isLineChart ? 4 : 0,
          tension: 0.25,
          fill: false,
        },
      ],
    }),
    [barColors, chartType, datasetLabel, isLineChart, labels, yValues],
  );

  const pieChartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: yValues,
          backgroundColor: labels.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]),
          borderColor: "#ffffff",
          borderWidth: 1.5,
        },
      ],
    }),
    [datasetLabel, labels, yValues],
  );

  const scatterCategoricalIndexes = useMemo(() => {
    const output = {};
    [xAxisField, yAxisField].forEach((field) => {
      if (!CATEGORICAL_AXIS_FIELDS.has(field)) return;
      const uniqueLabels = Array.from(
        new Set(
          filteredTransactions
            .map((row) => getFieldLabelFromRow(row, field))
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));
      output[field] = new Map(uniqueLabels.map((label, index) => [label, index]));
    });
    return output;
  }, [filteredTransactions, xAxisField, yAxisField]);

  const scatterCategoricalLabels = useMemo(() => {
    const output = {};
    Object.keys(scatterCategoricalIndexes).forEach((field) => {
      output[field] = Array.from(scatterCategoricalIndexes[field].entries())
        .sort((a, b) => a[1] - b[1])
        .map(([label]) => label);
    });
    return output;
  }, [scatterCategoricalIndexes]);

  const scatterPoints = useMemo(
    () =>
      filteredTransactions
        .map((row) => {
          const xValue = resolveScatterAxisValue(
            row,
            xAxisField,
            dateGrouping,
            scatterCategoricalIndexes,
          );
          const yValue = resolveScatterAxisValue(
            row,
            yAxisField,
            dateGrouping,
            scatterCategoricalIndexes,
          );
          if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) return null;
          return { x: xValue, y: yValue };
        })
        .filter(Boolean),
    [dateGrouping, filteredTransactions, scatterCategoricalIndexes, xAxisField, yAxisField],
  );

  const scatterChartData = useMemo(
    () => ({
      datasets: [
        {
          label: `${AXIS_FIELD_LABELS[yAxisField] || "Y"} vs ${AXIS_FIELD_LABELS[xAxisField] || "X"}`,
          data: scatterPoints,
          backgroundColor: "rgba(29, 78, 216, 0.65)",
          borderColor: "#1d4ed8",
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    }),
    [scatterPoints, xAxisField, yAxisField],
  );

  const waterfallTrace = useMemo(
    () => [
      {
        type: "waterfall",
        measure: labels.map(() => "relative"),
        x: labels,
        y: yValues,
        text: yValues.map((value) =>
          usesCurrency ? formatCurrency(value, locale, currency) : `${value}`,
        ),
        decreasing: { marker: { color: "rgba(185, 28, 28, 0.9)" } },
        increasing: { marker: { color: "rgba(21, 128, 61, 0.88)" } },
      },
    ],
    [currency, labels, locale, usesCurrency, yValues],
  );

  const plotlyLayout = useMemo(
    () => ({
      autosize: true,
      margin: { t: 30, b: 45, l: 45, r: 20 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      font: { color: "#334155", size: 12 },
      xaxis: {
        type: "category",
        tickfont: { color: "#334155" },
      },
      yaxis: {
        tickfont: { color: "#334155" },
      },
      showlegend: true,
      legend: { orientation: "h", y: 1.15, x: 0 },
    }),
    [],
  );

  const tooltipLabel = (context) => {
    const value = context.parsed?.y ?? context.parsed;
    if (usesCurrency) {
      return `${context.label}: ${formatCurrency(value, locale, currency)}`;
    }
    return `${context.label}: ${value}`;
  };

  const commonPlugins = {
    legend: {
      display: true,
      position: "top",
      labels: {
        color: "#1e293b",
        boxWidth: 12,
        boxHeight: 12,
        usePointStyle: true,
        pointStyle: "circle",
        font: { size: 12, weight: "600" },
      },
    },
    tooltip: {
      backgroundColor: "#f8fafc",
      titleColor: "#0f172a",
      bodyColor: "#1e293b",
      borderColor: "#cbd5e1",
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: tooltipLabel,
      },
    },
  };

  const formatScatterAxisValue = (value, axisField) => {
    if (!Number.isFinite(value)) return "";
    if (axisField === "amount") return formatCurrency(value, locale, currency);
    if (axisField === "date") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return formatBucketLabel(date, dateGrouping === "year" ? "year" : "month");
    }
    if (CATEGORICAL_AXIS_FIELDS.has(axisField)) {
      const labelsForField = scatterCategoricalLabels[axisField] || [];
      return labelsForField[Math.round(value)] || "";
    }
    return `${value}`;
  };

  const cartesianOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 220 },
    plugins: commonPlugins,
    scales: {
      x: {
        ticks: {
          color: "#334155",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: { color: "rgba(148, 163, 184, 0.18)" },
      },
      y: {
        ticks: {
          color: "#334155",
          callback: (value) =>
            usesCurrency ? formatCurrency(value, locale, currency) : value,
        },
        grid: { color: "rgba(148, 163, 184, 0.18)" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 220 },
    plugins: commonPlugins,
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 220 },
    plugins: {
      ...commonPlugins,
      tooltip: {
        ...commonPlugins.tooltip,
        callbacks: {
          label: (context) => {
            const xLabel = formatScatterAxisValue(context.parsed?.x, xAxisField);
            const yLabel = formatScatterAxisValue(context.parsed?.y, yAxisField);
            return `X: ${xLabel} | Y: ${yLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        ticks: {
          color: "#334155",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          callback: (value) => formatScatterAxisValue(Number(value), xAxisField),
        },
        grid: { color: "rgba(148, 163, 184, 0.18)" },
      },
      y: {
        type: "linear",
        ticks: {
          color: "#334155",
          callback: (value) => formatScatterAxisValue(Number(value), yAxisField),
        },
        grid: { color: "rgba(148, 163, 184, 0.18)" },
      },
    },
  };

  const handleChartTypeChange = (event) => {
    const nextChartType = event.target.value;
    setChartType(nextChartType);
    setXAxisField(getDefaultXAxisForChartType(nextChartType));
    setYAxisField(getDefaultYAxisForChartType(nextChartType));
  };

  if (!Array.isArray(sourceRows) || sourceRows.length === 0) {
    return (
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          No transaction data available. Pass `data` with Date, Account, Account Type, Amount,
          Description, and Category fields.
        </p>
      </section>
    );
  }

  const hasRenderableData = chartType === "scatter" ? scatterPoints.length > 0 : groupedData.length > 0;

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">Interactive breakdown across time and account dimensions</p>
          <p className="text-xs text-slate-500">{CHART_HINTS[chartType]}</p>
        </div>
        <div className="flex w-full flex-wrap items-start gap-3 sm:w-auto sm:flex-nowrap sm:items-end">
          <label className="block flex-1 sm:w-[230px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Chart Type
            </span>
            <select
              value={chartType}
              onChange={handleChartTypeChange}
              className="h-11 w-full min-w-[150px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {CHART_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block flex-1 sm:w-[230px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              X-Axis
            </span>
            <select
              value={xAxisField}
              onChange={(event) => setXAxisField(event.target.value)}
              className="h-11 w-full min-w-[145px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {xAxisOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {shouldShowDateGrouping && (
            <label className="block flex-1 sm:w-[190px]">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Date Grouping
              </span>
              <select
                value={dateGrouping}
                onChange={(event) => setDateGrouping(event.target.value)}
                className="h-11 w-full min-w-[145px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {DATE_GROUPING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block flex-1 sm:w-[230px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Y-Axis
            </span>
            <select
              value={yAxisField}
              onChange={(event) => setYAxisField(event.target.value)}
              className="h-11 w-full min-w-[145px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {yAxisOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => downloadChart(chartId, `${chartId}.jpg`)}
            aria-label="Download chart"
            title="Download chart"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <div id={chartId} className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        {!hasRenderableData ? (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-600 sm:h-[360px]">
            No records available for the currently selected dashboard filters.
          </div>
        ) : (
          <div className="h-[320px] sm:h-[360px] md:h-[420px]">
            {chartType === "bar" && <Bar data={baseChartData} options={cartesianOptions} />}
            {chartType === "line" && <Line data={baseChartData} options={cartesianOptions} />}
            {chartType === "pie" && <Pie data={pieChartData} options={pieOptions} />}
            {chartType === "scatter" && <Scatter data={scatterChartData} options={scatterOptions} />}
            {chartType === "waterfall" && (
              <Plot
                data={waterfallTrace}
                layout={plotlyLayout}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true, displayModeBar: false }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
