/**
 * financialData.js — Accounting Engine
 *
 * Architecture decisions:
 * ─────────────────────────────────────────────────────────────
 * 1. SIGN CONVENTION (enforced throughout):
 *    - Income rows:     positive amount  = credit (revenue earned)
 *    - Expense rows:    positive amount  = debit  (cost incurred)
 *                       negative amount  = cost reversal / credit note
 *    - Asset rows:      positive amount  = debit  (asset increases)
 *                       negative amount  = credit (asset decreases / payments made)
 *    - Liability rows:  positive amount  = credit (debt increases)
 *                       negative amount  = debit  (debt repaid)
 *    - Equity rows:     positive amount  = credit (equity increases)
 *                       negative amount  = debit  (drawings / dividends)
 *
 * 2. DOUBLE-ENTRY AWARENESS:
 *    The CSV encodes double-entry as two separate rows per transaction.
 *    The engine processes each row independently but uses account type +
 *    account name to place amounts in the correct statement bucket.
 *    Retained earnings bridge: Net Profit from P&L is added to Equity
 *    in the Balance Sheet so Assets = Liabilities + Equity holds.
 *
 * 3. CASH FLOW METHOD: Modified Direct
 *    Operating: cash account movements not matching investing/financing keywords
 *    Investing:  cash/asset movements matching capex/investment keywords
 *    Financing:  liability/equity cash movements (loans, capital, dividends)
 * ─────────────────────────────────────────────────────────────
 */

// ─── Column header candidates ────────────────────────────────
const DATE_KEYS         = ["date", "transaction date", "posted date", "txn date"];
const ACCOUNT_KEYS      = ["account", "ledger", "account name"];
const ACCOUNT_TYPE_KEYS = ["account type", "accounttype", "type", "account_type"];
const AMOUNT_KEYS       = ["amount", "value", "net amount", "total", "debit/credit"];
const DESCRIPTION_KEYS  = ["description", "desc", "details", "memo", "narration"];
const CATEGORY_KEYS     = ["category", "segment", "class", "sub-category"];

// ─── Keyword taxonomies ───────────────────────────────────────

// P&L expense sub-buckets (tested against: account + category + description)
const COGS_KEYWORDS        = ["cogs", "cost of goods", "cost of sales", "direct cost", "purchase"];
const SALES_MKT_KEYWORDS   = ["marketing", "advertis", "sales expense", "promotion", "ads ", "campaign"];
const ADMIN_KEYWORDS        = ["admin", "administrative", "office", "rent", "utility", "utilities",
                               "electricity", "water", "insurance", "printing", "postage", "telephone"];
const RND_KEYWORDS          = ["rnd", "r&d", "research", "development", "product development"];
const TAX_KEYWORDS          = ["tax", "vat", "gst", "income tax", "withholding"];
const INTEREST_KEYWORDS     = ["interest expense", "bank charge", "finance cost"];
const DEPRECIATION_KEYWORDS = ["depreciation", "amortization", "amortisation"];

// Balance sheet asset classification
const CURRENT_ASSET_KEYWORDS     = ["cash", "bank", "main account", "savings", "cheque",
                                    "receivable", "inventory", "prepaid", "advance", "deposit"];
const NON_CURRENT_ASSET_KEYWORDS = ["equipment", "property", "plant", "vehicle", "furniture",
                                    "machinery", "building", "land", "intangible", "goodwill",
                                    "investment", "capex", "fixed asset"];

// Liability classification
const LONG_TERM_LIABILITY_KEYWORDS = ["loan", "mortgage", "long-term", "long term",
                                      "note payable", "bond", "debenture"];

// Cash flow activity classification
const CASH_ACCOUNT_KEYWORDS = ["cash", "bank", "main account", "savings", "wallet", "cheque", "petty cash"];
const INVESTING_KEYWORDS    = ["equipment", "property", "plant", "vehicle", "investment",
                               "capex", "fixed asset", "machinery", "building"];
const FINANCING_KEYWORDS    = ["loan", "equity", "capital", "owner contribution", "dividend",
                               "financing", "mortgage", "debenture", "bond", "share"];

// Income sub-types
const OTHER_INCOME_KEYWORDS = ["interest income", "gain", "other income", "miscellaneous income",
                               "rental income", "dividend income"];

// ─── Utilities ────────────────────────────────────────────────

function getValueByCandidates(row, candidates) {
  if (!row || typeof row !== "object") return "";
  const entries = Object.entries(row);

  // Exact match first (case-insensitive)
  for (const candidate of candidates) {
    const match = entries.find(([key]) => key.toLowerCase() === candidate);
    if (match) return match[1];
  }
  // Fuzzy includes match second
  for (const candidate of candidates) {
    const match = entries.find(([key]) => key.toLowerCase().includes(candidate));
    if (match) return match[1];
  }
  return "";
}

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[,\s]/g, "");
  const parsed  = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const s = String(value).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD and other ISO-like formats
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatCurrency(value) {
  return `NPR ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)}`;
}

export function formatCurrencyCompact(value) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0)}`;
}

export function formatChartCurrency(value) {
  if (!Number.isFinite(Number(value))) return "NPR 0";
  return `NPR ${Number(value).toLocaleString()}`;
}

export function findDateBounds(rows = []) {
  const dates = rows.map(r => r.parsedDate || parseDateValue(r.date)).filter(Boolean).sort((a,b)=>a-b);
  return { min: dates[0] || null, max: dates[dates.length-1] || null };
}

/**
 * includesKeyword — checks whether any keyword from the list appears
 * in the given text string (case-insensitive substring match).
 */
function includesKeyword(value, keywords) {
  const text = String(value || "").toLowerCase();
  return keywords.some(k => text.includes(k));
}

function isCashAccount(row) {
  return includesKeyword(row.account, CASH_ACCOUNT_KEYWORDS);
}

// ─── Normalization ─────────────────────────────────────────────

/**
 * normalizeAccountType
 *
 * Maps raw account type strings to one of five canonical types:
 * "income" | "expense" | "asset" | "liability" | "equity"
 *
 * Rows with unrecognized types get type "unknown" and are excluded
 * from calculations (surfaced in validation warnings).
 */
function normalizeAccountType(raw) {
  const t = String(raw || "").toLowerCase().trim();
  if (["income", "revenue", "sales"].some(k => t.includes(k))) return "income";
  if (["expense", "cost", "expenditure", "cogs"].some(k => t.includes(k))) return "expense";
  if (["asset", "receivable", "inventory", "cash"].some(k => t.includes(k))) return "asset";
  if (["liability", "payable", "loan", "debt"].some(k => t.includes(k))) return "liability";
  if (["equity", "capital", "owner", "retained"].some(k => t.includes(k))) return "equity";
  return "unknown";
}

/**
 * normalizeTransactionRow
 *
 * Converts a raw CSV row object into a canonical transaction record.
 * Key additions over original:
 *  - normalizedType: validated canonical account type
 *  - label: pre-computed lowercase search string (account + category + description)
 */
export function normalizeTransactionRow(row = {}, meta = {}) {
  const rawDate     = getValueByCandidates(row, DATE_KEYS);
  const account     = String(getValueByCandidates(row, ACCOUNT_KEYS)      || "").trim();
  const accountType = String(getValueByCandidates(row, ACCOUNT_TYPE_KEYS) || "").trim();
  const description = String(getValueByCandidates(row, DESCRIPTION_KEYS)  || "").trim();
  const category    = String(getValueByCandidates(row, CATEGORY_KEYS)     || "").trim();
  const amount      = toNumber(getValueByCandidates(row, AMOUNT_KEYS));
  const parsedDate  = parseDateValue(rawDate);

  const normalizedType = normalizeAccountType(accountType);
  const label = `${account} ${category} ${description}`.toLowerCase();

  return {
    ...row,
    ...meta,
    date: rawDate || "",
    parsedDate,
    account,
    accountType,
    normalizedType,
    amount,
    description,
    category,
    label,       // pre-computed search string for keyword matching
  };
}

export function normalizeTransactionRows(rows = [], metaBuilder) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) =>
    normalizeTransactionRow(row, typeof metaBuilder === "function" ? metaBuilder(row, index) : {})
  );
}

// ─── Filtering ─────────────────────────────────────────────────

export function filterTransactions(rows = [], filters = {}) {
  return rows.filter(row => {
    // Date range filter
    if (filters.from || filters.to) {
      const date = row.parsedDate;
      if (!date) return false;
      const t = date.getTime();

      if (filters.from) {
        const from = parseDateValue(filters.from);
        if (from) { from.setHours(0,0,0,0); if (t < from.getTime()) return false; }
      }
      if (filters.to) {
        const to = parseDateValue(filters.to);
        if (to) { to.setHours(23,59,59,999); if (t > to.getTime()) return false; }
      }
    }

    // Category filter
    if (filters.categories?.length) {
      const label = `${row.category} ${row.account}`.toLowerCase();
      if (!filters.categories.some(c => label.includes(String(c).toLowerCase()))) return false;
    }

    return true;
  });
}

// ─── Validation ────────────────────────────────────────────────

/**
 * validateRows
 *
 * Returns an array of warning objects for data quality issues:
 * - rows with no parsedDate
 * - rows with unknown account type
 * - rows with zero amount
 */
export function validateRows(rows = []) {
  const warnings = [];
  const seenUnknownTypes = new Set();

  rows.forEach((row, i) => {
    if (!row.parsedDate) {
      warnings.push({
        rowIndex: i,
        severity: "warn",
        message: `Row ${i+1}: missing or unparseable date "${row.date}"`,
      });
    }
    if (row.normalizedType === "unknown") {
      const key = row.accountType || "(blank)";
      if (!seenUnknownTypes.has(key)) {
        seenUnknownTypes.add(key);
        warnings.push({
          rowIndex: i,
          severity: "warn",
          message: `Unknown account type "${row.accountType}" — rows with this type are excluded from calculations`,
        });
      }
    }
    if (row.amount === 0) {
      warnings.push({
        rowIndex: i,
        severity: "info",
        message: `Row ${i+1}: zero amount on account "${row.account}"`,
      });
    }
  });

  return warnings;
}

// ─── P&L Statement ────────────────────────────────────────────

/**
 * buildProfitAndLoss
 *
 * Sign rules:
 *  - Income rows: always taken as absolute (revenues are positive)
 *  - Expense rows: positive = cost incurred; negative = reversal (reduces bucket)
 *
 * Expense classification priority (label checked top-to-bottom):
 *   COGS → Sales & Marketing → Admin/Opex → R&D → Depreciation → Interest → Tax → Other Expense
 *
 * EBITDA = Gross Profit - Operating Expenses (before depreciation & interest)
 * EBIT   = EBITDA - Depreciation
 * EBT    = EBIT + Other Income - Interest Expense - Other Expense
 * Net Profit = EBT - Tax
 */
export function buildProfitAndLoss(rows = []) {
  const acc = {
    revenueTotal:      0,
    otherIncomeTotal:  0,
    cogsTotal:         0,
    salesAndMarketing: 0,
    generalAndAdmin:   0,
    rnd:               0,
    depreciationAmort: 0,
    interestExpense:   0,
    tax:               0,
    otherExpense:      0,
  };

  for (const row of rows) {
    const { normalizedType, amount, label } = row;
    if (normalizedType === "unknown") continue;

    if (normalizedType === "income") {
      if (includesKeyword(label, OTHER_INCOME_KEYWORDS)) {
        acc.otherIncomeTotal += Math.abs(amount);
      } else {
        acc.revenueTotal += Math.abs(amount);
      }
      continue;
    }

    if (normalizedType === "expense") {
      // Negative CSV amount on an expense row = reversal
      const effectiveAmt = amount < 0 ? -Math.abs(amount) : Math.abs(amount);

      if      (includesKeyword(label, COGS_KEYWORDS))        acc.cogsTotal         += effectiveAmt;
      else if (includesKeyword(label, SALES_MKT_KEYWORDS))   acc.salesAndMarketing += effectiveAmt;
      else if (includesKeyword(label, ADMIN_KEYWORDS))        acc.generalAndAdmin   += effectiveAmt;
      else if (includesKeyword(label, RND_KEYWORDS))          acc.rnd               += effectiveAmt;
      else if (includesKeyword(label, DEPRECIATION_KEYWORDS)) acc.depreciationAmort += effectiveAmt;
      else if (includesKeyword(label, INTEREST_KEYWORDS))     acc.interestExpense   += effectiveAmt;
      else if (includesKeyword(label, TAX_KEYWORDS))          acc.tax               += effectiveAmt;
      else                                                    acc.otherExpense      += effectiveAmt;
      continue;
    }

    // Non-income-typed rows that represent interest income / gains
    if (normalizedType === "asset" || normalizedType === "liability" || normalizedType === "equity") {
      if (includesKeyword(label, OTHER_INCOME_KEYWORDS)) {
        acc.otherIncomeTotal += amount;
      }
    }
  }

  const grossProfit      = acc.revenueTotal - acc.cogsTotal;
  const opex             = acc.salesAndMarketing + acc.generalAndAdmin + acc.rnd;
  const ebitda           = grossProfit - opex;
  const ebit             = ebitda - acc.depreciationAmort;
  const ebt              = ebit + acc.otherIncomeTotal - acc.interestExpense - acc.otherExpense;
  const netProfit        = ebt - acc.tax;

  return {
    ...acc,
    grossProfit,
    opex,
    ebitda,
    operatingProfit: ebit,   // alias for backward compat with existing UI
    profitBeforeTax: ebt,
    netProfit,
  };
}

// ─── Balance Sheet ─────────────────────────────────────────────

/**
 * buildBalanceSheet
 *
 * Fundamental equation: Assets = Liabilities + Equity
 *
 * RETAINED EARNINGS BRIDGE:
 * Net profit computed from P&L is added as Retained Earnings under Equity.
 * This is necessary because income/expense rows don't appear in equity rows —
 * without this bridge the balance sheet will always be off by net profit.
 *
 * Asset classification priority:
 *   current keywords → non-current keywords → fallback by sign
 *
 * Liability classification:
 *   long-term keywords → else current
 */
export function buildBalanceSheet(rows = []) {
  // Compute retained earnings from P&L first
  const { netProfit } = buildProfitAndLoss(rows);

  const bs = {
    currentAssets:       0,
    nonCurrentAssets:    0,
    currentLiabilities:  0,
    longTermLiabilities: 0,
    paidInCapital:       0,
    retainedEarnings:    netProfit,
  };

  for (const row of rows) {
    const { normalizedType, amount, label } = row;
    if (normalizedType === "unknown") continue;

    if (normalizedType === "asset") {
      if      (includesKeyword(label, CURRENT_ASSET_KEYWORDS))     bs.currentAssets    += amount;
      else if (includesKeyword(label, NON_CURRENT_ASSET_KEYWORDS))  bs.nonCurrentAssets += amount;
      else if (amount >= 0)                                          bs.currentAssets    += amount;
      else                                                           bs.nonCurrentAssets += amount;
      continue;
    }

    if (normalizedType === "liability") {
      if (includesKeyword(label, LONG_TERM_LIABILITY_KEYWORDS)) bs.longTermLiabilities += amount;
      else                                                       bs.currentLiabilities  += amount;
      continue;
    }

    if (normalizedType === "equity") {
      bs.paidInCapital += amount;
    }
  }

  const totalAssets      = bs.currentAssets + bs.nonCurrentAssets;
  const totalLiabilities = bs.currentLiabilities + bs.longTermLiabilities;
  const totalEquity      = bs.paidInCapital + bs.retainedEarnings;
  const workingCapital   = bs.currentAssets - bs.currentLiabilities;
  const balanceDiff      = totalAssets - (totalLiabilities + totalEquity);

  return {
    ...bs,
    totalAssets,
    totalLiabilities,
    totalEquity,
    workingCapital,
    balanceDiff,
    isBalanced: Math.abs(balanceDiff) < 0.01,
  };
}

// ─── Cash Flow Statement ───────────────────────────────────────

/**
 * buildCashFlow — Modified Direct Method
 *
 * Only cash/bank account rows drive the statement (isCashAccount check).
 * Activity classification for cash rows:
 *   INVESTING:  matches capex / fixed asset / investment keywords
 *   FINANCING:  matches loan / equity / capital keywords
 *   OPERATING:  everything else (default)
 *
 * Positive = cash inflow, Negative = cash outflow (from asset amount sign).
 */
export function buildCashFlow(rows = []) {
  const cf = { operating: 0, investing: 0, financing: 0 };

  for (const row of rows) {
    const { normalizedType, amount, label } = row;
    if (normalizedType === "unknown") continue;

    if (normalizedType === "asset" && isCashAccount(row)) {
      if      (includesKeyword(label, INVESTING_KEYWORDS))  cf.investing  += amount;
      else if (includesKeyword(label, FINANCING_KEYWORDS))  cf.financing  += amount;
      else                                                   cf.operating  += amount;
      continue;
    }

    // Liability movements that represent direct financing cash flows
    if (normalizedType === "liability" && includesKeyword(label, FINANCING_KEYWORDS)) {
      cf.financing += amount;
      continue;
    }

    // Non-cash-account asset rows matching investing (e.g. equipment not via bank)
    if (normalizedType === "asset" && includesKeyword(label, INVESTING_KEYWORDS)) {
      cf.investing += amount;
    }
  }

  const netChange  = cf.operating + cf.investing + cf.financing;
  const endingCash = netChange; // beginning cash assumed 0 (no prior period data)

  return { ...cf, netChange, endingCash };
}

// ─── Dashboard & Chart Helpers ─────────────────────────────────

export function buildDashboardMetrics(rows = []) {
  return rows.reduce(
    (acc, row) => {
      const { normalizedType, amount } = row;
      if (normalizedType === "income")                       acc.revenue  += Math.abs(amount);
      if (normalizedType === "expense")                      acc.expenses += Math.abs(amount);
      if (normalizedType === "asset" && isCashAccount(row)) acc.cashFlow += amount;
      return acc;
    },
    { revenue: 0, expenses: 0, cashFlow: 0 }
  );
}

export function buildTrendData(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    const date = row.parsedDate;
    if (!date) continue;

    const key  = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
    const name = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    if (!grouped.has(key)) grouped.set(key, { key, name, Revenue: 0, Expenses: 0 });

    const cur = grouped.get(key);
    if (row.normalizedType === "income")  cur.Revenue  += Math.abs(row.amount);
    if (row.normalizedType === "expense") cur.Expenses += Math.abs(row.amount);
  }

  return Array.from(grouped.values()).sort((a,b) => a.key.localeCompare(b.key));
}

export function buildExpenseBreakdown(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    if (row.normalizedType !== "expense") continue;
    const label = row.account || row.category || row.description || "Uncategorized";
    grouped.set(label, (grouped.get(label) || 0) + Math.abs(row.amount));
  }

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);
}

export function buildCategoryRevenueData(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    if (row.normalizedType !== "income") continue;
    const label = row.category || row.account || "Other";
    grouped.set(label, (grouped.get(label) || 0) + Math.abs(row.amount));
  }

  return Array.from(grouped.entries())
    .map(([name, Revenue]) => ({ name, Revenue }))
    .sort((a,b) => b.Revenue - a.Revenue);
}

// ─── Chart of Accounts ────────────────────────────────────────

/**
 * buildChartOfAccounts
 *
 * Returns deduplicated list of all accounts found in the dataset,
 * enriched with classified type and sub-bucket.
 * Useful for CoA view, debugging, and audit trails.
 */
export function buildChartOfAccounts(rows = []) {
  const coaMap = new Map();

  for (const row of rows) {
    if (!row.account || coaMap.has(row.account)) continue;

    const { label, normalizedType } = row;
    let subBucket = "Other";

    if (normalizedType === "income") {
      subBucket = includesKeyword(label, OTHER_INCOME_KEYWORDS) ? "Other Income" : "Operating Revenue";
    } else if (normalizedType === "expense") {
      if      (includesKeyword(label, COGS_KEYWORDS))        subBucket = "Cost of Goods Sold";
      else if (includesKeyword(label, SALES_MKT_KEYWORDS))   subBucket = "Sales & Marketing";
      else if (includesKeyword(label, ADMIN_KEYWORDS))        subBucket = "General & Admin";
      else if (includesKeyword(label, RND_KEYWORDS))          subBucket = "R&D";
      else if (includesKeyword(label, DEPRECIATION_KEYWORDS)) subBucket = "Depreciation";
      else if (includesKeyword(label, INTEREST_KEYWORDS))     subBucket = "Interest Expense";
      else if (includesKeyword(label, TAX_KEYWORDS))          subBucket = "Tax";
      else                                                    subBucket = "Other Expense";
    } else if (normalizedType === "asset") {
      if      (includesKeyword(label, CURRENT_ASSET_KEYWORDS))     subBucket = "Current Asset";
      else if (includesKeyword(label, NON_CURRENT_ASSET_KEYWORDS))  subBucket = "Non-Current Asset";
      else                                                           subBucket = "Asset (Unclassified)";
    } else if (normalizedType === "liability") {
      subBucket = includesKeyword(label, LONG_TERM_LIABILITY_KEYWORDS) ? "Long-Term Liability" : "Current Liability";
    } else if (normalizedType === "equity") {
      subBucket = "Equity";
    }

    coaMap.set(row.account, { account: row.account, type: normalizedType, subBucket });
  }

  return Array.from(coaMap.values()).sort((a,b) => {
    const order = { income:1, expense:2, asset:3, liability:4, equity:5, unknown:6 };
    return (order[a.type]||6) - (order[b.type]||6) || a.account.localeCompare(b.account);
  });
}
