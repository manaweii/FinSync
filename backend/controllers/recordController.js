import RecordModel from "../models/Record.js";

const toNumber = (value, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value == null || value === "") return fallback;
  const parsed = Number.parseFloat(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value, fallback = "") =>
  String(value == null ? fallback : value).trim();

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
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }

    const transactionDate = parseTimestamp(date) || new Date();
    const transactionId = `MAN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
      journalEntries: [
        {
          date: formatDate(transactionDate),
          account,
          accountType,
          amount,
          category,
          description,
        },
      ],
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
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }

    const transactionDate = parseTimestamp(date) || new Date();
    const updated = await RecordModel.findOneAndUpdate(
      { _id: id, orgName, source: "manual" },
      {
        $set: {
          transactionDate,
          importedOn: new Date(),
          journalEntries: [
            {
              date: formatDate(transactionDate),
              account,
              accountType,
              amount,
              category,
              description,
            },
          ],
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
