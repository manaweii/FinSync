import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from 'xlsx';
import {
  buildBalanceSheet,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
    </div>
  );
}

export default function BalanceSheetReport() {
  const ctx = useOutletContext() || {};
  const { exportToExcel, exportToPDF } = ctx;
  const importDetail = ctx.importDetail || null;
  const filters = ctx.filters || EMPTY_FILTERS;
  const rows = useMemo(
    () => normalizeTransactionRows(importDetail?.rows || importDetail?.previewRows || []),
    [importDetail],
  );

  const filteredRows = useMemo(() => filterTransactions(rows, filters), [rows, filters]);

  // Build report summary rows (Metric / Value) to export
  const buildSummaryRows = () => {
    const summary = [];
    summary.push({ Metric: 'Current Assets', Value: currentAssets ?? 0 });
    summary.push({ Metric: 'Non-current Assets', Value: nonCurrentAssets ?? 0 });
    summary.push({ Metric: 'Total Assets', Value: totalAssets ?? 0 });
    summary.push({ Metric: 'Current Liabilities', Value: currentLiabilities ?? 0 });
    summary.push({ Metric: 'Long-term Liabilities', Value: longTermLiabilities ?? 0 });
    summary.push({ Metric: 'Total Liabilities', Value: totalLiabilities ?? 0 });
    summary.push({ Metric: 'Total Equity', Value: totalEquity ?? 0 });
    summary.push({ Metric: 'Working Capital', Value: workingCapital ?? 0 });
    summary.push({ Metric: 'Balance Difference', Value: balanceDiff ?? 0 });
    return summary.map(r => ({ Metric: r.Metric, Value: String(r.Value) }));
  };

  // Replace previous raw export functions with summary exporters that use shared helpers when available
  const onExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || 'balance_sheet').replace(/\s+/g, '_');
    if (exportToExcel) return exportToExcel(reportRows, filename);

    if (!reportRows || reportRows.length === 0) { alert('No data to export'); return; }
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BalanceSheet_Summary');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) { console.error('Excel export failed', err); alert('Failed to export Excel'); }
  };

  const onExportPDF = () => {
    const reportRows = buildSummaryRows();
    const title = importDetail?.fileName || 'Balance Sheet';
    if (exportToPDF) return exportToPDF(reportRows, ['Metric','Value'], title);

    if (!reportRows || reportRows.length === 0) { alert('No data to export'); return; }
    try {
      const cols = ['Metric','Value'];
      const rowsHtml = reportRows.map(r => `<tr>${cols.map(c => `<td>${String(r[c] ?? '')}</td>`).join('')}</tr>`).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial,Helvetica,sans-serif;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${title}</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
      const w = window.open('about:blank','_blank'); if (!w){ alert('Popup blocked — allow popups to export PDF'); return; }
      w.document.write(html); w.document.close(); setTimeout(()=>{ w.focus(); w.print(); }, 500);
    } catch (err) { console.error('PDF export failed', err); alert('Failed to export PDF'); }
  };

  const { currentAssets, nonCurrentAssets, currentLiabilities, longTermLiabilities, totalAssets, totalLiabilities, totalEquity, workingCapital, balanceDiff } = useMemo(() => buildBalanceSheet(filteredRows), [filteredRows]);

  const title = filters?.preset && filters?.from && filters?.to ? `Balance Sheet — ${filters.preset}` : 'Balance Sheet';

  if (!filteredRows || filteredRows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="rounded-lg border border-slate-100 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">No balance sheet data available for the selected filters.</p>
        </div>
      </div>
    );
  }

  const balanced = Math.abs(balanceDiff) < 0.01;

  return (
    <div className="space-y-5">
      <div className="px-2 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onExportPDF} className="text-xs px-3 py-1 rounded-lg border">Export PDF</button>
          <button onClick={onExportExcel} className="text-xs px-3 py-1 rounded-lg border">Export Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        <SummaryCard label="Total Assets" value={formatCurrency(totalAssets)} />
        <SummaryCard label="Current Assets" value={formatCurrency(currentAssets)} />
        <SummaryCard label="Total Liabilities" value={formatCurrency(totalLiabilities)} />
        <SummaryCard label="Total Equity" value={formatCurrency(totalEquity)} />
      </div>

      <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Assets</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Current Assets</span><span className="text-slate-700">{formatCurrency(currentAssets)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Non-current Assets</span><span className="text-slate-700">{formatCurrency(nonCurrentAssets)}</span></div>
              <div className="mt-3"><strong>Total Assets:</strong> {formatCurrency(totalAssets)}</div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Liabilities & Equity</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Current Liabilities</span><span className="text-slate-700">{formatCurrency(currentLiabilities)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Long-term Liabilities</span><span className="text-slate-700">{formatCurrency(longTermLiabilities)}</span></div>
              <div className="mt-3"><strong>Total Liabilities:</strong> {formatCurrency(totalLiabilities)}</div>
              <div className="mt-2"><strong>Total Equity:</strong> {formatCurrency(totalEquity)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Balance check</p>
              <p className={`text-xs ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}>{balanced ? 'Assets, liabilities, and equity are balanced' : `Difference: ${formatCurrency(balanceDiff)}`}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Working capital</p>
              <p className="text-xs text-slate-700">{formatCurrency(workingCapital)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
