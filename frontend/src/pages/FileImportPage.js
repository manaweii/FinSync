import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import useAuthStore from "../store/useAuthStore";

const TEMPLATE_FILES = {
  csv: "/ImportTemplate/financial_template.csv",
  excel: "/ImportTemplate/financial_template.xlsx",
};

const IMPORTS_PER_PAGE = 8;

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

function FileImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imports, setImports] = useState([]); // from backend
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const downloadMenuRef = useRef(null);

  // modal / preview state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewImport, setViewImport] = useState(null);

  // pre-import scan modal state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanReport, setScanReport] = useState(null);

  const openPreview = (imp) => {
    setViewImport(imp);
    setViewModalOpen(true);
  };

  const closePreview = () => {
    setViewImport(null);
    setViewModalOpen(false);
  };

  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const totalPages = Math.max(1, Math.ceil(imports.length / IMPORTS_PER_PAGE));
  const paginatedImports = imports.slice(
    (currentPage - 1) * IMPORTS_PER_PAGE,
    currentPage * IMPORTS_PER_PAGE,
  );

  // load past imports when page opens
  useEffect(() => {
    loadImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target)
      ) {
        setShowDownloadOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadImports = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/past-imports/${currentUser?.orgId || null}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        console.log("Fetch failed, status:", res.status);
        const text = await res.text();
        console.log("Response text:", text);
        throw new Error("Failed to fetch imports");
      }
      const data = await res.json();
      setImports(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading imports:", err);
      setError("Could not load past imports.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleDownloadTemplate = (format) => {
    const fileUrl =
      format === "excel" ? TEMPLATE_FILES.excel : TEMPLATE_FILES.csv;
    const fileName =
      format === "excel" ? "financial_template.xlsx" : "financial_template.csv";

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
    setShowDownloadOptions(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please choose a file first.");
      return;
    }

    try {
      setUploading(true);

      return new Promise((resolve) => {
        const ext = selectedFile.name.toLowerCase();
        if (ext.endsWith(".csv")) {
          Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              if (results.errors && results.errors.length > 0) {
                console.log("PapaParse errors:", results.errors);
              }

              const rows = results.data;
              // don't upload immediately; run a scan and require confirmation
              openScanModalFor(rows, "CSV");
              console.log("Parsed CSV rows:", rows);
            },
          });
        } else {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: "array" });
              const json = XLSX.utils.sheet_to_json(
                workbook.Sheets[workbook.SheetNames[0]],
              );
              const rows = json;
              openScanModalFor(rows, "Excel");
              console.log("Parsed Excel rows:", rows);
            } catch (err) {
              console.error("Error parsing Excel:", err);
              alert("Failed to parse Excel file.");
            }
          };
          reader.readAsArrayBuffer(selectedFile);
        }
      });
    } catch (err) {
      console.error(err);
      alert("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  // lightweight scan of parsed rows to detect likely issues before final import
  const scanRows = (rows = []) => {
    const report = {
      rowCount: Array.isArray(rows) ? rows.length : 0,
      columns: [],
      sample: Array.isArray(rows) ? rows.slice(0, 5) : [],
      issues: [],
      blockingIssues: [],
      duplicateCount: 0,
      dateColumns: [],
      numericColumns: [],
      invalidRows: [],
      missingRows: [], // { rowIndex, missingColumns }
      missingColumns: [],
      extraColumns: [],
      duplicateGroups: [], // array of arrays of row indices
      duplicateRule: "Date + Account + Description + Amount",
      canImport: true,
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      report.blockingIssues.push("No rows found in file.");
      report.canImport = false;
      return report;
    }

    // detect columns
    const cols = new Set();
    for (const r of rows) Object.keys(r || {}).forEach((c) => cols.add(c));
    report.columns = Array.from(cols);
    const normalizedColumnMap = Object.fromEntries(
      report.columns.map((column) => [normalizeHeader(column), column]),
    );

    report.missingColumns = REQUIRED_IMPORT_COLUMNS.filter(
      (column) => !normalizedColumnMap[normalizeHeader(column)],
    );
    report.extraColumns = report.columns.filter(
      (column) =>
        !REQUIRED_IMPORT_COLUMNS.some(
          (requiredColumn) =>
            normalizeHeader(requiredColumn) === normalizeHeader(column),
        ),
    );

    if (report.missingColumns.length > 0) {
      report.blockingIssues.push(
        `Missing required columns: ${report.missingColumns.join(", ")}`,
      );
    }

    if (report.extraColumns.length > 0) {
      report.blockingIssues.push(
        `Unexpected columns found: ${report.extraColumns.join(", ")}`,
      );
    }

    // inconsistencies in column counts
    const counts = new Set(
      rows.map((r) =>
        Object.values(r || {}).filter((value) => !isBlankValue(value)).length,
      ),
    );
    if (counts.size > 1) {
      report.issues.push("Some rows have fewer filled cells than others.");
    }

    // detect likely date and numeric columns by sampling values
    const dateCols = [];
    const numericCols = [];
    for (const col of report.columns) {
      let dateParsed = 0;
      let numericParsed = 0;
      let nonEmpty = 0;
      for (const r of rows) {
        const v = r[col];
        if (v == null || String(v).trim() === "") continue;
        nonEmpty++;
        // date heuristic
        if (!Number.isNaN(Date.parse(String(v)))) dateParsed++;
        // numeric heuristic
        const n = parseFloat(String(v).replace(/[ ,\u00A0]/g, ""));
        if (!Number.isNaN(n)) numericParsed++;
      }
      if (nonEmpty > 0 && dateParsed / nonEmpty > 0.6) dateCols.push(col);
      if (nonEmpty > 0 && numericParsed / nonEmpty > 0.6) numericCols.push(col);
      // warn if a column is blank for most rows
      if (nonEmpty / rows.length < 0.2)
        report.issues.push(`${col} is empty for most rows`);
    }
    report.dateColumns = dateCols;
    report.numericColumns = numericCols;

    const requiredColumns = REQUIRED_IMPORT_COLUMNS.map(
      (column) => normalizedColumnMap[normalizeHeader(column)],
    ).filter(Boolean);
    const dateColumn = normalizedColumnMap[normalizeHeader("Date")];
    const amountColumn = normalizedColumnMap[normalizeHeader("Amount")];
    const textColumns = TEXT_REQUIRED_COLUMNS.map(
      (column) => normalizedColumnMap[normalizeHeader(column)],
    ).filter(Boolean);

    rows.forEach((row, idx) => {
      const missing = [];
      const invalid = [];

      for (const column of requiredColumns) {
        if (isBlankValue(row[column])) missing.push(column);
      }

      if (dateColumn && !isBlankValue(row[dateColumn]) && !isValidDateValue(row[dateColumn])) {
        invalid.push(`${dateColumn} must be in YYYY-MM-DD format`);
      }

      if (amountColumn && !isBlankValue(row[amountColumn]) && !isValidNumberValue(row[amountColumn])) {
        invalid.push(`${amountColumn} must be a valid number`);
      }

      for (const column of textColumns) {
        if (!isBlankValue(row[column]) && typeof row[column] !== "string") {
          invalid.push(`${column} must be text`);
        }
      }

      const accountTypeColumn = normalizedColumnMap[normalizeHeader("Account Type")];
      if (
        accountTypeColumn &&
        !isBlankValue(row[accountTypeColumn]) &&
        !ALLOWED_ACCOUNT_TYPES.includes(String(row[accountTypeColumn]).trim().toLowerCase())
      ) {
        invalid.push(
          `${accountTypeColumn} must be one of: ${ALLOWED_ACCOUNT_TYPES.join(", ")}`,
        );
      }

      if (missing.length > 0) {
        report.missingRows.push({ rowIndex: idx, missingColumns: missing });
      }

      if (invalid.length > 0) {
        report.invalidRows.push({ rowIndex: idx, invalidColumns: invalid });
      }
    });

    if (report.missingRows.length > 0) {
      report.blockingIssues.push(
        `${report.missingRows.length} row(s) have missing required values.`,
      );
    }

    if (report.invalidRows.length > 0) {
      report.blockingIssues.push(
        `${report.invalidRows.length} row(s) have invalid date, amount, or text values.`,
      );
    }

    const duplicateColumns = [
      normalizedColumnMap[normalizeHeader("Date")],
      normalizedColumnMap[normalizeHeader("Account")],
      normalizedColumnMap[normalizeHeader("Description")],
      normalizedColumnMap[normalizeHeader("Amount")],
    ].filter(Boolean);

    const groups = Object.create(null);
    if (duplicateColumns.length > 0) {
      rows.forEach((r, idx) => {
        const key = duplicateColumns
          .map((c) =>
            String(r[c] ?? "")
              .trim()
              .toLowerCase(),
          )
          .join("||");
        if (!groups[key]) groups[key] = [];
        groups[key].push(idx);
      });
    } else {
      // fallback to whole-row JSON key
      rows.forEach((r, idx) => {
        const key = JSON.stringify(r);
        if (!groups[key]) groups[key] = [];
        groups[key].push(idx);
      });
    }
    const duplicateGroups = Object.values(groups).filter((g) => g.length > 1);
    report.duplicateGroups = duplicateGroups;
    if (duplicateGroups.length > 0) {
      const dupCount = duplicateGroups.reduce(
        (acc, g) => acc + (g.length - 1),
        0,
      );
      report.duplicateCount = dupCount;
      report.issues.push(
        `${dupCount} duplicate row(s) detected by rule (${duplicateColumns.join(", ") || "full-row"})`,
      );
    }

    report.canImport = report.blockingIssues.length === 0;

    if (report.blockingIssues.length === 0 && report.issues.length === 0) {
      report.issues.push("No obvious issues detected.");
    }

    return report;
  };

  const openScanModalFor = (rows, fileTypeLabel) => {
    const r = scanRows(rows);
    setScanReport({ ...r, _rows: rows, _fileType: fileTypeLabel });
    setScanModalOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!scanReport) return;
    const rows = scanReport._rows || [];
    const fileTypeLabel = scanReport._fileType || "CSV";
    setScanModalOpen(false);
    setScanReport(null);
    await uploadRows(rows, fileTypeLabel);
  };

  const handleCancelScan = () => {
    setScanModalOpen(false);
    setScanReport(null);
  };

  const uploadRows = async (rows, fileTypeLabel) => {
    const payload = {
      fileName: selectedFile.name,
      fileType: fileTypeLabel,
      records: rows.length,
      data: rows,
      userId: currentUser?.id || currentUser?._id || null,
      userName: currentUser?.fullName || currentUser?.name || null,
      orgId: currentUser?.orgId || null,
      orgName: currentUser?.orgName || null,
    };

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const createdImport = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = createdImport.message || "Upload failed";
      alert(msg);
      return;
    }

    setImports((prev) => [createdImport, ...prev]);
    setSelectedFile(null);
    setCurrentPage(1);
    alert("File uploaded and saved");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto text-center mb-8">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
          Imports
        </span>

        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">
          File import management.
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
          Upload and manage your financial data files. Drag and drop CSV or
          Excel files to import transactions, and review your import history
          below.
        </p>
      </div>

      {/* main card */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_32px_80px_rgba(15,23,42,0.12)] border border-slate-100 px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Download import format
            </h2>
            <p className="text-xs text-slate-500">
              Use this template if you want the dashboard, reports, and records
              pages to work with the expected columns.
            </p>
          </div>

          <div ref={downloadMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDownloadOptions((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download format
            </button>

            {showDownloadOptions && (
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("excel")}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100"
                >
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload new file */}
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Upload new file
        </h2>

        {/* dropzone */}
        <div className="mb-6">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">
                <ArrowUpTrayIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-700">
                Drag and drop CSV or Excel here
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Supported formats: .csv, .xlsx · Max 20 MB
              </p>
              {selectedFile && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Selected file:{" "}
                  <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}
            </div>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload file"}
            </button>
          </div>
        </div>

        {/* divider */}
        <div className="border-t border-slate-100 pt-6 mt-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Past imports
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Review files you have imported previously.
          </p>

          {loading && (
            <p className="text-xs text-slate-500 mb-2">Loading imports...</p>
          )}
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          {/* table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="grid grid-cols-[2fr,1fr,1.5fr,2fr,1fr,1fr,40px] bg-slate-50 px-5 py-3 text-[11px] font-medium text-slate-500">
              <span>File name</span>
              <span>Type</span>
              <span>Uploaded by</span>
              <span>Imported on</span>
              <span>Records</span>
              <span>Status</span>
              <span className="text-right">View</span>
            </div>

            <div className="bg-white text-xs">
              {paginatedImports.map((imp, index) => (
                <div
                  key={imp._id || imp.id}
                  className={`grid grid-cols-[2fr,1fr,1.5fr,2fr,1fr,1fr,40px] px-5 py-3 items-center ${
                    index !== paginatedImports.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className="text-slate-800">{imp.fileName}</span>
                  <span className="text-slate-500">{imp.fileType}</span>
                  <span className="text-slate-500">
                    {imp.userName || imp.user || "—"}
                  </span>
                  <span className="text-slate-500">{imp.importedOn}</span>
                  <span className="text-slate-500">{imp.records ?? "—"}</span>

                  <span
                    className={`inline-flex justify-center rounded-full px-3 py-1 text-[10px] font-medium ${
                      imp.status === "Success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {imp.status}
                  </span>

                  <button
                    onClick={() => openPreview(imp)}
                    className="text-right text-slate-400 text-xs hover:text-slate-700"
                  >
                    View
                  </button>
                </div>
              ))}

              {!loading && imports.length === 0 && !error && (
                <p className="px-5 py-3 text-xs text-slate-500">
                  No imports yet. Upload a file to get started.
                </p>
              )}
            </div>
          </div>

          {/* simple info instead of real pagination */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Showing {paginatedImports.length} of {imports.length} imports
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-500 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                className="h-7 px-3 rounded-full bg-emerald-600 text-white text-xs font-medium"
              >
                {currentPage}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-500 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {viewModalOpen && viewImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closePreview}
        >
          <div
            className="w-[95%] md:w-3/4 max-h-[85vh] overflow-auto bg-white rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Preview: {viewImport.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Imported on:{" "}
                  {new Date(viewImport.importedOn).toLocaleString()} • Imported
                  by: {viewImport.userName || viewImport.user || "—"}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="overflow-auto">
              {(() => {
                // determine rows: importedData may be JSON string, or the import may include `importedData` or `importedDataParsed`
                let rows = [];
                try {
                  if (viewImport.importedData) {
                    rows = JSON.parse(viewImport.importedData);
                  } else if (viewImport.data) {
                    rows = viewImport.data;
                  }
                } catch (e) {
                  console.error("Failed to parse import data for preview", e);
                }

                if (!Array.isArray(rows) || rows.length === 0) {
                  return (
                    <p className="text-sm text-slate-500">
                      No preview data available.
                    </p>
                  );
                }

                const cols = Object.keys(rows[0]);
                return (
                  <div className="text-xs">
                    <div className="overflow-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr>
                            {cols.map((c) => (
                              <th
                                key={c}
                                className="border-b px-2 py-1 bg-slate-50 text-slate-600 text-[11px]"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 200).map((r, i) => (
                            <tr
                              key={i}
                              className={
                                i % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              {cols.map((c) => (
                                <td
                                  key={c}
                                  className="px-2 py-1 align-top text-slate-700"
                                >
                                  {String(r[c] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > 200 && (
                      <p className="text-xs text-slate-400 mt-2">
                        Showing first 200 rows of {rows.length}.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Scan results modal */}
      {scanModalOpen && scanReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[95%] md:w-2/3 max-h-[85vh] overflow-auto bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Import scan results</h3>
                <p className="text-xs text-slate-500">
                  Review detected issues before importing.
                </p>
              </div>
              <button
                onClick={handleCancelScan}
                className="text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium">Summary</p>
                <div className="mt-2 text-[13px] text-slate-700">
                  <div>Rows: {scanReport.rowCount}</div>
                  <div>
                    Columns: {scanReport.columns.length} (
                    {scanReport.columns.join(", ")})
                  </div>
                  <div>
                    Date columns detected:{" "}
                    {scanReport.dateColumns.join(", ") || "—"}
                  </div>
                  <div>
                    Numeric columns detected:{" "}
                    {scanReport.numericColumns.join(", ") || "—"}
                  </div>
                  <div>Duplicates: {scanReport.duplicateCount}</div>
                  <div>Duplicate rule: {scanReport.duplicateRule}</div>
                  <div>
                    Import status:{" "}
                    <span
                      className={
                        scanReport.canImport
                          ? "text-emerald-700 font-medium"
                          : "text-rose-700 font-medium"
                      }
                    >
                      {scanReport.canImport
                        ? "Ready to import"
                        : "Fix file before import"}
                    </span>
                  </div>
                </div>
              </div>

              {scanReport.blockingIssues && scanReport.blockingIssues.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-medium text-rose-800">
                    Blocking issues
                  </p>
                  <ul className="mt-2 list-disc list-inside text-[13px] text-rose-700">
                    {scanReport.blockingIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium">Warnings</p>
                <ul className="mt-2 list-disc list-inside text-[13px] text-slate-700">
                  {scanReport.issues.slice(0, 10).map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>

              {scanReport.missingColumns && scanReport.missingColumns.length > 0 && (
                <div className="rounded-lg border border-rose-50 bg-rose-50/30 p-3">
                  <p className="text-sm font-medium">
                    Missing required columns
                  </p>
                  <p className="mt-2 text-[13px] text-slate-700">
                    {scanReport.missingColumns.join(", ")}
                  </p>
                </div>
              )}

              {scanReport.extraColumns && scanReport.extraColumns.length > 0 && (
                <div className="rounded-lg border border-rose-50 bg-rose-50/30 p-3">
                  <p className="text-sm font-medium">Unexpected columns</p>
                  <p className="mt-2 text-[13px] text-slate-700">
                    {scanReport.extraColumns.join(", ")}
                  </p>
                </div>
              )}

              {scanReport.missingRows && scanReport.missingRows.length > 0 && (
                <div className="rounded-lg border border-rose-50 bg-rose-50/30 p-3">
                  <p className="text-sm font-medium">
                    Rows with missing mandatory fields (showing first 10)
                  </p>
                  <ul className="mt-2 text-[13px] text-slate-700 list-decimal list-inside">
                    {scanReport.missingRows.slice(0, 10).map((m, i) => (
                      <li key={i}>
                        Row {m.rowIndex + 1}: missing{" "}
                        {m.missingColumns.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scanReport.invalidRows && scanReport.invalidRows.length > 0 && (
                <div className="rounded-lg border border-rose-50 bg-rose-50/30 p-3">
                  <p className="text-sm font-medium">
                    Rows with invalid values (showing first 10)
                  </p>
                  <ul className="mt-2 text-[13px] text-slate-700 list-decimal list-inside">
                    {scanReport.invalidRows.slice(0, 10).map((row, i) => (
                      <li key={i}>
                        Row {row.rowIndex + 1}: {row.invalidColumns.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scanReport.duplicateGroups &&
                scanReport.duplicateGroups.length > 0 && (
                  <div className="rounded-lg border border-amber-50 bg-amber-50/30 p-3">
                    <p className="text-sm font-medium">
                      Duplicate groups detected (showing up to 5 groups)
                    </p>
                    <ul className="mt-2 text-[13px] text-slate-700 list-decimal list-inside">
                      {scanReport.duplicateGroups.slice(0, 5).map((grp, i) => (
                        <li key={i}>
                          Group {i + 1}: rows {grp.map((r) => r + 1).join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelScan}
                  className="px-3 py-1 text-xs rounded border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!scanReport.canImport}
                  className="px-3 py-1 text-xs rounded bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Import file
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileImportPage;
