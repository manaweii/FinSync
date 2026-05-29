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

const ALLOWED_ACCOUNT_TYPES = [
  "income",
  "revenue",
  "expense",
  "asset",
  "liability",
  "equity",
];

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeCellText = (value) =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();

const formatDateParts = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const excelSerialToDate = (value) => {
  const serial = Number(value);
  if (!Number.isFinite(serial) || serial < 25569) return null;

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const date = new Date(utcValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeDateText = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatDateParts(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    );
  }

  if (typeof value === "number") {
    const excelDate = excelSerialToDate(value);
    if (excelDate) {
      return formatDateParts(
        excelDate.getUTCFullYear(),
        excelDate.getUTCMonth() + 1,
        excelDate.getUTCDate(),
      );
    }
  }

  return normalizeCellText(value);
};

const isBlankValue = (value) => normalizeCellText(value) === "";

const isValidDateValue = (value) => {
  if (isBlankValue(value)) return false;
  const text = normalizeDateText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;

  const [year, month, day] = text.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) return false;

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
};

const isValidNumberValue = (value) => {
  if (isBlankValue(value)) return false;
  const cleaned = normalizeCellText(value).replace(/[ ,]/g, "");
  return cleaned !== "" && Number.isFinite(Number(cleaned));
};

const parseDate = (value) => {
  const text = normalizeDateText(value);
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(normalizeCellText(value).replace(/[,\s]/g, ""));
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
        normalizeCellText(row?.[accountTypeColumn]).toLowerCase(),
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
    const { fileName, fileType, data, userId, userName, orgId, orgName } =
      req.body; // client may send uploader info

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

    const normalizedColumnMap = Object.fromEntries(
      REQUIRED_IMPORT_COLUMNS.map((column) => [
        normalizeHeader(column),
        Object.keys(data[0] || {}).find(
          (key) => normalizeHeader(key) === normalizeHeader(column),
        ) || column,
      ]),
    );

    const sanitizedRows = data.map((row) => ({
      Date: normalizeDateText(
        row?.[normalizedColumnMap[normalizeHeader("Date")]],
      ),
      Account: normalizeCellText(
        row?.[normalizedColumnMap[normalizeHeader("Account")]],
      ),
      "Account Type": normalizeCellText(
        row?.[normalizedColumnMap[normalizeHeader("Account Type")]],
      ),
      Amount: toNumber(row?.[normalizedColumnMap[normalizeHeader("Amount")]], 0),
      Description: normalizeCellText(
        row?.[normalizedColumnMap[normalizeHeader("Description")]],
      ),
      Category: normalizeCellText(
        row?.[normalizedColumnMap[normalizeHeader("Category")]],
      ),
    }));

    const newImport = await ImportModel.create({
      fileName,
      fileType: fileType || "CSV",
      importedOn: Date.now(),
      records: sanitizedRows.length,
      status: "Success",
      userName,
      userId,
      orgId,
      orgName,
      notes: "",
      importedData: JSON.stringify(sanitizedRows),
    });

    const importTransactionId = `IMP-${newImport._id}`;
    const docs = sanitizedRows.map((row, index) => {
      const dateValue = row.Date;
      const transactionDate = parseDate(dateValue) || new Date();
      const rowTransactionId = `${importTransactionId}-${index + 1}`;

      return {
        orgName,
        source: "import",
        schemaVersion: "finsync_v2",
        transactionId: rowTransactionId,
        transactionDate,
        currency: "NPR",
        importedOn: newImport.importedOn || new Date(),
        lineItems: [],
        orderTotals: {},
        journalEntries: [
          {
            date: dateValue,
            account: row.Account,
            accountType: row["Account Type"],
            amount: row.Amount,
            category: row.Category,
            description: row.Description,
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
      await RecordModel.insertMany(docs, { ordered: true });
    } catch (recordErr) {
      await ImportModel.findByIdAndDelete(newImport._id).catch(() => {});
      throw recordErr;
    }

    res.status(201).json({
      ...newImport.toObject(),
      records: docs.length,
      importedData: JSON.stringify(sanitizedRows),
      rows: sanitizedRows,
    });
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
