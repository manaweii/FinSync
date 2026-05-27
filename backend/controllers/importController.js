import ImportModel from "../models/Import.js";
import RecordModel from "../models/Record.js";

const REQUIRED_IMPORT_COLUMNS = [
  "Date",
  "Account",
  "Account Type",
  "Amount",
  "Description",
  "Category",
];

const TEXT_REQUIRED_COLUMNS = [
  "Account",
  "Account Type",
  "Description",
  "Category",
];

const ALLOWED_ACCOUNT_TYPES = ["income", "expense", "asset", "liability", "equity"];

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const isBlankValue = (value) => value == null || String(value).trim() === "";

const isValidDateValue = (value) => {
  if (isBlankValue(value)) return false;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;

  const parsed = new Date(`${text}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const [year, month, day] = text.split("-").map(Number);
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
};

const isValidNumberValue = (value) => {
  if (isBlankValue(value)) return false;
  const cleaned = String(value).replace(/[ ,\u00A0]/g, "");
  return !Number.isNaN(Number.parseFloat(cleaned));
};

const parseDate = (value) => {
  const date = new Date(`${String(value).trim()}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPrimaryJournalEntry = (record = {}) => {
  const entries = Array.isArray(record?.journalEntries) ? record.journalEntries : [];
  return entries[0] || {};
};

const buildTemplateRowFromRecord = (record = {}) => {
  const entry = getPrimaryJournalEntry(record);
  return {
    Date: String(entry?.date || "").trim(),
    Account: String(entry?.account || "").trim(),
    "Account Type": String(entry?.accountType || "").trim(),
    Amount: Number(entry?.amount || 0),
    Description: String(entry?.description || "").trim(),
    Category: String(entry?.category || "").trim(),
  };
};

const buildGroupedImportsFromRecords = (records = [], fallbackOrgId = "") => {
  const grouped = new Map();

  records.forEach((record) => {
    const metadata = record?.metadata || {};
    const importId = String(metadata?.importId || record?.transactionId || record?._id || "");
    if (!importId) return;

    const existing = grouped.get(importId);
    const row = buildTemplateRowFromRecord(record);

    if (!existing) {
      grouped.set(importId, {
        _id: importId,
        id: importId,
        fileName: metadata?.fileName || `Import ${importId}`,
        fileType: metadata?.fileType || "CSV",
        importedOn: record?.importedOn || record?.transactionDate || record?.createdAt || null,
        records: 1,
        status: "Success",
        userName: metadata?.importedByUserName || "—",
        userId: metadata?.importedByUserId || null,
        orgId: metadata?.orgId || fallbackOrgId || null,
        orgName: record?.orgName || "",
        rows: [row],
      });
      return;
    }

    existing.records += 1;
    existing.rows.push(row);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      importedData: JSON.stringify(item.rows),
    }))
    .sort((a, b) => {
      const aTime = new Date(a?.importedOn || 0).getTime();
      const bTime = new Date(b?.importedOn || 0).getTime();
      return bTime - aTime;
    });
};

const validateImportRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: "No rows found in file" };
  }

  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {}))),
  );
  const normalizedColumnMap = Object.fromEntries(
    columns.map((column) => [normalizeHeader(column), column]),
  );

  const missingColumns = REQUIRED_IMPORT_COLUMNS.filter(
    (column) => !normalizedColumnMap[normalizeHeader(column)],
  );
  const extraColumns = columns.filter(
    (column) =>
      !REQUIRED_IMPORT_COLUMNS.some(
        (requiredColumn) =>
          normalizeHeader(requiredColumn) === normalizeHeader(column),
      ),
  );

  if (missingColumns.length > 0 || extraColumns.length > 0) {
    const parts = [];
    if (missingColumns.length > 0) {
      parts.push(`missing columns: ${missingColumns.join(", ")}`);
    }
    if (extraColumns.length > 0) {
      parts.push(`unexpected columns: ${extraColumns.join(", ")}`);
    }
    return {
      ok: false,
      message: `File format must match the template exactly (${parts.join(" | ")})`,
    };
  }

  const dateColumn = normalizedColumnMap[normalizeHeader("Date")];
  const amountColumn = normalizedColumnMap[normalizeHeader("Amount")];
  const accountTypeColumn = normalizedColumnMap[normalizeHeader("Account Type")];
  const textColumns = TEXT_REQUIRED_COLUMNS.map(
    (column) => normalizedColumnMap[normalizeHeader(column)],
  ).filter(Boolean);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    for (const column of REQUIRED_IMPORT_COLUMNS) {
      const actualColumn = normalizedColumnMap[normalizeHeader(column)];
      if (isBlankValue(row?.[actualColumn])) {
        return {
          ok: false,
          message: `Row ${index + 1} is missing ${actualColumn}`,
        };
      }
    }

    if (!isValidDateValue(row?.[dateColumn])) {
      return {
        ok: false,
        message: `Row ${index + 1} has an invalid ${dateColumn}. Use YYYY-MM-DD format.`,
      };
    }

    if (!isValidNumberValue(row?.[amountColumn])) {
      return {
        ok: false,
        message: `Row ${index + 1} has an invalid ${amountColumn}. Enter a number.`,
      };
    }

    for (const column of textColumns) {
      if (typeof row?.[column] !== "string" || isBlankValue(row?.[column])) {
        return {
          ok: false,
          message: `Row ${index + 1} has an invalid ${column}. Enter text.`,
        };
      }
    }

    if (
      !ALLOWED_ACCOUNT_TYPES.includes(
        String(row?.[accountTypeColumn] || "")
          .trim()
          .toLowerCase(),
      )
    ) {
      return {
        ok: false,
        message: `Row ${index + 1} has an invalid ${accountTypeColumn}. Use one of: ${ALLOWED_ACCOUNT_TYPES.join(", ")}`,
      };
    }
  }

  return { ok: true };
};

export const uploadFile = async (req, res) => {
  try {
    const { fileName, fileType, records, data, userId, userName, orgId, orgName } = req.body;      // client may send uploader info

    // basic payload validation
    if (!fileName || !data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // auth / org validation – these are required in the schema
    if (!userId || !userName || !orgId || !orgName) {
      return res
        .status(400)
        .json({ message: "Missing user / organization context for import" });
    }

    const validation = validateImportRows(data);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const newImport = await ImportModel.create({
      fileName,
      fileType: fileType || "CSV",
      importedOn: Date.now(),
      records: records ?? data.length,
      status: "Success",
      userName,
      userId,
      orgId,
      orgName,
      notes: "",
      importedData: JSON.stringify(data),
    });

    const importTransactionId = `IMP-${newImport._id}`;
    const normalizedColumnMap = Object.fromEntries(
      REQUIRED_IMPORT_COLUMNS.map((column) => [
        normalizeHeader(column),
        Object.keys(data[0] || {}).find(
          (key) => normalizeHeader(key) === normalizeHeader(column),
        ) || column,
      ]),
    );

    const docs = data.map((row, index) => {
      const dateValue = row?.[normalizedColumnMap[normalizeHeader("Date")]];
      const account = row?.[normalizedColumnMap[normalizeHeader("Account")]];
      const accountType = row?.[normalizedColumnMap[normalizeHeader("Account Type")]];
      const amount = row?.[normalizedColumnMap[normalizeHeader("Amount")]];
      const description = row?.[normalizedColumnMap[normalizeHeader("Description")]];
      const category = row?.[normalizedColumnMap[normalizeHeader("Category")]];
      const transactionDate = parseDate(dateValue) || new Date();

      return {
        orgName,
        source: "import",
        schemaVersion: "finsync_v2",
        transactionId: importTransactionId,
        transactionDate,
        currency: "NPR",
        importedOn: newImport.importedOn || new Date(),
        lineItems: [],
        orderTotals: {},
        journalEntries: [
          {
            date: String(dateValue || "").trim(),
            account: String(account || "").trim(),
            accountType: String(accountType || "").trim(),
            amount: toNumber(amount, 0),
            category: String(category || "").trim(),
            description: String(description || "").trim(),
          },
        ],
        metadata: {
          origin: "file_import",
          fileName: newImport.fileName,
          fileType: newImport.fileType,
          importId: newImport._id.toString(),
          importedRowNo: index + 1,
          importedByUserId: userId,
          importedByUserName: userName,
          orgId,
        },
        notes: "",
      };
    });

    try {
      await RecordModel.insertMany(docs);
    } catch (recordErr) {
      await ImportModel.findByIdAndDelete(newImport._id).catch(() => {});
      throw recordErr;
    }

    // process `rows` and insert into a Transactions collection

    res.status(201).json(newImport);
  } catch (err) {
    console.error("Error saving import:", err);
    res.status(500).json({ message: "Failed to save import" });
  }
};

// Get past imports for the organization
export const pastImportData = async (req, res) => {
  try {
    const orgId = req.params?.orgId;
    if (!orgId) {
      return res
        .status(400)
        .json({ message: "Organization context is required" });
    }

    const importRecords = await RecordModel.find({
      source: "import",
      "metadata.orgId": String(orgId),
    })
      .sort({ importedOn: -1, transactionDate: -1, createdAt: -1 })
      .lean();

    const imports = buildGroupedImportsFromRecords(importRecords, orgId);
    res.status(200).json(imports);
  } catch (err) {
    console.error("Error fetching imports:", err);
    res.status(500).json({ message: "Failed to load imports" });
  }
};

// Get a single import by id and return parsed rows and a small summary
export const getImportById = async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'Import id is required' });

    const importRecords = await RecordModel.find({
      source: "import",
      $or: [{ "metadata.importId": String(id) }, { transactionId: String(id) }],
    })
      .sort({ importedOn: -1, transactionDate: -1, createdAt: -1 })
      .lean();

    if (!importRecords.length) {
      return res.status(404).json({ message: 'Import not found' });
    }

    const grouped = buildGroupedImportsFromRecords(importRecords);
    const imp = grouped[0];
    const rows = Array.isArray(imp?.rows) ? imp.rows : [];

    // determine columns from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // create simple numeric totals for numeric-like columns (if any)
    const totals = {};
    if (rows.length > 0) {
      for (const col of columns) {
        let isNumeric = true;
        let sum = 0;
        for (const r of rows) {
          const val = r[col];
          const num = typeof val === 'number' ? val : (val === null || val === undefined ? NaN : parseFloat(String(val).replace(/[,\s]/g, '')));
          if (Number.isFinite(num)) {
            sum += num;
          } else {
            isNumeric = false;
            break;
          }
        }
        if (isNumeric) totals[col] = sum;
      }
    }

    const previewRows = rows.slice(0, 200);

    res.json({
      id: imp.id,
      fileName: imp.fileName,
      fileType: imp.fileType,
      importedOn: imp.importedOn,
      records: imp.records,
      userId: imp.userId,
      userName: imp.userName,
      orgId: imp.orgId,
      orgName: imp.orgName,
      columns,
      rows,
      previewRows,
      totals,
    });
  } catch (err) {
    console.error('getImportById error:', err);
    res.status(500).json({ message: 'Failed to load import details' });
  }
};
