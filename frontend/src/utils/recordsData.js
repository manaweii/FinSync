import { normalizeTransactionRows } from "./financialData";

export const RECORDS_VISIBLE_COLUMNS = [
  "__fileName",
  "__fileType",
  "orgName",
  "transactionId",
  "__importedOn",
  "date",
  "account",
  "accountType",
  "amount",
  "category",
  "description",
];

function toDateInputString(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function getSourceLabel(record = {}) {
  const source = String(record?.source || "").toLowerCase();
  if (source === "import") return "Import";
  if (source === "manual") return "Manual";
  if (source === "investment") return "Investment";
  if (source === "fruitygo") return "FruityGo";
  return record?.source || "Record";
}

function getFileName(record = {}) {
  const source = String(record?.source || "").toLowerCase();
  if (source === "import") {
    return record?.metadata?.fileName || "Imported File";
  }
  if (source === "manual") {
    return "Manual Record";
  }
  if (source === "investment") {
    return "Investment";
  }
  if (source === "fruitygo") {
    return record?.transactionId
      ? `FruityGo ${record.transactionId}`
      : "FruityGo Record";
  }
  return record?.transactionId || "Record";
}

function formatLineItemNames(lineItems = []) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return "No items";

  return lineItems
    .map((item) => {
      const name = item?.productName || item?.product_name || "Product";
      const qty = Number(item?.qty || 0);
      return `${name} 500 gm${qty > 0 ? ` (Qty ${qty})` : ""}`;
    })
    .join(", ");
}

function buildSummaryRow(record, baseMeta, recordIndex) {
  const nestedEntries = Array.isArray(record?.journalEntries)
    ? record.journalEntries
    : [];
  const totalSales = nestedEntries
    .filter((entry) => String(entry?.accountType || "").toLowerCase() === "income")
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);
  const totalCogs = nestedEntries
    .filter((entry) => String(entry?.category || "").toLowerCase() === "cogs")
    .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0);
  const tax = Number(record?.orderTotals?.taxVat13pct || 0);
  const total = Number(record?.orderTotals?.grandTotal || 0);
  const itemNames = formatLineItemNames(record?.lineItems);

  return {
    ...baseMeta,
    __recordId: `${record?._id || `record-${recordIndex}`}-summary`,
    date: toDateInputString(baseMeta.__importedOn),
    account: "FruityGo Order",
    accountType: "Income",
    amount: total,
    category: "Order Summary",
    description: [
      `Items: ${itemNames}`,
      `Sales: ${totalSales}`,
      `COGS: ${totalCogs}`,
      `VAT: ${tax}`,
    ].join("\n"),
  };
}

export function buildRowsFromDatabaseRecords(
  records = [],
  { summarizeFruityGoOrders = false } = {},
) {
  const expandedRows = records.flatMap((record, recordIndex) => {
    const source = String(record?.source || "").toLowerCase();
    const nestedEntries = Array.isArray(record?.journalEntries)
      ? record.journalEntries
      : [];
    const sourceId =
      source === "import"
        ? record?.metadata?.importId || record?.transactionId || record?._id || "records"
        : source === "manual"
          ? "manual"
        : record?.transactionId || record?._id || "records";

    const baseMeta = {
      __fileId: String(sourceId),
      __fileName: getFileName(record),
      __fileType: getSourceLabel(record),
      __source: source,
      __importFileType: record?.metadata?.fileType || "",
      __importedOn:
        record?.importedOn || record?.createdAt || record?.transactionDate,
      __recordDocId: record?._id || null,
      __isManual: source === "manual",
      orgName: record?.orgName || "",
      transactionId: record?.transactionId || "",
    };

    if (summarizeFruityGoOrders && source === "fruitygo" && nestedEntries.length > 0) {
      return [buildSummaryRow(record, baseMeta, recordIndex)];
    }

    if (nestedEntries.length === 0) {
      return [
        {
          ...record,
          ...baseMeta,
          __recordId: `${record?._id || `record-${recordIndex}`}`,
        },
      ];
    }

    return nestedEntries.map((entry, entryIndex) => ({
      ...entry,
      ...baseMeta,
      __recordId: `${record?._id || `record-${recordIndex}`}-${entryIndex}`,
    }));
  });

  return normalizeTransactionRows(expandedRows);
}

export function buildRecordDataset({
  dbRecords = [],
  selectedSource = "all",
}) {
  const allRows = buildRowsFromDatabaseRecords(dbRecords);
  const scopedRows =
    selectedSource === "all"
      ? allRows
      : allRows.filter(
          (row) => String(row.__fileId || "") === String(selectedSource || ""),
        );

  const columns = Array.from(
    new Set(
      scopedRows.flatMap((row) =>
        Object.keys(row).filter((key) => !key.startsWith("__") && key !== "parsedDate"),
      ),
    ),
  );

  const matchedRecord = allRows.find(
    (row) => String(row.__fileId || "") === String(selectedSource || ""),
  );

  return {
    id: selectedSource,
    fileName:
      selectedSource === "all"
        ? "All Records"
        : matchedRecord?.__fileName || "Selected Records",
    fileType:
      selectedSource === "all"
        ? "Combined"
        : matchedRecord?.__fileType || "Unknown",
    importedOn:
      selectedSource === "all"
        ? null
        : matchedRecord?.__importedOn || null,
    records: scopedRows.length,
    columns,
    rows: scopedRows,
    previewRows: scopedRows.slice(0, 200),
  };
}

export function buildSourceOptionsFromRows(rows = []) {
  const sourceMap = new Map();
  rows.forEach((row) => {
    const id = String(row.__fileId || "");
    if (!id || sourceMap.has(id)) return;
    sourceMap.set(id, row.__fileName || "Unknown source");
  });

  return Array.from(sourceMap.entries()).map(([id, fileName]) => ({
    id,
    label: fileName,
  }));
}
