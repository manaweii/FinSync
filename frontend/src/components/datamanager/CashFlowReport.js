import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  buildCashFlow,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
  validateRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function CFCard({ label, value, positive }) {
  const color = positive === undefined
    ? "text-slate-900"
    : positive ? "text-emerald-700" : "text-rose-700";
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold mb-1 ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Line({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>{value}</span>
    </div>
  );
}

export default function CashFlowReport() {
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
  const cf           = useMemo(() => buildCashFlow(filteredRows), [filteredRows]);

  const { operating, investing, financing, netChange, endingCash } = cf;

  const title = filters?.preset && filters?.from && filters?.to
    ? `Cash Flow — ${filters.preset}` : "Cash Flow Statement";

  const buildSummaryRows = () => [
    { Metric: "Operating Cash Flow",  Value: operating },
    { Metric: "Investing Cash Flow",  Value: investing },
    { Metric: "Financing Cash Flow",  Value: financing },
    { Metric: "Net Change in Cash",   Value: netChange },
    { Metric: "Ending Cash Balance",  Value: endingCash },
  ].map(r => ({ Metric: r.Metric, Value: String(r.Value) }));

  const onExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || "cashflow").replace(/\s+/g, "_");
    if (exportToExcel) return exportToExcel(reportRows, filename);
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CashFlow");
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
          <p className="text-sm text-slate-600">No cash flow data for the selected filters.</p>
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
        <CFCard label="Operating"  value={formatCurrency(operating)}  positive={operating  >= 0} />
        <CFCard label="Investing"  value={formatCurrency(investing)}  positive={investing  >= 0} />
        <CFCard label="Financing"  value={formatCurrency(financing)}  positive={financing  >= 0} />
        <CFCard label="Net Change" value={formatCurrency(netChange)}  positive={netChange  >= 0} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs">
        <p className="text-sm font-semibold text-slate-900 mb-3">Activity breakdown</p>

        <Section title="Operating Activities">
          <Line label="Net cash from operations" value={formatCurrency(operating)} />
          <p className="text-[11px] text-slate-400 mt-1 pl-0">
            Includes: daily sales receipts, salary payments, rent, utilities, subscriptions, and other day-to-day transactions on cash accounts.
          </p>
        </Section>

        <Section title="Investing Activities">
          <Line label="Net cash from investing" value={formatCurrency(investing)} />
          <p className="text-[11px] text-slate-400 mt-1">
            Includes: equipment purchases, property, vehicles, capex, and fixed asset transactions.
          </p>
        </Section>

        <Section title="Financing Activities">
          <Line label="Net cash from financing" value={formatCurrency(financing)} />
          <p className="text-[11px] text-slate-400 mt-1">
            Includes: loan proceeds, owner contributions, equity injections, and dividend or capital withdrawals.
          </p>
        </Section>

        <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3 space-y-2">
          <Line label="Beginning Cash Balance"  value={formatCurrency(0)} />
          <Line label="Net Change in Cash"      value={formatCurrency(netChange)} />
          <div className="border-t border-emerald-100 pt-2 flex justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Ending Cash Balance</span>
            <span className={`text-sm font-semibold ${endingCash >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(endingCash)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Note: Beginning balance is assumed 0. Import a prior-period closing balance row (Account Type: Asset, Account: "Cash", with the opening balance amount) to reflect an accurate opening position.
          </p>
        </div>
      </div>
    </div>
  );
}