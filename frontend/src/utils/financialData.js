const DATE_KEYS = ["date", "transaction date", "posted date"];
const ACCOUNT_KEYS = ["account", "ledger", "account name"];
const ACCOUNT_TYPE_KEYS = ["account type", "accounttype", "type"];
const AMOUNT_KEYS = ["amount", "value", "net amount", "total"];
const DESCRIPTION_KEYS = ["description", "desc", "details", "memo"];
const CATEGORY_KEYS = ["category", "segment", "class"];
const REGION_KEYS = ["region", "location", "branch"];

const CURRENT_ASSET_KEYWORDS = ["cash", "bank", "main account", "savings", "receivable", "inventory", "prepaid"];
const NON_CURRENT_ASSET_KEYWORDS = ["equipment", "property", "plant", "vehicle", "furniture", "investment"];
const LONG_TERM_LIABILITY_KEYWORDS = ["loan", "mortgage", "long-term", "long term", "note payable"];
const CASH_ACCOUNT_KEYWORDS = ["cash", "bank", "main account", "savings", "wallet", "cheque"];
const INVESTING_KEYWORDS = ["equipment", "property", "plant", "vehicle", "investment", "capex", "fixed asset"];
const FINANCING_KEYWORDS = ["loan", "equity", "capital", "owner contribution", "dividend", "financing"];

function getValueByCandidates(row, candidates) {
  if (!row || typeof row !== "object") return "";
  const entries = Object.entries(row);

  for (const candidate of candidates) {
    const directMatch = entries.find(([key]) => key.toLowerCase() === candidate);
    if (directMatch) return directMatch[1];
  }

  for (const candidate of candidates) {
    const fuzzyMatch = entries.find(([key]) => key.toLowerCase().includes(candidate));
    if (fuzzyMatch) return fuzzyMatch[1];
  }

  return "";
}

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value).replace(/[,\s]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDateValue(value) {
  if (!value) return null;
  
  // If it's already a valid Date object
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const strValue = String(value).trim();

  // Explicitly check for DD/MM/YYYY or DD-MM-YYYY format
  const ddMmYyyyMatch = strValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    // Rearrange to standard ISO format (YYYY-MM-DD) so JS parses it perfectly
    const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  // Fallback for YYYY-MM-DD and standard string formats
  const parsed = new Date(strValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCurrencyCompact(value) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0)}`;
}

export function formatCurrency(value) {
  return `NPR ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)}`;
}

export function formatChartCurrency(value) {
  if (!Number.isFinite(Number(value))) return "NPR 0";
  return `NPR ${Number(value).toLocaleString()}`;
}

export function findDateBounds(rows = []) {
  const dates = rows
    .map((row) => parseDateValue(row?.date))
    .filter(Boolean)
    .sort((a, b) => a - b);

  return {
    min: dates[0] || null,
    max: dates[dates.length - 1] || null,
  };
}

export function normalizeTransactionRow(row = {}, meta = {}) {
  const rawDate = getValueByCandidates(row, DATE_KEYS);
  const account = String(getValueByCandidates(row, ACCOUNT_KEYS) || "").trim();
  const accountType = String(getValueByCandidates(row, ACCOUNT_TYPE_KEYS) || "").trim();
  const description = String(getValueByCandidates(row, DESCRIPTION_KEYS) || "").trim();
  const category = String(getValueByCandidates(row, CATEGORY_KEYS) || "").trim();
  const region = String(getValueByCandidates(row, REGION_KEYS) || "").trim();
  const amount = toNumber(getValueByCandidates(row, AMOUNT_KEYS));
  const parsedDate = parseDateValue(rawDate);

  return {
    ...row,
    ...meta,
    date: rawDate || "",
    parsedDate,
    account,
    accountType,
    amount,
    description,
    category,
    region,
  };
}

export function normalizeTransactionRows(rows = [], metaBuilder) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row, index) =>
    normalizeTransactionRow(row, typeof metaBuilder === "function" ? metaBuilder(row, index) : {}),
  );
}

function includesKeyword(value, keywords) {
  const text = String(value || "").toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

function isCashAccount(row) {
  return includesKeyword(row.account, CASH_ACCOUNT_KEYWORDS);
}

function getAccountLabel(row) {
  return row.account || row.category || row.description || "Uncategorized";
}

function getCategoryLabel(row) {
  return row.category || row.account || row.region || "Other";
}

export function filterTransactions(rows = [], filters = {}) {
  return rows.filter((row) => {
    // DATE FILTERING 
    if (filters.from || filters.to) {
      const date = row.parsedDate || parseDateValue(row.date);
      if (!date) return false; // Exclude if row date is completely invalid
      
      const rowTime = date.getTime();

      if (filters.from) {
        const fromDate = parseDateValue(filters.from);
        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0); // Start of the day
          if (rowTime < fromDate.getTime()) return false;
        }
      }
      
      if (filters.to) {
        const toDate = parseDateValue(filters.to);
        if (toDate) {
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (rowTime > toDate.getTime()) return false;
        }
      }
    }

    // CATEGORY FILTERING 
    if (filters.categories?.length) {
      const label = `${row.category} ${row.account}`.toLowerCase();
      const match = filters.categories.some((item) => label.includes(String(item).toLowerCase()));
      if (!match) return false;
    }

    // REGION FILTERING 
    if (filters.regions?.length) {
      const label = String(row.region || "").toLowerCase();
      const match = filters.regions.some((item) => label.includes(String(item).toLowerCase()));
      if (!match) return false;
    }

    return true;
  });
}

export function buildDashboardMetrics(rows = []) {
  return rows.reduce(
    (acc, row) => {
      const type = row.accountType.toLowerCase();
      const amount = row.amount;

      if (type === "income") acc.revenue += Math.abs(amount);
      if (type === "expense") acc.expenses += Math.abs(amount);
      if (type === "asset" && isCashAccount(row)) acc.cashFlow += amount;

      return acc;
    },
    {
      revenue: 0,
      expenses: 0,
      cashFlow: 0,
    },
  );
}

export function buildTrendData(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    const date = row.parsedDate;
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        Revenue: 0,
        Expenses: 0,
      });
    }

    const current = grouped.get(key);
    if (row.accountType.toLowerCase() === "income") current.Revenue += Math.abs(row.amount);
    if (row.accountType.toLowerCase() === "expense") current.Expenses += Math.abs(row.amount);
  });

  return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function buildExpenseBreakdown(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    if (row.accountType.toLowerCase() !== "expense") return;
    const label = getAccountLabel(row);
    grouped.set(label, (grouped.get(label) || 0) + Math.abs(row.amount));
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildCategoryRevenueData(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    if (row.accountType.toLowerCase() !== "income") return;
    const label = getCategoryLabel(row);
    grouped.set(label, (grouped.get(label) || 0) + Math.abs(row.amount));
  });

  return Array.from(grouped.entries())
    .map(([name, Revenue]) => ({ name, Revenue }))
    .sort((a, b) => b.Revenue - a.Revenue);
}

export function buildProfitAndLoss(rows = []) {
  const summary = rows.reduce(
    (acc, row) => {
      const type = row.accountType.toLowerCase();
      const amount = Math.abs(row.amount);
      const label = `${row.account} ${row.category} ${row.description}`.toLowerCase();

      if (type === "income") {
        acc.revenueTotal += amount;
      } else if (type === "expense") {
        if (includesKeyword(label, ["cogs", "cost of goods"])) acc.cogsTotal += amount;
        else if (includesKeyword(label, ["marketing", "advert", "sales"])) acc.salesAndMarketing += amount;
        else if (includesKeyword(label, ["admin", "administrative", "office", "rent", "utility"])) acc.generalAndAdmin += amount;
        else if (includesKeyword(label, ["rnd", "research", "development", "product"])) acc.rnd += amount;
        else if (includesKeyword(label, ["tax", "vat"])) acc.tax += amount;
        else acc.otherIncome -= amount;
      } else if (type === "asset" || type === "liability" || type === "equity") {
        if (includesKeyword(label, ["interest", "gain"])) acc.otherIncome += row.amount;
      }

      return acc;
    },
    {
      revenueTotal: 0,
      cogsTotal: 0,
      salesAndMarketing: 0,
      generalAndAdmin: 0,
      rnd: 0,
      otherIncome: 0,
      tax: 0,
    },
  );

  const grossProfit = summary.revenueTotal - summary.cogsTotal;
  const operatingProfit =
    grossProfit - summary.salesAndMarketing - summary.generalAndAdmin - summary.rnd;
  const profitBeforeTax = operatingProfit + summary.otherIncome;
  const netProfit = profitBeforeTax - summary.tax;

  return {
    ...summary,
    grossProfit,
    operatingProfit,
    profitBeforeTax,
    netProfit,
  };
}

export function buildBalanceSheet(rows = []) {
  const summary = rows.reduce(
    (acc, row) => {
      const type = row.accountType.toLowerCase();
      const amount = row.amount;
      const label = `${row.account} ${row.category}`.toLowerCase();

      if (type === "asset") {
        if (includesKeyword(label, CURRENT_ASSET_KEYWORDS)) acc.currentAssets += amount;
        else if (includesKeyword(label, NON_CURRENT_ASSET_KEYWORDS)) acc.nonCurrentAssets += amount;
        else if (amount >= 0) acc.currentAssets += amount;
        else acc.nonCurrentAssets += amount;
      }

      if (type === "liability") {
        if (includesKeyword(label, LONG_TERM_LIABILITY_KEYWORDS)) acc.longTermLiabilities += amount;
        else acc.currentLiabilities += amount;
      }

      if (type === "equity") acc.totalEquity += amount;

      return acc;
    },
    {
      currentAssets: 0,
      nonCurrentAssets: 0,
      currentLiabilities: 0,
      longTermLiabilities: 0,
      totalEquity: 0,
    },
  );

  const totalAssets = summary.currentAssets + summary.nonCurrentAssets;
  const totalLiabilities = summary.currentLiabilities + summary.longTermLiabilities;
  const derivedEquity = totalAssets - totalLiabilities;
  const totalEquity = summary.totalEquity || derivedEquity;

  return {
    ...summary,
    totalAssets,
    totalLiabilities,
    totalEquity,
    workingCapital: summary.currentAssets - summary.currentLiabilities,
    balanceDiff: totalAssets - (totalLiabilities + totalEquity),
  };
}

export function buildCashFlow(rows = []) {
  const summary = rows.reduce(
    (acc, row) => {
      const type = row.accountType.toLowerCase();
      const label = `${row.account} ${row.category} ${row.description}`.toLowerCase();

      if (type === "asset" && isCashAccount(row)) {
        if (includesKeyword(label, INVESTING_KEYWORDS)) acc.investing += row.amount;
        else if (includesKeyword(label, FINANCING_KEYWORDS)) acc.financing += row.amount;
        else acc.operating += row.amount;
      } else if (type === "liability" || type === "equity") {
        if (includesKeyword(label, FINANCING_KEYWORDS)) acc.financing += row.amount;
      } else if (type === "asset" && includesKeyword(label, INVESTING_KEYWORDS)) {
        acc.investing += row.amount;
      }

      return acc;
    },
    {
      operating: 0,
      investing: 0,
      financing: 0,
    },
  );

  const netChange = summary.operating + summary.investing + summary.financing;

  return {
    ...summary,
    netChange,
    endingCash: netChange,
  };
}
