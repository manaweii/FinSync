import { normalizeTransactionRows } from "./financialData";

export function getImportId(imp) {
  return imp?._id || imp?.id || null;
}

export function parseImportedDataRows(importRecord) {
  if (!importRecord?.importedData) return [];

  try {
    const parsed = JSON.parse(importRecord.importedData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse imported data:", getImportId(importRecord), error);
    return [];
  }
}

export function buildImportedRowsFromImports(imports = []) {
  return imports.flatMap((imp) =>
    normalizeTransactionRows(parseImportedDataRows(imp), (_, index) => ({
      __recordId: `${getImportId(imp)}-${index}`,
      __fileId: getImportId(imp),
      __fileName: imp.fileName || "Untitled import",
      __fileType: imp.fileType || "Unknown",
      __importedOn: imp.importedOn,
    })),
  );
}

function getManualRecordsStorageKey(orgId) {
  return `finsync-manual-records:${orgId || "unknown-org"}`;
}

export function normalizeManualRows(rows = []) {
  return normalizeTransactionRows(rows, (row, index) => ({
    __recordId: row.__recordId || `manual-${index}`,
    __fileId: "manual",
    __fileName: row.__fileName || "Manual Record",
    __fileType: row.__fileType || "Manual",
    __importedOn: row.__importedOn || new Date().toISOString(),
  }));
}

export function loadManualRows(orgId) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getManualRecordsStorageKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeManualRows(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("Failed to load manual records:", error);
    return [];
  }
}

export function saveManualRows(orgId, rows = []) {
  if (typeof window === "undefined") return;

  try {
    const serializableRows = rows.map(({ parsedDate, ...row }) => row);
    window.localStorage.setItem(
      getManualRecordsStorageKey(orgId),
      JSON.stringify(serializableRows),
    );
  } catch (error) {
    console.error("Failed to save manual records:", error);
  }
}

export function buildRecordDataset({ imports = [], manualRows = [], selectedSource = "all" }) {
  const scopedImports =
    selectedSource === "all"
      ? imports
      : imports.filter((imp) => getImportId(imp) === selectedSource);

  const importedRows = buildImportedRowsFromImports(scopedImports);
  const allRows = [...manualRows, ...importedRows];
  const columns = Array.from(
    new Set(
      allRows.flatMap((row) =>
        Object.keys(row).filter((key) => !key.startsWith("__") && key !== "parsedDate"),
      ),
    ),
  );

  return {
    id: selectedSource,
    fileName:
      selectedSource === "all"
        ? "All Records"
        : scopedImports[0]?.fileName || "Selected Records",
    fileType:
      selectedSource === "all"
        ? "Combined"
        : scopedImports[0]?.fileType || "Unknown",
    importedOn:
      selectedSource === "all"
        ? null
        : scopedImports[0]?.importedOn || null,
    records: allRows.length,
    columns,
    rows: allRows,
    previewRows: allRows.slice(0, 200),
  };
}
