import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  buildProfitAndLoss,
  filterTransactions,
  formatCurrency,
  normalizeTransactionRows,
  validateRows,
} from "../../utils/financialData";

const EMPTY_FILTERS = {};

function StatCard({ label, value, sub, color = "neutral" }) {
  const colors = { green: "text-emerald-600", red: "text-rose-600", neutral: "text-slate-500" };
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
      {sub && <p className={`text-[11px] font-medium ${colors[color]}`}>{sub}</p>}
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

function Row({ label, value, pct, bold, indent = false }) {
  return (
    <div className={`flex justify-between ${indent ? "pl-3" : ""}`}>
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>{label}</span>
      <div className="flex gap-4 items-baseline">
        <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>{value}</span>
        {pct && <span className="text-[11px] text-slate-400 w-12 text-right">{pct}</span>}
      </div>
    </div>
  );
}

function pctOf(val, base) {
  if (!Number.isFinite(val) || !Number.isFinite(base) || base === 0) return "—";
  return `${((val / base) * 100).toFixed(1)}%`;
}

export default function PLReport() {
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
  const pl           = useMemo(() => buildProfitAndLoss(filteredRows), [filteredRows]);

  const {
    revenueTotal, otherIncomeTotal,
    cogsTotal, salesAndMarketing, generalAndAdmin, rnd,
    depreciationAmort, interestExpense, tax, otherExpense,
    grossProfit, ebitda, operatingProfit, profitBeforeTax, netProfit,
  } = pl;

  const title = filters?.preset && filters?.from && filters?.to
    ? `Profit & Loss — ${filters.preset}` : "Profit & Loss Statement";

  const buildSummaryRows = () => [
    { Metric: "Total Revenue",            Value: revenueTotal },
    { Metric: "Other Income",             Value: otherIncomeTotal },
    { Metric: "COGS",                     Value: cogsTotal },
    { Metric: "Gross Profit",             Value: grossProfit },
    { Metric: "Sales & Marketing",        Value: salesAndMarketing },
    { Metric: "General & Admin",          Value: generalAndAdmin },
    { Metric: "R&D",                      Value: rnd },
    { Metric: "EBITDA",                   Value: ebitda },
    { Metric: "Depreciation",             Value: depreciationAmort },
    { Metric: "Operating Profit (EBIT)",  Value: operatingProfit },
    { Metric: "Other Expense",            Value: otherExpense },
    { Metric: "Interest Expense",         Value: interestExpense },
    { Metric: "Profit Before Tax",        Value: profitBeforeTax },
    { Metric: "Tax",                      Value: tax },
    { Metric: "Net Profit",               Value: netProfit },
  ].map(r => ({ Metric: r.Metric, Value: String(r.Value) }));

  const handleExportExcel = () => {
    const reportRows = buildSummaryRows();
    const filename = (importDetail?.fileName || "pl_report").replace(/\s+/g, "_");
    if (exportToExcel) return exportToExcel(reportRows, filename);
    try {
      const ws = XLSX.utils.json_to_sheet(reportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PL_Summary");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) { console.error(err); alert("Failed to export Excel"); }
  };

  const handleExportPDF = () => {
    const reportRows = buildSummaryRows();
    const cols = ["Metric", "Value"];
    if (exportToPDF) return exportToPDF(reportRows, cols, title);
    try {
      const rowsHtml = reportRows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`).join("");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${title}</h2><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
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
          <p className="text-sm text-slate-600">No data available for the selected filters.</p>
          <p className="text-xs text-slate-400 mt-2">Try a different period or import source.</p>
        </div>
      </div>
    );
  }

  const base = Math.max(1, revenueTotal);

  return (
    <div className="space-y-5">
      <div className="px-2 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={handleExportPDF}   className="text-xs px-3 py-1 rounded-lg border hover:bg-slate-50">Export PDF</button>
          <button onClick={handleExportExcel} className="text-xs px-3 py-1 rounded-lg border hover:bg-slate-50">Export Excel</button>
        </div>
      </div>

      {warnings.filter(w => w.severity === "warn").length > 0 && (
        <div className="mx-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700 space-y-0.5">
          {warnings.filter(w => w.severity === "warn").slice(0, 3).map((w, i) => (
            <p key={i}>⚠ {w.message}</p>
          ))}
          {warnings.filter(w => w.severity === "warn").length > 3 && (
            <p>…and {warnings.filter(w => w.severity === "warn").length - 3} more</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <StatCard label="Total Revenue"     value={formatCurrency(revenueTotal)}   sub={pctOf(revenueTotal, base)}   color="green" />
        <StatCard label="Gross Profit"      value={formatCurrency(grossProfit)}    sub={pctOf(grossProfit, base)}    color={grossProfit >= 0 ? "green" : "red"} />
        <StatCard label="EBITDA"            value={formatCurrency(ebitda)}         sub={pctOf(ebitda, base)}         color={ebitda >= 0 ? "green" : "red"} />
        <StatCard label="Net Profit / Loss" value={formatCurrency(netProfit)}      sub={pctOf(netProfit, base)}      color={netProfit >= 0 ? "green" : "red"} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Detailed accounts</p>
        </div>
        <div className="px-5 py-4 text-xs">
          <Section title="Revenue">
            <Row label="Operating Revenue" value={formatCurrency(revenueTotal)}     pct={pctOf(revenueTotal, base)}     bold />
            {otherIncomeTotal !== 0 && <Row label="Other Income" value={formatCurrency(otherIncomeTotal)} pct={pctOf(otherIncomeTotal, base)} indent />}
          </Section>

          <Section title="Cost of Goods Sold">
            <Row label="Total COGS"    value={formatCurrency(cogsTotal)}    pct={pctOf(cogsTotal, base)} />
            <Row label="Gross Profit"  value={formatCurrency(grossProfit)}  pct={pctOf(grossProfit, base)} bold />
          </Section>

          <Section title="Operating Expenses">
            {salesAndMarketing !== 0 && <Row label="Sales & Marketing" value={formatCurrency(salesAndMarketing)} pct={pctOf(salesAndMarketing, base)} indent />}
            {generalAndAdmin   !== 0 && <Row label="General & Admin"   value={formatCurrency(generalAndAdmin)}   pct={pctOf(generalAndAdmin, base)}   indent />}
            {rnd               !== 0 && <Row label="R&D / Product"     value={formatCurrency(rnd)}               pct={pctOf(rnd, base)}               indent />}
            <Row label="EBITDA"                      value={formatCurrency(ebitda)}          pct={pctOf(ebitda, base)}          bold />
            {depreciationAmort !== 0 && <Row label="Depreciation & Amortization" value={formatCurrency(depreciationAmort)} pct={pctOf(depreciationAmort, base)} indent />}
            <Row label="Operating Profit (EBIT)"     value={formatCurrency(operatingProfit)} pct={pctOf(operatingProfit, base)} bold />
          </Section>

          <Section title="Other / Financing / Tax">
            {otherExpense    !== 0 && <Row label="Other Expense"    value={formatCurrency(otherExpense)}    pct={pctOf(otherExpense, base)}    indent />}
            {interestExpense !== 0 && <Row label="Interest Expense" value={formatCurrency(interestExpense)} pct={pctOf(interestExpense, base)} indent />}
            <Row label="Profit Before Tax"           value={formatCurrency(profitBeforeTax)} pct={pctOf(profitBeforeTax, base)} />
            {tax             !== 0 && <Row label="Tax Expense"      value={formatCurrency(tax)}             pct={pctOf(tax, base)}             indent />}
            <Row label="Net Profit / (Loss)"         value={formatCurrency(netProfit)}       pct={pctOf(netProfit, base)}       bold />
          </Section>
        </div>
      </div>
    </div>
  );
}