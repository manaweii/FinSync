import ImportModel from "../models/Import.js";
import PredictionMilestone from "../models/PredictionMilestone.js";

const DEFAULT_FORECAST_MONTHS = 6;

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === "") return null;

  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthKeyFromDate = (value) => {
  const date = toDate(value);
  if (!date) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const startOfMonthUtc = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
};

const addMonthsUtc = (date, count) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));

const formatMonthLabel = (monthKey) =>
  startOfMonthUtc(monthKey).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const getCategoryType = (row) =>
  String(row?.Category || row?.category || row?.Type || row?.type || "").toLowerCase();

const getMonthKeyForRow = (row) =>
  monthKeyFromDate(row?.Date || row?.date || row?.Month || row?.month);

const inferRevenue = (row) => {
  const directRevenue =
    toNumber(row?.Revenue) ??
    toNumber(row?.revenue) ??
    toNumber(row?.Sales) ??
    toNumber(row?.sales) ??
    toNumber(row?.Income) ??
    toNumber(row?.income);

  if (directRevenue !== null) return directRevenue;

  const categoryType = getCategoryType(row);
  if (categoryType.includes("revenue") || categoryType.includes("income")) {
    return toNumber(row?.Amount ?? row?.amount ?? row?.Value ?? row?.value) ?? 0;
  }

  const signedAmount = toNumber(row?.Amount ?? row?.amount ?? row?.Value ?? row?.value);
  if (signedAmount !== null && signedAmount > 0) {
    return signedAmount;
  }

  return 0;
};

const inferExpense = (row) => {
  const expenseFields = [
    "Expense",
    "expense",
    "Expenses",
    "expenses",
    "COGS",
    "cogs",
    "Marketing",
    "marketing",
    "Admin",
    "admin",
    "Tax",
    "tax",
  ];

  const directExpense = expenseFields.reduce((sum, key) => sum + (toNumber(row?.[key]) ?? 0), 0);
  if (directExpense > 0) return directExpense;

  const categoryType = getCategoryType(row);
  if (
    categoryType.includes("expense") ||
    categoryType.includes("liability") ||
    categoryType.includes("cost")
  ) {
    return Math.abs(toNumber(row?.Amount ?? row?.amount ?? row?.Value ?? row?.value) ?? 0);
  }

  const signedAmount = toNumber(row?.Amount ?? row?.amount ?? row?.Value ?? row?.value);
  if (signedAmount !== null && signedAmount < 0) {
    return Math.abs(signedAmount);
  }

  return 0;
};

const buildMonthlySeries = (rows) => {
  const monthMap = new Map();

  rows.forEach((row) => {
    const monthKey = getMonthKeyForRow(row);
    if (!monthKey) return;

    const revenue = inferRevenue(row);
    const expenses = inferExpense(row);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { month: monthKey, revenue: 0, expenses: 0 });
    }

    const current = monthMap.get(monthKey);
    current.revenue += revenue;
    current.expenses += expenses;
  });

  return Array.from(monthMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      ...item,
      profit: item.revenue - item.expenses,
      label: formatMonthLabel(item.month),
    }));
};

const linearRegression = (values) => {
  if (!Array.isArray(values) || values.length === 0) return { slope: 0, intercept: 0 };
  if (values.length === 1) return { slope: 0, intercept: values[0] ?? 0 };

  const points = values.map((value, index) => ({ x: index + 1, y: value }));
  const n = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (!denominator) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const forecastSeries = (series, forecastMonths) => {
  if (!series.length) return [];

  const revenueRegression = linearRegression(series.map((item) => item.revenue));
  const expenseRegression = linearRegression(series.map((item) => item.expenses));

  const lastMonth = startOfMonthUtc(series[series.length - 1].month);

  return Array.from({ length: forecastMonths }, (_, index) => {
    const periodIndex = series.length + index + 1;
    const monthDate = addMonthsUtc(lastMonth, index + 1);
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const revenue = Math.max(0, revenueRegression.intercept + revenueRegression.slope * periodIndex);
    const expenses = Math.max(0, expenseRegression.intercept + expenseRegression.slope * periodIndex);

    return {
      month: monthKey,
      label: formatMonthLabel(monthKey),
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      profit: Number((revenue - expenses).toFixed(2)),
    };
  });
};

const buildExtendedForecast = (series, forecastMonths) => {
  if (!series.length) return [];

  const revenueRegression = linearRegression(series.map((item) => item.revenue));
  const expenseRegression = linearRegression(series.map((item) => item.expenses));
  const lastMonth = startOfMonthUtc(series[series.length - 1].month);

  return Array.from({ length: forecastMonths }, (_, index) => {
    const periodIndex = series.length + index + 1;
    const monthDate = addMonthsUtc(lastMonth, index + 1);
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const revenue = Math.max(0, revenueRegression.intercept + revenueRegression.slope * periodIndex);
    const expenses = Math.max(0, expenseRegression.intercept + expenseRegression.slope * periodIndex);

    return {
      month: monthKey,
      label: formatMonthLabel(monthKey),
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      profit: Number((revenue - expenses).toFixed(2)),
    };
  });
};

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const avg = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / values.length;
  return Math.sqrt(variance);
};

const getRowCategory = (row) =>
  String(
    row?.Category ||
      row?.category ||
      row?.Type ||
      row?.type ||
      row?.Region ||
      row?.region ||
      "Uncategorized",
  ).trim();

const getRowDescription = (row, rowIndex) =>
  String(
    row?.Description ||
      row?.description ||
      row?.Details ||
      row?.details ||
      row?.Narration ||
      row?.narration ||
      `Row ${rowIndex + 1}`,
  ).trim();

const getRowDateLabel = (row) => {
  const rawDate = row?.Date || row?.date || row?.TransactionDate || row?.transactionDate;
  const parsed = toDate(rawDate);
  if (!parsed) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

const detectAnomalies = (rows) => {
  const expenseRows = rows
    .map((row, index) => {
      const expense = inferExpense(row);
      if (!(expense > 0)) return null;

      return {
        index,
        expense,
        category: getRowCategory(row),
        description: getRowDescription(row, index),
        dateLabel: getRowDateLabel(row),
      };
    })
    .filter(Boolean);

  if (expenseRows.length < 3) return [];

  const allExpenses = expenseRows.map((item) => item.expense);
  const overallAverage = average(allExpenses);
  const overallDeviation = standardDeviation(allExpenses);

  const categoryGroups = expenseRows.reduce((acc, item) => {
    if (!acc.has(item.category)) acc.set(item.category, []);
    acc.get(item.category).push(item);
    return acc;
  }, new Map());

  const flagged = expenseRows
    .map((item) => {
      const categoryItems = categoryGroups.get(item.category) || [];
      const categoryAverage = average(categoryItems.map((entry) => entry.expense));
      const categoryDeviation = standardDeviation(categoryItems.map((entry) => entry.expense));

      const overallThreshold =
        overallAverage + Math.max(overallDeviation * 1.75, overallAverage * 0.7);
      const categoryThreshold =
        categoryItems.length >= 3
          ? categoryAverage + Math.max(categoryDeviation * 1.5, categoryAverage * 0.5)
          : Number.POSITIVE_INFINITY;

      const exceedsOverall = item.expense > overallThreshold;
      const exceedsCategory = item.expense > categoryThreshold;

      if (!exceedsOverall && !exceedsCategory) return null;

      const severityBase =
        overallDeviation > 0 ? (item.expense - overallAverage) / overallDeviation : 0;
      const severityBoost =
        categoryItems.length >= 3 && categoryDeviation > 0
          ? (item.expense - categoryAverage) / categoryDeviation
          : 0;

      const detailParts = [];
      if (item.dateLabel) detailParts.push(item.dateLabel);
      if (item.category && item.category !== "Uncategorized") detailParts.push(item.category);

      return {
        type: "spending_spike",
        month: item.dateLabel || `row-${item.index + 1}`,
        label: detailParts.length
          ? `${detailParts.join(" • ")} • Row ${item.index + 1}`
          : `Row ${item.index + 1}`,
        message: `Unusual spending recorded for ${item.description}. Amount ${item.expense.toFixed(0)}.`,
        amount: item.expense,
        severity: Math.max(severityBase, severityBoost, 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.severity - a.severity || b.amount - a.amount)
    .map(({ severity, ...item }) => item);

  return flagged;
};

const projectMilestones = (milestones, forecast) => {
  return milestones.map((milestone) => {
    const match = forecast.find((item) => (item[milestone.metric] || 0) >= milestone.targetValue);

    return {
      id: milestone._id,
      title: milestone.title,
      metric: milestone.metric,
      targetValue: milestone.targetValue,
      predictedMonth: match?.month || null,
      predictedLabel: match?.label || null,
      predictedValue: match ? match[milestone.metric] : null,
      reached: Boolean(match),
    };
  });
};

const parseImportedRows = (imports) => {
  const rows = [];

  imports.forEach((entry) => {
    try {
      const parsed = JSON.parse(entry.importedData || "[]");
      if (Array.isArray(parsed)) rows.push(...parsed);
    } catch (error) {
      console.error("Failed to parse imported data for predictions:", entry?._id, error);
    }
  });

  return rows;
};

export const getOrgPredictions = async (req, res) => {
  try {
    const { orgId } = req.params;
    const forecastMonths = Math.max(
      1,
      Math.min(Number(req.query?.months) || DEFAULT_FORECAST_MONTHS, 12),
    );

    if (!orgId) {
      return res.status(400).json({ message: "Organization id is required" });
    }

    const imports = await ImportModel.find({ orgId }).sort({ importedOn: -1 }).lean();
    const rows = parseImportedRows(imports);
    const historical = buildMonthlySeries(rows);
    const anomalies = detectAnomalies(rows);
    const milestones = await PredictionMilestone.find({ orgId }).sort({ createdAt: -1 }).lean();

    if (!historical.length) {
      return res.json({
        historical: [],
        forecast: [],
        milestones,
        milestoneProjections: [],
        insights: {
          anomalies,
        },
        summary: {
          totalMonths: 0,
          forecastMonths,
          latestRevenue: 0,
          latestExpenses: 0,
          latestProfit: 0,
          averageRevenue: 0,
          averageExpenses: 0,
          averageProfit: 0,
          trend: "Not enough data",
        },
      });
    }

    const forecast = forecastSeries(historical, forecastMonths);
    const extendedForecast = buildExtendedForecast(historical, 36);
    const latest = historical[historical.length - 1];
    const averageRevenue =
      historical.reduce((sum, item) => sum + item.revenue, 0) / historical.length;
    const averageExpenses =
      historical.reduce((sum, item) => sum + item.expenses, 0) / historical.length;
    const averageProfit =
      historical.reduce((sum, item) => sum + item.profit, 0) / historical.length;
    const projectedProfit = forecast.length ? forecast[forecast.length - 1].profit : latest.profit;

    let trend = "Stable outlook";
    if (projectedProfit > latest.profit) trend = "Positive growth expected";
    if (projectedProfit < latest.profit) trend = "Profitability may soften";

    const milestoneProjections = projectMilestones(milestones, extendedForecast);

    res.json({
      historical,
      forecast,
      milestones,
      milestoneProjections,
      insights: {
        anomalies,
      },
      summary: {
        totalMonths: historical.length,
        forecastMonths,
        latestRevenue: latest.revenue,
        latestExpenses: latest.expenses,
        latestProfit: latest.profit,
        averageRevenue: Number(averageRevenue.toFixed(2)),
        averageExpenses: Number(averageExpenses.toFixed(2)),
        averageProfit: Number(averageProfit.toFixed(2)),
        trend,
      },
    });
  } catch (error) {
    console.error("getOrgPredictions error:", error);
    res.status(500).json({ message: "Failed to generate predictions" });
  }
};

export const savePredictionMilestone = async (req, res) => {
  try {
    const { orgId, userId, title, metric, targetValue } = req.body;

    if (!orgId || !title || targetValue === undefined || targetValue === null || targetValue === "") {
      return res.status(400).json({ message: "orgId, title, and targetValue are required" });
    }

    const milestone = await PredictionMilestone.create({
      orgId,
      userId: userId || null,
      title,
      metric: metric || "profit",
      targetValue: Number(targetValue),
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error("savePredictionMilestone error:", error);
    res.status(500).json({ message: "Failed to save prediction milestone" });
  }
};
