import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import useAuthStore from "../../store/useAuthStore";

function FileImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imports, setImports] = useState([]); // from backend
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // parsed CSV rows will be stored here
  const [importedFileData, setImportedFileData] = useState([]);
  const [parseError, setParseError] = useState("");

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

  // load past imports when page opens
  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
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
    } catch (err) {
      console.error("Error loading imports:", err);
      setError("Could not load past imports.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
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
                setParseError(
                  "CSV parsed with errors. Check console for details.",
                );
                console.log("PapaParse errors:", results.errors);
              }

              setParseError("");
              const rows = results.data;
              // don't upload immediately; run a scan and require confirmation
              setImportedFileData(rows);
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
               setParseError("");
               setImportedFileData(rows);
               openScanModalFor(rows, "Excel");
               console.log("Parsed Excel rows:", rows);
             } catch (err) {
               console.error("Error parsing Excel:", err);
               setParseError("Failed to parse Excel file.");
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
       duplicateCount: 0,
       dateColumns: [],
       numericColumns: [],
      missingRows: [], // { rowIndex, missingColumns }
      duplicateGroups: [], // array of arrays of row indices
     };

     if (!Array.isArray(rows) || rows.length === 0) {
       report.issues.push("No rows found in file");
       return report;
     }

     // detect columns
     const cols = new Set();
     for (const r of rows) Object.keys(r || {}).forEach((c) => cols.add(c));
     report.columns = Array.from(cols);

     // inconsistencies in column counts
     const counts = new Set(rows.map((r) => Object.keys(r || {}).length));
     if (counts.size > 1) report.issues.push("Inconsistent number of columns across rows");

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
       if (nonEmpty / rows.length < 0.2) report.issues.push(`${col} is empty for most rows`);
     }
     report.dateColumns = dateCols;
     report.numericColumns = numericCols;

    // determine mandatory fields heuristically: prefer common names
    const lowerCols = report.columns.map((c) => c.toLowerCase());
    const mandatoryCandidates = ['date', 'amount', 'debit', 'credit', 'description', 'desc'];
    const mandatoryFields = [];
    for (const mc of mandatoryCandidates) {
      const match = report.columns.find((c) => c.toLowerCase().includes(mc));
      if (match && !mandatoryFields.includes(match)) mandatoryFields.push(match);
    }
    // if none discovered, try to pick a likely date + a numeric column
    if (mandatoryFields.length === 0) {
      const dateCol = report.columns.find((c) => c.toLowerCase().includes('date'));
      const numCol = report.columns.find((c) => c.toLowerCase().includes('amount') || c.toLowerCase().includes('value') || c.toLowerCase().includes('total'));
      if (dateCol) mandatoryFields.push(dateCol);
      if (numCol && !mandatoryFields.includes(numCol)) mandatoryFields.push(numCol);
    }

    // detect missing mandatory fields per row
    if (mandatoryFields.length > 0) {
      rows.forEach((r, idx) => {
        const missing = [];
        for (const mf of mandatoryFields) {
          const v = r[mf];
          if (v == null || String(v).trim() === '') missing.push(mf);
        }
        if (missing.length > 0) report.missingRows.push({ rowIndex: idx, missingColumns: missing });
      });
      if (report.missingRows.length > 0) report.issues.push(`${report.missingRows.length} rows missing mandatory fields: ${mandatoryFields.join(', ')}`);
    }

    // duplicate detection using a rule: prefer (date, description, amount) if available
    const preferredKeys = ['date', 'description', 'desc', 'amount', 'value', 'total'];
    const presentKeys = report.columns.map((c) => c.toLowerCase());
    const dupKeyCols = [];
    // choose up to three keys from preferredKeys that exist in columns
    for (const pk of preferredKeys) {
      const found = report.columns.find((c) => c.toLowerCase().includes(pk));
      if (found && !dupKeyCols.includes(found)) dupKeyCols.push(found);
      if (dupKeyCols.length >= 3) break;
    }

    const groups = Object.create(null);
    if (dupKeyCols.length > 0) {
      rows.forEach((r, idx) => {
        const key = dupKeyCols.map((c) => String(r[c] ?? '').trim().toLowerCase()).join('||');
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
      const dupCount = duplicateGroups.reduce((acc, g) => acc + (g.length - 1), 0);
      report.duplicateCount = dupCount;
      report.issues.push(`${dupCount} duplicate rows detected by rule (${dupKeyCols.join(', ') || 'full-row'})`);
    }

    // limit number of reported issues for brevity
    if (report.issues.length === 0) report.issues.push("No obvious issues detected");
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
        {/* Upload new file */}
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Upload new file
        </h2>

        {/* dropzone */}
        <div className="mb-6">
          <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">
                
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
              className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
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
              {imports.map((imp, index) => (
                <div
                  key={imp._id || imp.id}
                  className={`grid grid-cols-[2fr,1fr,1.5fr,2fr,1fr,1fr,40px] px-5 py-3 items-center ${
                    index !== imports.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className="text-slate-800">{imp.fileName}</span>
                  <span className="text-slate-500">{imp.fileType}</span>
                  <span className="text-slate-500">{imp.userName || imp.user || '—'}</span>
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
            <span>Showing {imports.length} imports</span>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-400 cursor-default">
                Previous
              </button>
              <button className="h-7 px-3 rounded-full bg-emerald-600 text-white text-xs font-medium">
                1
              </button>
              <button className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-400 cursor-default">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {viewModalOpen && viewImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[95%] md:w-3/4 max-h-[85vh] overflow-auto bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Preview: {viewImport.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Imported on: {new Date(viewImport.importedOn).toLocaleString()} • Imported by: {viewImport.userName || viewImport.user || '—'}
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
                <p className="text-xs text-slate-500">Review detected issues before importing.</p>
              </div>
              <button onClick={handleCancelScan} className="text-slate-500 hover:text-slate-800">Close</button>
            </div>

            <div className="text-xs space-y-3">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium">Summary</p>
                <div className="mt-2 text-[13px] text-slate-700">
                  <div>Rows: {scanReport.rowCount}</div>
                  <div>Columns: {scanReport.columns.length} ({scanReport.columns.join(', ')})</div>
                  <div>Date columns detected: {scanReport.dateColumns.join(', ') || '—'}</div>
                  <div>Numeric columns detected: {scanReport.numericColumns.join(', ') || '—'}</div>
                  <div>Duplicates: {scanReport.duplicateCount}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium">Issues</p>
                <ul className="mt-2 list-disc list-inside text-[13px] text-slate-700">
                  {scanReport.issues.slice(0, 10).map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>

              {scanReport.missingRows && scanReport.missingRows.length > 0 && (
                <div className="rounded-lg border border-rose-50 bg-rose-50/30 p-3">
                  <p className="text-sm font-medium">Rows with missing mandatory fields (showing first 10)</p>
                  <ul className="mt-2 text-[13px] text-slate-700 list-decimal list-inside">
                    {scanReport.missingRows.slice(0, 10).map((m, i) => (
                      <li key={i}>Row {m.rowIndex + 1}: missing {m.missingColumns.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scanReport.duplicateGroups && scanReport.duplicateGroups.length > 0 && (
                <div className="rounded-lg border border-amber-50 bg-amber-50/30 p-3">
                  <p className="text-sm font-medium">Duplicate groups detected (showing up to 5 groups)</p>
                  <ul className="mt-2 text-[13px] text-slate-700 list-decimal list-inside">
                    {scanReport.duplicateGroups.slice(0, 5).map((grp, i) => (
                      <li key={i}>Group {i+1}: rows {grp.map((r) => r+1).join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setViewImport({ fileName: selectedFile?.name || scanReport._fileType, data: scanReport._rows }); setViewModalOpen(true); }} className="px-3 py-1 text-xs rounded border">Preview all data</button>
                <button onClick={() => {
                    // preview only problematic rows (missing or duplicates)
                    const indices = new Set();
                    if (scanReport.missingRows) scanReport.missingRows.forEach(m => indices.add(m.rowIndex));
                    if (scanReport.duplicateGroups) scanReport.duplicateGroups.forEach(g => g.forEach(i => indices.add(i)));
                    const problematic = (scanReport._rows || []).filter((_, idx) => indices.has(idx));
                    if (problematic.length === 0) { alert('No problematic rows to preview'); return; }
                    setViewImport({ fileName: selectedFile?.name || scanReport._fileType, data: problematic });
                    setViewModalOpen(true);
                  }} className="px-3 py-1 text-xs rounded border">Preview problematic rows</button>
                <button onClick={handleCancelScan} className="px-3 py-1 text-xs rounded border">Cancel</button>
                <button onClick={handleConfirmImport} className="px-3 py-1 text-xs rounded bg-emerald-600 text-white">Import file</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileImportPage;
