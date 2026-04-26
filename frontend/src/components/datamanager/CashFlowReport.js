import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from 'xlsx';
import {
  buildCashFlow,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function CFCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
    </div>
  );
}

export default function CashFlowReport() {
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
    summary.push({ Metric: 'Operating Cash Flow', Value: operating ?? 0 });
    summary.push({ Metric: 'Investing Cash Flow', Value: investing ?? 0 });
    summary.push({ Metric: 'Financing Cash Flow', Value: financing ?? 0 });
    summary.push({ Metric: 'Net Change in Cash', Value: netChange ?? 0 });
    summary.push({ Metric: 'Ending Cash Balance', Value: endingCash ?? 0 });
    return summary.map(r => ({ Metric: r.Metric, Value: String(r.Value) }));
  };

  // Export helpers use filteredRows (report view)
  const onExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || 'cashflow').replace(/\s+/g, '_');
    if (exportToExcel) return exportToExcel(reportRows, filename);

    if (!reportRows || reportRows.length === 0) { alert('No data to export'); return; }
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CashFlow_Summary');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) {
      console.error('Excel export failed', err);
      alert('Failed to export Excel');
    }
  };

  const onExportPDF = () => {
    const reportRows = buildSummaryRows();
    const title = importDetail?.fileName || 'Cash Flow';
    if (exportToPDF) return exportToPDF(reportRows, ['Metric','Value'], title);

    if (!reportRows || reportRows.length === 0) { alert('No data to export'); return; }
    try {
      const cols = ['Metric','Value'];
      const rowsHtml = reportRows.map(r => `<tr>${cols.map(c => `<td>${String(r[c] ?? '')}</td>`).join('')}</tr>`).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial,Helvetica,sans-serif;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${title}</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
      const w = window.open('about:blank','_blank');
      if (!w) { alert('Popup blocked — allow popups to export PDF'); return; }
      w.document.write(html);
      w.document.close();
      setTimeout(()=>{ w.focus(); w.print(); }, 500);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Failed to export PDF');
    }
  };

  const { operating, investing, financing, netChange, endingCash } = useMemo(() => buildCashFlow(filteredRows), [filteredRows]);

  const title = filters?.preset && filters?.from && filters?.to ? `Cash Flow — ${filters.preset}` : 'Cash Flow Statement';

  if (!filteredRows || filteredRows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="rounded-lg border border-slate-100 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">No cash flow data available for the selected filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="px-2 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onExportPDF} className="text-xs px-3 py-1 rounded-lg border">Export PDF</button>
          <button onClick={onExportExcel} className="text-xs px-3 py-1 rounded-lg border">Export Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <CFCard label="Operating Cash Flow" value={formatCurrency(operating)} />
        <CFCard label="Investing Cash Flow" value={formatCurrency(investing)} />
        <CFCard label="Financing Cash Flow" value={formatCurrency(financing)} />
        <CFCard label="Net Change" value={formatCurrency(netChange)} />
      </div>

      <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs">
        <p className="text-sm font-semibold text-slate-900 mb-3">Detailed accounts</p>

        <Section title="Operating Activities">
          <Line label="Operating Cash Movement" value={formatCurrency(operating)} />
        </Section>

        <Section title="Investing Activities">
          <Line label="Investing Cash Movement" value={formatCurrency(investing)} />
        </Section>

        <Section title="Financing Activities">
          <Line label="Financing Cash Movement" value={formatCurrency(financing)} />
        </Section>

        <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3">
          <Line label="Beginning Cash Balance" value={formatCurrency(0)} />
          <Line label="Net Change in Cash" value={formatCurrency(netChange)} />
          <div className="mt-2 flex justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Ending Cash Balance</span>
            <span className="text-sm font-semibold text-emerald-700">{formatCurrency(endingCash)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold text-slate-700 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
