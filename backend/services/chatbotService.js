import ImportModel from "../models/Import.js";

const MAX_IMPORT_DOCS = 12;
const MAX_ROWS_PER_IMPORT = 400;
const MAX_TOTAL_ROWS = 2400;

const SUPPORT_GUIDELINES = [
  "Login: use your registered email/password on /Login.",
  "Reset password: use /reset-password, verify OTP, then set a new password on /NewPassword.",
  "Import data: go to /import, download the template, keep exact columns (Date, Account, Account Type, Amount, Description, Category), then upload.",
  "Records: use /records to review imported rows, filter/search, and add manual entries.",
  "Reports: use /reports for P&L, balance sheet, and cash flow views.",
  "Predictions: use /predictions to view trends and set revenue/profit milestones.",
  "Dashboard: use /dashboard for KPI cards, alerts, and quick snapshots.",
  "User management: /users and /create-user are for managing team members.",
  "Organization management: /organizations and /create-organization are for org setup.",
  "Subscription: use /subscription-detail and /subscription-logs for payment status/history.",
];

// --- HELPER UTILS ---
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

const normalizeType = (value = "") => String(value).trim().toLowerCase();
const normalizeText = (value = "") => String(value || "").trim();

const parseImportedRows = (importDoc) => {
  try {
    const parsed = JSON.parse(importDoc?.importedData || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};

const formatMoney = (value) => Number(value || 0).toFixed(2);

const flattenOrgRows = (imports = []) => {
  const rows = [];
  for (const importDoc of imports) {
    if (rows.length >= MAX_TOTAL_ROWS) break;
    const parsedRows = parseImportedRows(importDoc).slice(0, MAX_ROWS_PER_IMPORT);
    for (const row of parsedRows) {
      if (rows.length >= MAX_TOTAL_ROWS) break;
      rows.push({
        date: normalizeText(row?.Date || row?.date),
        account: normalizeText(row?.Account || row?.account),
        accountType: normalizeType(row?.["Account Type"] || row?.accountType || row?.type),
        amount: toNumber(row?.Amount || row?.amount),
        description: normalizeText(row?.Description || row?.description),
        category: normalizeText(row?.Category || row?.category) || "Uncategorized",
      });
    }
  }
  return rows;
};

const rankEntries = (map, size = 5) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([name, value]) => `${name}: ${formatMoney(value)}`);

// --- FINANCE LOGIC ---
const buildFinanceSummary = (rows = [], imports = []) => {
  const totals = { income: 0, expense: 0, asset: 0, liability: 0, equity: 0 };
  const expenseByCategory = new Map();
  const incomeByCategory = new Map();
  const monthMap = new Map();
  let minDate = null; let maxDate = null;

  rows.forEach((row) => {
    const amount = row.amount;
    const type = row.accountType;
    if (amount === null) return;

    const parsedDate = toDate(row.date);
    if (parsedDate) {
      if (!minDate || parsedDate < minDate) minDate = parsedDate;
      if (!maxDate || parsedDate > maxDate) maxDate = parsedDate;
      const monthKey = getMonthKey(parsedDate);
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { income: 0, expense: 0 });
      const month = monthMap.get(monthKey);
      if (type === "income") month.income += Math.abs(amount);
      if (type === "expense") month.expense += Math.abs(amount);
    }

    if (type === "income") {
      totals.income += Math.abs(amount);
      incomeByCategory.set(row.category, (incomeByCategory.get(row.category) || 0) + Math.abs(amount));
    } else if (type === "expense") {
      totals.expense += Math.abs(amount);
      expenseByCategory.set(row.category, (expenseByCategory.get(row.category) || 0) + Math.abs(amount));
    } else if (type === "asset") totals.asset += Math.abs(amount);
    else if (type === "liability") totals.liability += Math.abs(amount);
    else if (type === "equity") totals.equity += Math.abs(amount);
  });

  const monthlyTrend = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([monthKey, values]) => `${formatMonthLabel(monthKey)} => Net ${formatMoney(values.income - values.expense)}`);

  const latestRows = rows
    .map(row => ({ ...row, pDate: toDate(row.date) }))
    .filter(r => r.pDate).sort((a, b) => b.pDate - a.pDate).slice(0, 5)
    .map(r => `${r.date} | ${r.category} | ${formatMoney(r.amount)}`);

  return {
    totalImports: imports.length,
    totalRows: rows.length,
    dateRange: minDate && maxDate ? `${minDate.toISOString().slice(0, 10)} to ${maxDate.toISOString().slice(0, 10)}` : "unknown",
    totals,
    netCashFlow: totals.income - totals.expense,
    topExpenseCategories: rankEntries(expenseByCategory),
    topIncomeCategories: rankEntries(incomeByCategory),
    monthlyTrend,
    latestRows,
  };
};

const sanitizeHistory = (history = []) => {
  return history
    .filter((item) => item && typeof item.message === "string")
    .slice(-5)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.message.trim().slice(0, 500),
    }));
};

// --- API CALL ---
const callGroq = async ({ systemPrompt, userQuestion, history }) => {
  // FALLBACK: If .env fails, this will still work for testing
  const apiKey = process.env.GROQ_API_KEY; 
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userQuestion }
  ];

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq API Failed");
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Chatbot Engine Error:", error.message);
    throw error;
  }
};

// --- MAIN EXPORT ---
export const answerFinSyncQuestion = async ({ orgId, orgName, roleName, question, history }) => {
  try {
    const imports = await ImportModel.find({ orgId }).sort({ createdAt: -1 }).limit(MAX_IMPORT_DOCS).lean();
    const rows = flattenOrgRows(imports);
    const summary = buildFinanceSummary(rows, imports);

    const systemPrompt = `You are FinSync Assistant.
    Only answer finance or FinSync platform questions.
    Context:
    - Org: ${orgName || "Unknown"}
    - Income: ${formatMoney(summary.totals.income)}
    - Expense: ${formatMoney(summary.totals.expense)}
    - Net Flow: ${formatMoney(summary.netCashFlow)}
    - Top Expenses: ${summary.topExpenseCategories.join(", ")}
    - Recent Data: ${summary.latestRows.join(" || ")}
    - Guide: ${SUPPORT_GUIDELINES.join(" | ")}`;

    const answer = await callGroq({ 
      systemPrompt, 
      userQuestion: question, 
      history: sanitizeHistory(history) 
    });

    return {
      answer,
      meta: { source: "groq", analyzed: summary.totalRows }
    };

  } catch (error) {
    // Basic fallback logic if AI is down
    const imports = await ImportModel.find({ orgId }).limit(1).lean();
    const rows = flattenOrgRows(imports);
    const summary = buildFinanceSummary(rows, imports);

    return {
      answer: "I'm having trouble connecting to my AI brain, but your dashboard shows a Net Cash Flow of " + formatMoney(summary.netCashFlow) + ". Please try again in a second.",
      meta: { source: "fallback", error: error.message }
    };
  }
};