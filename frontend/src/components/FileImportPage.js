import React, { useState } from "react";

const PAST_IMPORTS = [
  {
    id: 1,
    fileName: "Q4_transactions_2025.csv",
    type: "CSV",
    importedOn: "Jan 8, 2026 14:32",
    records: "1,247",
    status: "Success",
  },
  {
    id: 2,
    fileName: "December_expenses.xlsx",
    type: "Excel",
    importedOn: "Jan 7, 2026 09:15",
    records: "856",
    status: "Success",
  },
  {
    id: 3,
    fileName: "vendor_payments_jan.csv",
    type: "CSV",
    importedOn: "Jan 6, 2026 16:48",
    records: "423",
    status: "Success",
  },
  {
    id: 4,
    fileName: "payroll_data_2025.xlsx",
    type: "Excel",
    importedOn: "Jan 5, 2026 11:22",
    records: "2,134",
    status: "Success",
  },
  {
    id: 5,
    fileName: "tax_documents_Q4.csv",
    type: "CSV",
    importedOn: "Jan 4, 2026 13:05",
    records: "—",
    status: "Failed",
  },
];

function FileImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please choose a file first.");
      return;
    }
    alert(`Pretend uploading: ${selectedFile.name}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto text-center mb-8">
        {/* label */}
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600 mb-4">
          Imports
        </span>

        {/* heading */}
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-2">
          File import management.
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
          Upload and manage your financial data files. Drag and drop CSV or Excel
          files to import transactions, and review your import history below.
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
                  Selected file: <span className="font-medium">{selectedFile.name}</span>
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
              className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Upload file
            </button>
          </div>
        </div>

        {/* divider */}
        <div className="border-t border-slate-100 pt-6 mt-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Past imports
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Review files you have imported previously.
          </p>

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
              {PAST_IMPORTS.map((imp, index) => (
                <div
                  key={imp.id}
                  className={`grid grid-cols-[2fr,1fr,2fr,1fr,1fr,40px] px-5 py-3 items-center ${
                    index !== PAST_IMPORTS.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className="text-slate-800">{imp.fileName}</span>
                  <span className="text-slate-500">{imp.type}</span>
                  <span className="text-slate-500">{imp.importedOn}</span>
                  <span className="text-slate-500">{imp.records}</span>

                  <span
                    className={`inline-flex justify-center rounded-full px-3 py-1 text-[10px] font-medium ${
                      imp.status === "Success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {imp.status}
                  </span>

                  <button className="text-right text-slate-400 text-xs hover:text-slate-700">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* pagination */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing 1 to 5 of 7 imports</span>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50">
                Previous
              </button>
              <button className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-medium">
                1
              </button>
              <button className="h-7 w-7 rounded-full border border-slate-200 bg-white text-xs">
                2
              </button>
              <button className="px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileImportPage;
