import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import RecordModel from "../models/Record.js";
import Organization from "../models/Organization.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import UserOrgRelation from "../models/UserOrgRelation.js";
import UserRoleRelation from "../models/UserRoleRelation.js";

const toNumber = (value, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value == null || value === "") return fallback;
  const parsed = Number.parseFloat(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value, fallback = "") =>
  String(value == null ? fallback : value).trim();

const isStrictNumber = (value) => /^-?\d+(\.\d+)?$/.test(toText(value));
const isAlphabetText = (value, { required = false } = {}) => {
  const text = toText(value);
  if (!text) return !required;
  return /^[a-zA-Z\s]+$/.test(text);
};

const normalizeRole = (value) => toText(value).toLowerCase();
const normalizeAccountType = (value) => {
  const normalized = toText(value).toLowerCase();
  if (normalized === "revenue") return "Revenue";
  const accountTypes = {
    income: "Income",
    expense: "Expense",
    asset: "Asset",
    liability: "Liability",
    equity: "Equity",
  };
  return accountTypes[normalized] || toText(value);
};
const normalizeAccountTypeKey = (value) => normalizeAccountType(value).toLowerCase();
const ALLOWED_ACCOUNT_TYPES = new Set([
  "income",
  "revenue",
  "expense",
  "asset",
  "liability",
  "equity",
]);
const MONEY_EPSILON = 0.01;
const DB_QUERY_TIMEOUT_MS = 10000;

const withTimeout = (promise, label, timeoutMs = DB_QUERY_TIMEOUT_MS) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${label} timed out`);
      err.code = "QUERY_TIMEOUT";
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const runDbQuery = (query, label) => {
  if (query && typeof query.maxTimeMS === "function") {
    query.maxTimeMS(DB_QUERY_TIMEOUT_MS);
  }

  return withTimeout(query, label);
};

const getMonthKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getPreviousMonthKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const previousMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return getMonthKey(previousMonth);
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim() || null;
};

const getAuthContext = async (req) => {
  const token = extractToken(req);
  if (!token) {
    return { error: { code: 401, message: "Authorization token missing" } };
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: { code: 401, message: "Invalid or expired token" } };
  }

  const userId = payload?.userId;
  if (!userId) {
    return { error: { code: 401, message: "Invalid token payload" } };
  }

  const user = await runDbQuery(User.findById(userId).lean(), "User lookup");
  if (!user) {
    return { error: { code: 404, message: "User not found" } };
  }

  if (user.status && user.status !== "Active") {
    return { error: { code: 403, message: "User account is inactive" } };
  }

  const orgRelation = await runDbQuery(
    UserOrgRelation.findOne({ userId: user._id }).lean(),
    "User organization lookup",
  );
  if (!orgRelation?.orgId) {
    return { error: { code: 400, message: "Organization context is missing" } };
  }

  const org = await runDbQuery(
    Organization.findById(orgRelation.orgId).lean(),
    "Organization lookup",
  );
  if (!org) {
    return { error: { code: 404, message: "Organization not found" } };
  }

  if (org.status && org.status !== "Active") {
    return { error: { code: 403, message: "Organization is inactive" } };
  }

  const roleRelation = await runDbQuery(
    UserRoleRelation.findOne({ userId: user._id }).lean(),
    "User role lookup",
  );
  const role = roleRelation
    ? await runDbQuery(Role.findById(roleRelation.roleId).lean(), "Role lookup")
    : null;

  return {
    userId: user._id,
    orgId: org._id,
    orgName: org.orgName || org.name || org.Orgname || "",
    roleName: role?.name || "User",
  };
};

const parseTimestamp = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (date) => {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeLineItems = (lineItems = []) =>
  lineItems.map((item) => {
    const qty = toNumber(item?.qty);
    const sellingPriceUnit = toNumber(item?.selling_price_unit);
    const sellingPriceTotal =
      toNumber(item?.selling_price_total) || sellingPriceUnit * qty;
    const costPriceUnit = toNumber(item?.cost_price_unit);
    const costPriceTotal =
      toNumber(item?.cost_price_total) || costPriceUnit * qty;

    return {
      productId: toText(item?.product_id),
      productName: toText(item?.product_name, "Product"),
      category: toText(item?.category, "General"),
      qty,
      sellingPriceUnit,
      sellingPriceTotal,
      costPriceUnit,
      costPriceTotal,
      grossProfitLine: sellingPriceTotal - costPriceTotal,
    };
  });

const normalizeOrderTotals = (payload, normalizedItems) => {
  const subtotalFromRows = normalizedItems.reduce(
    (sum, item) => sum + item.sellingPriceTotal,
    0,
  );
  const subtotal = toNumber(payload?.order_totals?.subtotal, subtotalFromRows);
  const discount = toNumber(payload?.order_totals?.discount, 0);
  const taxVat13pct = toNumber(
    payload?.order_totals?.tax_vat_13pct,
    Math.round((subtotal - discount) * 0.13),
  );
  const grandTotal = toNumber(
    payload?.order_totals?.grand_total,
    subtotal - discount + taxVat13pct,
  );

  return {
    subtotal,
    discount,
    taxVat13pct,
    grandTotal,
  };
};

const buildJournalRows = ({ transactionDate, totals, lineItems, transactionId }) => {
  const rows = [];
  const date = formatDate(transactionDate);

  for (const item of lineItems) {
    if (item.sellingPriceTotal !== 0) {
      rows.push({
        date,
        account: `${item.productName} Sales`,
        accountType: "Income",
        amount: item.sellingPriceTotal,
        category: item.category || "Sales",
        description: `Sale of ${item.productName} (Qty ${item.qty}) - Txn ${transactionId}`,
      });
    }

    if (item.costPriceTotal !== 0) {
      rows.push({
        date,
        account: "Cost of Goods Sold",
        accountType: "Expense",
        amount: item.costPriceTotal,
        category: "COGS",
        description: `COGS for ${item.productName} (Qty ${item.qty}) - Txn ${transactionId}`,
      });

      rows.push({
        date,
        account: `Inventory - ${item.category || "Stock"}`,
        accountType: "Asset",
        amount: -Math.abs(item.costPriceTotal),
        category: "Inventory",
        description: `Inventory reduction for ${item.productName} (Qty ${item.qty}) - Txn ${transactionId}`,
      });
    }
  }

  if (totals.taxVat13pct !== 0) {
    rows.push({
      date,
      account: "VAT Payable",
      accountType: "Liability",
      amount: totals.taxVat13pct,
      category: "Tax",
      description: `VAT liability recorded for transaction ${transactionId}`,
    });
  }

  rows.push({
    date,
    account: "Cash at Bank - eSewa",
    accountType: "Asset",
    amount: totals.grandTotal,
    category: "Cash",
    description: `Cash received via eSewa for transaction ${transactionId}`,
  });

  return rows;
};

const getEntrySpendAmount = (entry = {}) => {
  const accountType = normalizeAccountTypeKey(entry?.accountType);
  if (accountType !== "expense") return 0;
  const amount = toNumber(entry?.amount);
  return amount > 0 ? Math.abs(amount) : 0;
};

const getEntryActualSpendAmount = (entry = {}) => {
  const accountType = normalizeAccountTypeKey(entry?.accountType);
  if (accountType !== "expense") return 0;
  return Math.abs(toNumber(entry?.amount));
};

const getEffectiveBudgetEntry = (budgetHistory = [], monthKey = "") => {
  if (!monthKey) return null;

  return [...budgetHistory]
    .filter((entry) => /^\d{4}-\d{2}$/.test(toText(entry?.effectiveMonth)))
    .sort((a, b) =>
      toText(b?.effectiveMonth).localeCompare(toText(a?.effectiveMonth)),
    )
    .find((entry) => toText(entry?.effectiveMonth) <= monthKey) || null;
};

const getOrganizationMonthlyActualSpend = async (orgName, monthKey) => {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return 0;

  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const monthEnd = new Date(Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth() + 1,
    1,
  ));

  const totals = await runDbQuery(
    RecordModel.aggregate([
      { $match: { orgName } },
      { $unwind: "$journalEntries" },
      {
        $addFields: {
          entryDate: {
            $dateFromString: {
              dateString: "$journalEntries.date",
              onError: "$transactionDate",
              onNull: "$transactionDate",
            },
          },
        },
      },
      {
        $match: {
          "journalEntries.accountType": { $regex: /^Expense$/i },
          entryDate: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: "$journalEntries.amount" } },
        },
      },
    ]),
    "Monthly budget spend lookup",
  );

  return Number(totals[0]?.total || 0);
};

const buildBudgetTracking = async (org, orgName) => {
  const budgetHistory = Array.isArray(org?.budgetHistory) ? org.budgetHistory : [];
  const currentMonth = getMonthKey();
  const previousMonth = getPreviousMonthKey();
  const currentBudgetEntry = getEffectiveBudgetEntry(budgetHistory, currentMonth);
  const previousBudgetEntry = getEffectiveBudgetEntry(budgetHistory, previousMonth);
  const previousActualSpent = await getOrganizationMonthlyActualSpend(
    orgName,
    previousMonth,
  );
  const fallbackBudget = Number(org?.monthlyBudget || 0);
  const currentBudget = Number(currentBudgetEntry?.amount ?? fallbackBudget);
  const previousMonthBudget = Number(previousBudgetEntry?.amount ?? fallbackBudget);
  const hasPreviousMonthBudget = Boolean(previousBudgetEntry || fallbackBudget > 0);

  return {
    currentMonth,
    currentBudget,
    currentBudgetEffectiveMonth: currentBudgetEntry?.effectiveMonth || null,
    previousMonth,
    previousMonthBudget,
    previousMonthBudgetEffectiveMonth: previousBudgetEntry?.effectiveMonth || null,
    previousMonthActualSpent: Number(previousActualSpent || 0),
    previousMonthVariance: Number(previousMonthBudget - previousActualSpent),
    hasPreviousMonthBudget,
  };
};

const getOrganizationFinanceSummary = async (orgName, { excludeRecordId = null } = {}) => {
  const match = { orgName };
  if (excludeRecordId && mongoose.Types.ObjectId.isValid(excludeRecordId)) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeRecordId) };
  }

  const totals = await runDbQuery(
    RecordModel.aggregate([
      { $match: match },
      { $unwind: "$journalEntries" },
      {
        $project: {
          source: { $toLower: { $ifNull: ["$source", ""] } },
          accountType: { $toLower: { $ifNull: ["$journalEntries.accountType", ""] } },
          amount: { $ifNull: ["$journalEntries.amount", 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalInvestment: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$source", "investment"] }, { $eq: ["$accountType", "equity"] }] },
                "$amount",
                0,
              ],
            },
          },
          totalMade: {
            $sum: {
              $cond: [
                { $in: ["$accountType", ["income", "revenue"]] },
                {
                  $cond: [
                    { $gt: ["$amount", 0] },
                    { $abs: "$amount" },
                    { $multiply: [{ $abs: "$amount" }, -1] },
                  ],
                },
                0,
              ],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$accountType", "expense"] }, { $gt: ["$amount", 0] }] },
                { $abs: "$amount" },
                0,
              ],
            },
          },
        },
      },
    ]),
    "Organization finance summary lookup",
  );

  return {
    totalInvestment: Number(totals[0]?.totalInvestment || 0),
    totalMade: Number(totals[0]?.totalMade || 0),
    totalSpent: Number(totals[0]?.totalSpent || 0),
  };
};

const assertSpendingWithinAvailableFunds = async ({
  orgName,
  newEntries = [],
  excludeRecordId = null,
}) => {
  const summary = await getOrganizationFinanceSummary(orgName, { excludeRecordId });
  const newSpent = newEntries.reduce((sum, entry) => sum + getEntrySpendAmount(entry), 0);
  const availableFunds = summary.totalInvestment + summary.totalMade;
  const projectedSpent = summary.totalSpent + newSpent;

  if (projectedSpent - availableFunds > MONEY_EPSILON) {
    return {
      ok: false,
      message: "Spending limit exceeded",
      summary: {
        ...summary,
        availableFunds,
        projectedSpent,
      },
    };
  }

  return {
    ok: true,
    summary: {
      ...summary,
      availableFunds,
      projectedSpent,
    },
  };
};

const requireAdminContext = async (req, res) => {
  const authContext = await getAuthContext(req);
  if (authContext.error) {
    res.status(authContext.error.code).json({ message: authContext.error.message });
    return null;
  }

  if (normalizeRole(authContext.roleName) !== "admin") {
    res.status(403).json({ message: "Organization admin privileges are required" });
    return null;
  }

  return authContext;
};

const getPrimaryEntry = (record = {}) =>
  Array.isArray(record?.journalEntries) ? record.journalEntries[0] || {} : {};

const normalizeRecordAccountTypes = (record = {}) => {
  const entries = Array.isArray(record?.journalEntries) ? record.journalEntries : [];
  return entries.map((entry) => ({
    ...entry,
    accountType: normalizeAccountType(entry?.accountType),
  }));
};

const rebuildRecordForAccounting = (record = {}) => {
  if (
    toText(record?.source).toLowerCase() === "fruitygo" &&
    Array.isArray(record?.lineItems) &&
    record.lineItems.length > 0
  ) {
    return buildJournalRows({
      transactionDate: parseTimestamp(record.transactionDate) || new Date(),
      totals: record.orderTotals || {},
      lineItems: record.lineItems,
      transactionId: record.transactionId,
    });
  }

  const entries = normalizeRecordAccountTypes(record);
  if (entries.length > 0) return entries;

  const legacyEntry = getPrimaryEntry(record);
  if (legacyEntry?.account || record?.account) {
    return [
      {
        date: legacyEntry.date || formatDate(parseTimestamp(record.transactionDate) || new Date()),
        account: legacyEntry.account || record.account,
        accountType: normalizeAccountType(legacyEntry.accountType || record.accountType),
        amount: toNumber(legacyEntry.amount ?? record.amount),
        category: legacyEntry.category || record.category || "General",
        description: legacyEntry.description || record.description || "Migrated accounting row",
      },
    ];
  }

  return entries;
};

export const saveFruityGoRecords = async (req, res) => {
  try {
    const payload = req.body || {};
    const orgName = toText(payload.orgName);
    const transactionId = toText(payload.transactionId);
    const source = toText(payload.source, "fruitygo");
    const schemaVersion = toText(payload.schema_version, "finsync_v2");
    const currency = toText(payload.currency, "NPR");
    const transactionDate = parseTimestamp(payload.timestamp) || new Date();

    if (!orgName) {
      return res.status(400).json({ message: "orgName is required" });
    }
    if (!transactionId) {
      return res.status(400).json({ message: "transactionId is required" });
    }
    if (!Array.isArray(payload.line_items) || payload.line_items.length === 0) {
      return res.status(400).json({ message: "line_items are required" });
    }

    const normalizedItems = normalizeLineItems(payload.line_items);
    const totals = normalizeOrderTotals(payload, normalizedItems);
    const journalEntries = buildJournalRows({
      transactionDate,
      totals,
      lineItems: normalizedItems,
      transactionId,
    });

    if (!journalEntries.length) {
      return res.status(400).json({ message: "No journal rows were generated" });
    }

    const docPayload = {
      orgName,
      source,
      schemaVersion,
      transactionId,
      transactionDate,
      currency,
      importedOn: new Date(),
      orderTotals: totals,
      lineItems: normalizedItems,
      journalEntries,
      metadata: {
        accountingTargets: Array.isArray(payload.accounting_targets)
          ? payload.accounting_targets
          : [],
      },
      notes: "",
    };
    await RecordModel.deleteMany({ orgName, transactionId });
    const created = await RecordModel.create(docPayload);

    return res.status(201).json({
      message: "FruityGo records saved",
      orgName,
      transactionId,
      rowsCreated: created.journalEntries?.length || 0,
      savedAsSingleDocument: true,
      orderTotals: totals,
    });
  } catch (err) {
    console.error("saveFruityGoRecords error:", err);
    return res.status(500).json({ message: "Failed to save FruityGo records" });
  }
};

export const createManualRecord = async (req, res) => {
  try {
    const payload = req.body || {};
    const orgName = toText(payload.orgName);
    const date = toText(payload.date);
    const account = toText(payload.account);
    const accountType = toText(payload.accountType);
    const category = toText(payload.category, "General");
    const description = toText(payload.description);
    const amount = toNumber(payload.amount, NaN);

    if (!orgName) return res.status(400).json({ message: "orgName is required" });
    if (!date || !account || !accountType || !description) {
      return res.status(400).json({ message: "date, account, accountType, and description are required" });
    }
    if (!isStrictNumber(payload.amount) || !Number.isFinite(amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }
    if (!isAlphabetText(account, { required: true })) {
      return res.status(400).json({ message: "account must contain letters and spaces only" });
    }
    if (!isAlphabetText(accountType, { required: true })) {
      return res.status(400).json({ message: "accountType must contain letters and spaces only" });
    }
    if (!ALLOWED_ACCOUNT_TYPES.has(accountType.toLowerCase())) {
      return res.status(400).json({
        message: `accountType must be one of: ${Array.from(ALLOWED_ACCOUNT_TYPES).join(", ")}`,
      });
    }
    if (!isAlphabetText(category, { required: true })) {
      return res.status(400).json({ message: "category must contain letters and spaces only" });
    }

    const transactionDate = parseTimestamp(date) || new Date();
    const transactionId = `MAN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const journalEntries = [
      {
        date: formatDate(transactionDate),
        account,
        accountType: normalizeAccountType(accountType),
        amount,
        category,
        description,
      },
    ];
    const spendingCheck = await assertSpendingWithinAvailableFunds({
      orgName,
      newEntries: journalEntries,
    });

    if (!spendingCheck.ok) {
      return res.status(400).json({
        message: spendingCheck.message,
        financeSummary: spendingCheck.summary,
      });
    }

    const created = await RecordModel.create({
      orgName,
      source: "manual",
      schemaVersion: "finsync_v2",
      transactionId,
      transactionDate,
      currency: "NPR",
      importedOn: new Date(),
      lineItems: [],
      orderTotals: {},
      journalEntries,
      metadata: {
        origin: "records_manual_form",
      },
      notes: "",
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createManualRecord error:", err);
    return res.status(500).json({ message: "Failed to create manual record" });
  }
};

export const updateManualRecord = async (req, res) => {
  try {
    const id = toText(req.params?.id);
    const payload = req.body || {};
    const orgName = toText(payload.orgName);
    const date = toText(payload.date);
    const account = toText(payload.account);
    const accountType = toText(payload.accountType);
    const category = toText(payload.category, "General");
    const description = toText(payload.description);
    const amount = toNumber(payload.amount, NaN);

    if (!id) return res.status(400).json({ message: "record id is required" });
    if (!orgName) return res.status(400).json({ message: "orgName is required" });
    if (!date || !account || !accountType || !description) {
      return res.status(400).json({ message: "date, account, accountType, and description are required" });
    }
    if (!isStrictNumber(payload.amount) || !Number.isFinite(amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }
    if (!isAlphabetText(account, { required: true })) {
      return res.status(400).json({ message: "account must contain letters and spaces only" });
    }
    if (!isAlphabetText(accountType, { required: true })) {
      return res.status(400).json({ message: "accountType must contain letters and spaces only" });
    }
    if (!ALLOWED_ACCOUNT_TYPES.has(accountType.toLowerCase())) {
      return res.status(400).json({
        message: `accountType must be one of: ${Array.from(ALLOWED_ACCOUNT_TYPES).join(", ")}`,
      });
    }
    if (!isAlphabetText(category, { required: true })) {
      return res.status(400).json({ message: "category must contain letters and spaces only" });
    }

    const transactionDate = parseTimestamp(date) || new Date();
    const journalEntries = [
      {
        date: formatDate(transactionDate),
        account,
        accountType: normalizeAccountType(accountType),
        amount,
        category,
        description,
      },
    ];
    const spendingCheck = await assertSpendingWithinAvailableFunds({
      orgName,
      newEntries: journalEntries,
      excludeRecordId: id,
    });

    if (!spendingCheck.ok) {
      return res.status(400).json({
        message: spendingCheck.message,
        financeSummary: spendingCheck.summary,
      });
    }

    const updated = await RecordModel.findOneAndUpdate(
      { _id: id, orgName, source: "manual" },
      {
        $set: {
          transactionDate,
          importedOn: new Date(),
          journalEntries,
        },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Manual record not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("updateManualRecord error:", err);
    return res.status(500).json({ message: "Failed to update manual record" });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const id = toText(req.params?.id);
    if (!id) return res.status(400).json({ message: "record id is required" });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid record id" });
    }

    const authContext = await getAuthContext(req);
    if (authContext.error) {
      return res.status(authContext.error.code).json({ message: authContext.error.message });
    }

    if (normalizeRole(authContext.roleName) !== "admin") {
      return res.status(403).json({ message: "Admin privileges are required to delete records" });
    }

    const requestedOrgName = toText(req.body?.orgName || req.query?.orgName);
    if (requestedOrgName && requestedOrgName !== authContext.orgName) {
      return res.status(403).json({ message: "Cannot delete records outside your organization" });
    }

    const deleted = await RecordModel.findOneAndDelete({
      _id: id,
      orgName: authContext.orgName,
    }).lean();

    if (!deleted) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json({
      message: "Record deleted",
      deletedId: id,
    });
  } catch (err) {
    console.error("deleteRecord error:", err);
    return res.status(500).json({ message: "Failed to delete record" });
  }
};

export const createInvestmentRecord = async (req, res) => {
  try {
    const authContext = await requireAdminContext(req, res);
    if (!authContext) return;

    const payload = req.body || {};
    const amount = toNumber(payload.amount, NaN);
    const dateText = toText(payload.date);
    const cashAccount = toText(payload.cashAccount, "Cash at Bank");
    const equityAccount = toText(payload.equityAccount, "Company Capital");
    const description = toText(payload.description);

    if (!isStrictNumber(payload.amount) || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }
    if (!dateText) return res.status(400).json({ message: "date is required" });
    if (!cashAccount || !equityAccount) {
      return res.status(400).json({ message: "cashAccount and equityAccount are required" });
    }

    const transactionDate = parseTimestamp(dateText) || new Date();
    const transactionId = `INVEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const created = await RecordModel.create({
      orgName: authContext.orgName,
      source: "investment",
      schemaVersion: "finsync_v2",
      transactionId,
      transactionDate,
      currency: "NPR",
      importedOn: new Date(),
      lineItems: [],
      orderTotals: {},
      journalEntries: [
        {
          date: formatDate(transactionDate),
          account: cashAccount,
          accountType: "Asset",
          amount: Math.abs(amount),
          category: "Capital",
          description: `Debit cash for ${description}`,
        },
        {
          date: formatDate(transactionDate),
          account: equityAccount,
          accountType: "Equity",
          amount: Math.abs(amount),
          category: "Capital",
          description: `Credit equity for ${description}`,
        },
      ],
      metadata: {
        origin: "investment_contribution",
        accountingBasis: "double_entry",
        createdByUserId: authContext.userId,
        orgId: authContext.orgId,
      },
      notes: description,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createInvestmentRecord error:", err);
    return res.status(500).json({ message: "Failed to create investment record" });
  }
};

export const recalculateOrganizationRecords = async (req, res) => {
  try {
    const authContext = await requireAdminContext(req, res);
    if (!authContext) return;

    const records = await RecordModel.find({ orgName: authContext.orgName });
    let updatedCount = 0;

    for (const record of records) {
      const journalEntries = rebuildRecordForAccounting(record.toObject());
      record.journalEntries = journalEntries;
      record.schemaVersion = "finsync_v2";
      record.metadata = {
        ...(record.metadata || {}),
        accountingBasis: Array.isArray(journalEntries) && journalEntries.length > 1
          ? "double_entry"
          : "single_entry_row",
        recalculatedAt: new Date(),
        recalculatedByUserId: authContext.userId,
      };
      await record.save();
      updatedCount += 1;
    }

    return res.status(200).json({
      message: "Records recalculated",
      updatedCount,
    });
  } catch (err) {
    console.error("recalculateOrganizationRecords error:", err);
    return res.status(500).json({ message: "Failed to recalculate records" });
  }
};

export const getOrganizationFinanceSetup = async (req, res) => {
  try {
    const authContext = await getAuthContext(req);
    if (authContext.error) {
      return res.status(authContext.error.code).json({ message: authContext.error.message });
    }

    const org = await runDbQuery(
      Organization.findById(authContext.orgId).lean(),
      "Finance setup organization lookup",
    );
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const [investmentSummary, financeSummary, budgetTracking] = await Promise.all([
      runDbQuery(
        RecordModel.aggregate([
          { $match: { orgName: authContext.orgName, source: "investment" } },
          { $unwind: "$journalEntries" },
          { $match: { "journalEntries.accountType": { $regex: /^Equity$/i } } },
          {
            $group: {
              _id: null,
              totalInvestment: { $sum: "$journalEntries.amount" },
              contributionCount: { $sum: 1 },
              latestContributionAt: { $max: "$transactionDate" },
            },
          },
        ]),
        "Investment summary lookup",
      ),
      getOrganizationFinanceSummary(authContext.orgName),
      buildBudgetTracking(org, authContext.orgName),
    ]);
    const investmentTotals = investmentSummary[0] || {};
    const availableFunds = financeSummary.totalInvestment + financeSummary.totalMade;

    return res.status(200).json({
      orgId: authContext.orgId,
      orgName: authContext.orgName,
      monthlyBudget: Number(org.monthlyBudget || 0),
      budgetHistory: Array.isArray(org.budgetHistory) ? org.budgetHistory : [],
      budgetTracking,
      investment: {
        totalInvestment: Number(investmentTotals?.totalInvestment || 0),
        contributionCount: Number(investmentTotals?.contributionCount || 0),
        latestContributionAt: investmentTotals?.latestContributionAt || null,
      },
      totals: {
        totalAmountMade: Number(financeSummary.totalMade || 0),
        totalSpent: Number(financeSummary.totalSpent || 0),
        availableFunds: Number(availableFunds || 0),
        remainingFunds: Number(availableFunds - financeSummary.totalSpent || 0),
      },
    });
  } catch (err) {
    console.error("getOrganizationFinanceSetup error:", err);
    return res.status(500).json({ message: "Failed to load finance setup" });
  }
};

export const saveOrganizationMonthlyBudget = async (req, res) => {
  try {
    const authContext = await requireAdminContext(req, res);
    if (!authContext) return;

    const amount = toNumber(req.body?.amount, NaN);
    const effectiveMonth = toText(req.body?.effectiveMonth);
    const note = toText(req.body?.note);

    if (!isStrictNumber(req.body?.amount) || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "amount must be a non-negative number" });
    }
    if (!/^\d{4}-\d{2}$/.test(effectiveMonth)) {
      return res.status(400).json({ message: "effectiveMonth must use YYYY-MM format" });
    }

    const org = await runDbQuery(
      Organization.findByIdAndUpdate(
        authContext.orgId,
        {
          $set: { monthlyBudget: amount },
          $push: {
            budgetHistory: {
              amount,
              effectiveMonth,
              note,
              setBy: authContext.userId,
              setAt: new Date(),
            },
          },
        },
        { new: true },
      ).lean(),
      "Monthly budget save",
    );

    if (!org) return res.status(404).json({ message: "Organization not found" });

    return res.status(200).json({
      monthlyBudget: Number(org.monthlyBudget || 0),
      budgetHistory: Array.isArray(org.budgetHistory) ? org.budgetHistory : [],
    });
  } catch (err) {
    console.error("saveOrganizationMonthlyBudget error:", err);
    return res.status(500).json({ message: "Failed to save monthly budget" });
  }
};

export const getRecordsByOrgName = async (req, res) => {
  try {
    const orgName = toText(req.query?.orgName);
    if (!orgName) {
      return res.status(400).json({ message: "orgName query is required" });
    }

    const records = await RecordModel.find({ orgName })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    const directRecords = [];
    const legacyFruityGoGroups = new Map();

    for (const record of records) {
      const hasJournalEntries =
        Array.isArray(record?.journalEntries) && record.journalEntries.length > 0;

      const legacyEntry =
        record?.date && record?.account && record?.accountType
          ? {
              date: record.date,
              account: record.account,
              accountType: record.accountType,
              amount: toNumber(record.amount),
              category: toText(record.category, "General"),
              description: toText(record.description, ""),
            }
          : null;

      const isLegacyFruityRow =
        toText(record?.source).toLowerCase() === "fruitygo" &&
        !hasJournalEntries &&
        Boolean(legacyEntry);

      if (!isLegacyFruityRow) {
        if (hasJournalEntries) {
          directRecords.push(record);
        } else if (legacyEntry) {
          directRecords.push({
            ...record,
            journalEntries: [legacyEntry],
          });
        } else {
          directRecords.push({
            ...record,
            journalEntries: [],
          });
        }
        continue;
      }

      const key = toText(record?.transactionId, record?._id?.toString?.() || "");
      const existing = legacyFruityGoGroups.get(key);
      if (!existing) {
        legacyFruityGoGroups.set(key, {
          ...record,
          journalEntries: [legacyEntry],
        });
      } else {
        existing.journalEntries.push(legacyEntry);
      }
    }

    const mergedRecords = [...directRecords, ...Array.from(legacyFruityGoGroups.values())];
    const sortedRecords = mergedRecords.sort((a, b) => {
      const aTime = new Date(a?.transactionDate || a?.importedOn || 0).getTime();
      const bTime = new Date(b?.transactionDate || b?.importedOn || 0).getTime();
      return bTime - aTime;
    });

    return res.status(200).json(sortedRecords);
  } catch (err) {
    console.error("getRecordsByOrgName error:", err);
    return res.status(500).json({ message: "Failed to load records" });
  }
};
