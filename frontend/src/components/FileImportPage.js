import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import useAuthStore from "../store/useAuthStore";

function FileImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imports, setImports] = useState([]); // from backend
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // parsed CSV rows will be stored here
  const [csvRows, setCsvRows] = useState([]);
  const [parseError, setParseError] = useState("");

  // modal / preview state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewImport, setViewImport] = useState(null);

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
      const res = await fetch(`${API_BASE}/past-imports/${currentUser?.orgId || null}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

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

      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors && results.errors.length > 0) {
            setParseError("CSV parsed with errors. Check console for details.");
            console.log("PapaParse errors:", results.errors);
          } else {
            setParseError("");
            const payload = {
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              records: results.data.length,
              data: results.data,
              userId: currentUser?.id || currentUser?._id || null,
              userName: currentUser?.fullName || currentUser?.name || null,
              orgId: currentUser?.orgId || currentUser?.orgId || null,
              orgName: currentUser?.orgName || currentUser?.orgName || null,
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

            // add new import to top of list
            setImports((prev) => [createdImport, ...prev]);
            setSelectedFile(null);
            alert("File uploaded and saved");
          }

          setCsvRows(results.data);
          console.log("Parsed CSV rows:", results.data);
        },
      });
    } catch (err) {
      console.error(err);
      alert("Network error during upload");
    } finally {
      setUploading(false);
    }
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
                ⬆
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
            <div className="grid grid-cols-[2fr,1fr,2fr,1fr,1fr,40px] bg-slate-50 px-5 py-3 text-[11px] font-medium text-slate-500">
              <span>File name</span>
              <span>Type</span>
              <span>Imported on</span>
              <span>Records</span>
              <span>Status</span>
              <span className="text-right">View</span>
            </div>

            <div className="bg-white text-xs">
              {imports.map((imp, index) => (
                <div
                  key={imp._id || imp.id}
                  className={`grid grid-cols-[2fr,1fr,2fr,1fr,1fr,40px] px-5 py-3 items-center ${
                    index !== imports.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className="text-slate-800">{imp.fileName}</span>
                  <span className="text-slate-500">{imp.fileType}</span>
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

                  <button onClick={() => openPreview(imp)} className="text-right text-slate-400 text-xs hover:text-slate-700">
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
                <h3 className="text-lg font-semibold">Preview: {viewImport.fileName}</h3>
                <p className="text-xs text-slate-500">Imported on: {new Date(viewImport.importedOn).toLocaleString()}</p>
              </div>
              <button onClick={closePreview} className="text-slate-500 hover:text-slate-800">Close</button>
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
                  console.error('Failed to parse import data for preview', e);
                }

                if (!Array.isArray(rows) || rows.length === 0) {
                  return <p className="text-sm text-slate-500">No preview data available.</p>;
                }

                const cols = Object.keys(rows[0]);
                return (
                  <div className="text-xs">
                    <div className="overflow-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr>
                            {cols.map((c) => (
                              <th key={c} className="border-b px-2 py-1 bg-slate-50 text-slate-600 text-[11px]">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, 200).map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              {cols.map((c) => (
                                <td key={c} className="px-2 py-1 align-top text-slate-700">{String(r[c] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > 200 && <p className="text-xs text-slate-400 mt-2">Showing first 200 rows of {rows.length}.</p>}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileImportPage;
