import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from 'xlsx';
import {
  buildProfitAndLoss,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function StatCard({ label, value, change, changeColor }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
      <p
        className={
          "text-[11px] font-medium " +
          (changeColor === "green"
            ? "text-emerald-600"
            : changeColor === "red"
            ? "text-rose-600"
            : "text-slate-500")
        }
      >
        {change}
      </p>
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

function Row({ label, value, percentOfRevenue, bold }) {
  return (
    <div className="flex justify-between">
      <div>
        <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      </div>
      <div className="flex gap-4 items-baseline">
        <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>{value}</span>
        <span className="text-xs text-slate-400">{percentOfRevenue}</span>
      </div>
    </div>
  );
}

export default function PLReport() {
  const ctx = useOutletContext() || {};
  const { exportToExcel, exportToPDF } = ctx;
   const importDetail = ctx.importDetail || null;
   const filters = ctx.filters || EMPTY_FILTERS;
   const rows = useMemo(
     () => normalizeTransactionRows(importDetail?.rows || importDetail?.previewRows || []),
     [importDetail],
   );

  // Build report summary rows (Metric / Value) to export
  const buildSummaryRows = () => {
    const summary = [];
    summary.push({ Metric: 'Total Revenue', Value: revenueTotal ?? 0 });
    summary.push({ Metric: 'COGS', Value: cogsTotal ?? 0 });
    summary.push({ Metric: 'Gross Profit', Value: (revenueTotal - cogsTotal) ?? 0 });
    summary.push({ Metric: 'Sales & Marketing', Value: salesAndMarketing ?? 0 });
    summary.push({ Metric: 'General & Admin', Value: generalAndAdmin ?? 0 });
    summary.push({ Metric: 'R&D', Value: rnd ?? 0 });
    summary.push({ Metric: 'Other Income', Value: otherIncome ?? 0 });
    summary.push({ Metric: 'Tax', Value: tax ?? 0 });
    summary.push({ Metric: 'Operating Profit', Value: operatingProfit ?? 0 });
    summary.push({ Metric: 'Net Profit', Value: netProfit ?? 0 });
    return summary.map(r => ({ Metric: r.Metric, Value: String(r.Value) }));
  };

  const handleExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || 'pl_report').replace(/\s+/g, '_');
    if (exportToExcel) return exportToExcel(reportRows, filename);
    // fallback local XLSX
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) { console.error(err); alert('Failed to export Excel'); }
  };

  const handleExportPDF = () => {
    const reportRows = buildSummaryRows();
    const title = importDetail?.fileName || 'P&L Report';
    if (exportToPDF) return exportToPDF(reportRows, ['Metric','Value'], title);
    // fallback: simple print
    try {
      const cols = ['Metric','Value'];
      const rowsHtml = reportRows.map(r => `<tr>${cols.map(c=>`<td>${String(r[c]??'')}</td>`).join('')}</tr>`).join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial,Helvetica,sans-serif;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${title}</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
      const w = window.open('about:blank','_blank'); if (!w){ alert('Popup blocked — allow popups to export PDF'); return; }
      w.document.write(html); w.document.close(); setTimeout(()=>{ w.focus(); w.print(); }, 500);
    } catch (err) { console.error(err); alert('Failed to export PDF'); }
  };

  // Apply filters: date range, categories, regions
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return filterTransactions(rows, filters);
  }, [rows, filters]);

  // Determine amounts
  const {
    revenueTotal,
    cogsTotal,
    salesAndMarketing,
    generalAndAdmin,
    rnd,
    otherIncome,
    tax,
    netProfit,
    operatingProfit,
  } = useMemo(() => buildProfitAndLoss(filteredRows), [filteredRows]);

  const pctOf = (val, base) => {
    if (!Number.isFinite(val) || !Number.isFinite(base) || base === 0) return "—";
    return ((val / base) * 100).toFixed(1) + "%";
  };

  // Title
  const title = filters?.preset && filters?.from && filters?.to ? `Profit & Loss — ${filters.preset}` : 'Profit & Loss Statement';

  // empty state
  if (!filteredRows || filteredRows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <div className="rounded-lg border border-slate-100 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">No data available for the selected filters.</p>
          <p className="text-xs text-slate-400 mt-2">Try selecting a different period, category, or import source.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="px-2 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="text-xs px-3 py-1 rounded-lg border">Export PDF</button>
          <button onClick={handleExportExcel} className="text-xs px-3 py-1 rounded-lg border">Export Excel</button>
        </div>
      </div>

      {/* top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <StatCard label="Total Income" value={formatCurrency(revenueTotal)} change={pctOf(revenueTotal, Math.max(1, revenueTotal))} changeColor="green" />
        <StatCard label="Gross Profit" value={formatCurrency(revenueTotal - cogsTotal)} change={pctOf(revenueTotal - cogsTotal, Math.max(1, revenueTotal))} changeColor="green" />
        <StatCard label="Operating Profit" value={formatCurrency(operatingProfit)} change={pctOf(operatingProfit, Math.max(1, revenueTotal))} changeColor={operatingProfit>=0 ? 'green' : 'red'} />
        <StatCard label="Net Profit" value={formatCurrency(netProfit)} change={pctOf(netProfit, Math.max(1, revenueTotal))} changeColor={netProfit>=0 ? 'green' : 'red'} />
      </div>

      {/* detailed accounts */}
      <div className="mt-2 rounded-2xl border border-slate-100 bg-white">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Detailed accounts</p>
        </div>

        <div className="px-5 py-4 text-xs">
          <Section title="Revenue">
            <Row label="Total Income" value={formatCurrency(revenueTotal)} percentOfRevenue={pctOf(revenueTotal, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Cost of Goods Sold">
            <Row label="Total COGS" value={formatCurrency(cogsTotal)} percentOfRevenue={pctOf(cogsTotal, Math.max(1, revenueTotal))} bold />
            <Row label="Gross Profit" value={formatCurrency(revenueTotal - cogsTotal)} percentOfRevenue={pctOf(revenueTotal - cogsTotal, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Operating Expenses">
            <Row label="Sales & Marketing" value={formatCurrency(salesAndMarketing)} percentOfRevenue={pctOf(salesAndMarketing, Math.max(1, revenueTotal))} />
            <Row label="General & Admin" value={formatCurrency(generalAndAdmin)} percentOfRevenue={pctOf(generalAndAdmin, Math.max(1, revenueTotal))} />
            <Row label="R&D / Product" value={formatCurrency(rnd)} percentOfRevenue={pctOf(rnd, Math.max(1, revenueTotal))} />
            <Row label="Operating Profit (EBIT)" value={formatCurrency(operatingProfit)} percentOfRevenue={pctOf(operatingProfit, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Other / Taxes">
            <Row label="Other Income / Expense" value={formatCurrency(otherIncome)} percentOfRevenue={pctOf(otherIncome, Math.max(1, revenueTotal))} />
            <Row label="Profit Before Tax" value={formatCurrency(operatingProfit + otherIncome)} percentOfRevenue={pctOf(operatingProfit + otherIncome, Math.max(1, revenueTotal))} />
            <Row label="Tax Expense" value={formatCurrency(tax)} percentOfRevenue={pctOf(tax, Math.max(1, revenueTotal))} />
            <Row label="Net Profit / (Loss)" value={formatCurrency(netProfit)} percentOfRevenue={pctOf(netProfit, Math.max(1, revenueTotal))} bold />
          </Section>
        </div>
      </div>
    </div>
  );
}
