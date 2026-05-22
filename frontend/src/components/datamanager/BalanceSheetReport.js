import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  buildBalanceSheet,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
  validateRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Line({ label, value, bold, indent = false }) {
  return (
    <div className={`flex justify-between ${indent ? "pl-3" : ""}`}>
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>{value}</span>
    </div>
  );
}

export default function BalanceSheetReport() {
  const ctx          = useOutletContext() || {};
  const { exportToExcel, exportToPDF } = ctx;
  const importDetail = ctx.importDetail || null;
  const filters      = ctx.filters || EMPTY_FILTERS;

  const rows = useMemo(
    () => normalizeTransactionRows(importDetail?.rows || importDetail?.previewRows || []),
    [importDetail]
  );
  const filteredRows = useMemo(() => filterTransactions(rows, filters), [rows, filters]);
  const warnings     = useMemo(() => validateRows(filteredRows), [filteredRows]);
  const bs           = useMemo(() => buildBalanceSheet(filteredRows), [filteredRows]);

  const {
    currentAssets, nonCurrentAssets, totalAssets,
    currentLiabilities, longTermLiabilities, totalLiabilities,
    paidInCapital, retainedEarnings, totalEquity,
    workingCapital, balanceDiff, isBalanced,
  } = bs;

  const title = filters?.preset && filters?.from && filters?.to
    ? `Balance Sheet — ${filters.preset}` : "Balance Sheet";

  const buildSummaryRows = () => [
    { Metric: "Current Assets",        Value: currentAssets },
    { Metric: "Non-current Assets",    Value: nonCurrentAssets },
    { Metric: "Total Assets",          Value: totalAssets },
    { Metric: "Current Liabilities",   Value: currentLiabilities },
    { Metric: "Long-term Liabilities", Value: longTermLiabilities },
    { Metric: "Total Liabilities",     Value: totalLiabilities },
    { Metric: "Paid-in Capital",       Value: paidInCapital },
    { Metric: "Retained Earnings",     Value: retainedEarnings },
    { Metric: "Total Equity",          Value: totalEquity },
    { Metric: "Working Capital",       Value: workingCapital },
    { Metric: "Balance Difference",    Value: balanceDiff },
  ].map(r => ({ Metric: r.Metric, Value: String(r.Value) }));

  const onExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || "balance_sheet").replace(/\s+/g, "_");
    if (exportToExcel) return exportToExcel(reportRows, filename);
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) { console.error(err); alert("Failed to export Excel"); }
  };

  const onExportPDF = () => {
    const reportRows = buildSummaryRows();
    const cols = ["Metric", "Value"];
    if (exportToPDF) return exportToPDF(reportRows, cols, title);
    try {
      const rowsHtml = reportRows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`).join("");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${title}</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
      const w = window.open("about:blank", "_blank");
      if (!w) { alert("Popup blocked"); return; }
      w.document.write(html); w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 500);
    } catch (err) { console.error(err); alert("Failed to export PDF"); }
  };

  if (!filteredRows || filteredRows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="rounded-lg border border-slate-100 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">No balance sheet data for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="px-2 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onExportPDF}   className="text-xs px-3 py-1 rounded-lg border hover:bg-slate-50">Export PDF</button>
          <button onClick={onExportExcel} className="text-xs px-3 py-1 rounded-lg border hover:bg-slate-50">Export Excel</button>
        </div>
      </div>

      {warnings.filter(w => w.severity === "warn").length > 0 && (
        <div className="mx-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700 space-y-0.5">
          {warnings.filter(w => w.severity === "warn").slice(0, 3).map((w, i) => (
            <p key={i}>⚠ {w.message}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <SummaryCard label="Total Assets"       value={formatCurrency(totalAssets)} />
        <SummaryCard label="Current Assets"     value={formatCurrency(currentAssets)} />
        <SummaryCard label="Total Liabilities"  value={formatCurrency(totalLiabilities)} />
        <SummaryCard label="Total Equity"       value={formatCurrency(totalEquity)} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets column */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Assets</p>
            <div className="space-y-2">
              <Line label="Current Assets"     value={formatCurrency(currentAssets)}    indent />
              <Line label="Non-current Assets" value={formatCurrency(nonCurrentAssets)} indent />
              <div className="pt-1 border-t border-slate-100" />
              <Line label="Total Assets"       value={formatCurrency(totalAssets)}      bold />
            </div>
          </div>

          {/* Liabilities + Equity column */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Liabilities &amp; Equity</p>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-500">Liabilities</p>
              <Line label="Current Liabilities"   value={formatCurrency(currentLiabilities)}   indent />
              <Line label="Long-term Liabilities" value={formatCurrency(longTermLiabilities)}  indent />
              <Line label="Total Liabilities"     value={formatCurrency(totalLiabilities)}     bold />

              <div className="pt-2" />
              <p className="text-[11px] font-medium text-slate-500">Equity</p>
              <Line label="Paid-in Capital"       value={formatCurrency(paidInCapital)}        indent />
              <Line label="Retained Earnings"     value={formatCurrency(retainedEarnings)}     indent />
              <Line label="Total Equity"          value={formatCurrency(totalEquity)}          bold />
            </div>
          </div>
        </div>

        {/* Balance check panel */}
        <div className={`mt-5 p-3 rounded-lg border ${isBalanced ? "border-emerald-100 bg-emerald-50/60" : "border-rose-100 bg-rose-50/60"}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold">Balance check</p>
              <p className={`text-xs ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
                {isBalanced
                  ? "✓ Assets = Liabilities + Equity (balanced)"
                  : `⚠ Difference: ${formatCurrency(Math.abs(balanceDiff))} — check for missing journal entries or unmapped rows`}
              </p>
              {!isBalanced && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Common causes: rows with unknown Account Type, multi-currency without conversion, or missing equity/retained earnings entries.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">Working Capital</p>
              <p className={`text-xs ${workingCapital >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(workingCapital)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}