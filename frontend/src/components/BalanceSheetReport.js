import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import * as XLSX from 'xlsx';
import { parseISO, isWithinInterval } from 'date-fns';

function SummaryCard({ label, value, change }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
      <p className="text-[11px] font-medium text-emerald-600">{change}</p>
    </div>
  );
}

function safeNumber(v) {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const parsed = parseFloat(String(v).replace(/[ ,\u00A0]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function sumColumns(rows, candidates) {
  if (!rows || rows.length === 0) return 0;
  let total = 0;
  for (const r of rows) {
    for (const key of Object.keys(r)) {
      const k = key.toLowerCase();
      if (candidates.some((c) => k.includes(c))) {
        const n = safeNumber(r[key]);
        if (!Number.isNaN(n)) total += n;
      }
    }
  }
  return total;
}

function applyFilters(rows, filters) {
  if (!rows) return [];
  return rows.filter((r) => {
    if (filters?.from || filters?.to) {
      const dateKey = Object.keys(r).find((k) => k.toLowerCase().includes('date'));
      if (dateKey && r[dateKey]) {
        try {
          const d = parseISO(String(r[dateKey]));
          const from = filters.from ? parseISO(filters.from) : null;
          const to = filters.to ? parseISO(filters.to) : null;
          if (from && to) {
            if (!isWithinInterval(d, { start: from, end: to })) return false;
          } else if (from) {
            if (d < from) return false;
          } else if (to) {
            if (d > to) return false;
          }
        } catch (e) {}
      }
    }

    if (filters?.categories && filters.categories.length > 0) {
      const catKey = Object.keys(r).find((k) => k.toLowerCase().includes('category') || k.toLowerCase().includes('segment'));
      if (catKey) {
        const val = String(r[catKey] || '').toLowerCase();
        const match = filters.categories.some((c) => val.includes(String(c).toLowerCase()));
        if (!match) return false;
      }
    }

    if (filters?.regions && filters.regions.length > 0) {
      const regKey = Object.keys(r).find((k) => k.toLowerCase().includes('region') || k.toLowerCase().includes('location'));
      if (regKey) {
        const val = String(r[regKey] || '').toLowerCase();
        const match = filters.regions.some((c) => val.includes(String(c).toLowerCase()));
        if (!match) return false;
      }
    }

    return true;
  });
}

export default function BalanceSheetReport() {
  const ctx = useOutletContext() || {};
  const { exportToExcel, exportToPDF } = ctx;
  const importDetail = ctx.importDetail || null;
  const filters = ctx.filters || {};
  const rows = importDetail?.previewRows || [];
  const totals = importDetail?.totals || null;

  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);

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

  const { currentAssets, nonCurrentAssets, currentLiabilities, longTermLiabilities, totalAssets, totalLiabilities, totalEquity, workingCapital, balanceDiff } = useMemo(() => {
    // candidate keywords
    const currentAssetCandidates = ["cash", "bank", "receivable", "accounts receivable", "inventory", "prepaid"];
    const nonCurrentAssetCandidates = ["property", "equipment", "ppe", "fixed", "long-term asset", "long term asset"];
    const currentLiabilityCandidates = ["payable", "accounts payable", "short-term", "short term", "accrued"];
    const longTermLiabilityCandidates = ["loan", "long-term", "long term", "mortgage"];

    const ca = sumColumns(filteredRows, currentAssetCandidates);
    const nca = sumColumns(filteredRows, nonCurrentAssetCandidates);
    const cl = sumColumns(filteredRows, currentLiabilityCandidates);
    const ltl = sumColumns(filteredRows, longTermLiabilityCandidates);

    const taFromTotals = totals?.Assets ?? totals?.assets ?? null;
    const tlFromTotals = totals?.Liabilities ?? totals?.liabilities ?? null;

    const ta = Number.isFinite(taFromTotals) ? Number(taFromTotals) : (ca + nca);
    const tl = Number.isFinite(tlFromTotals) ? Number(tlFromTotals) : (cl + ltl);
    const equity = Number.isFinite(ta) && Number.isFinite(tl) ? ta - tl : NaN;

    return {
      currentAssets: Number.isFinite(ca) ? ca : 0,
      nonCurrentAssets: Number.isFinite(nca) ? nca : 0,
      currentLiabilities: Number.isFinite(cl) ? cl : 0,
      longTermLiabilities: Number.isFinite(ltl) ? ltl : 0,
      totalAssets: Number.isFinite(ta) ? ta : 0,
      totalLiabilities: Number.isFinite(tl) ? tl : 0,
      totalEquity: Number.isFinite(equity) ? equity : 0,
      workingCapital: Number.isFinite(ca) && Number.isFinite(cl) ? ca - cl : 0,
      balanceDiff: Number.isFinite(ta) && Number.isFinite(tl) ? ta - tl : 0,
    };
  }, [filteredRows, totals]);

  const fmt = (v) => {
    if (v == null || Number.isNaN(v)) return "—";
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
        <SummaryCard label="Total Assets" value={`NPR ${fmt(totalAssets)}`} />
        <SummaryCard label="Current Assets" value={`NPR ${fmt(currentAssets)}`} />
        <SummaryCard label="Total Liabilities" value={`NPR ${fmt(totalLiabilities)}`} />
        <SummaryCard label="Total Equity" value={`NPR ${fmt(totalEquity)}`} />
      </div>

      <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Assets</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Current Assets</span><span className="text-slate-700">NPR {fmt(currentAssets)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Non-current Assets</span><span className="text-slate-700">NPR {fmt(nonCurrentAssets)}</span></div>
              <div className="mt-3"><strong>Total Assets:</strong> NPR {fmt(totalAssets)}</div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Liabilities & Equity</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Current Liabilities</span><span className="text-slate-700">NPR {fmt(currentLiabilities)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Long-term Liabilities</span><span className="text-slate-700">NPR {fmt(longTermLiabilities)}</span></div>
              <div className="mt-3"><strong>Total Liabilities:</strong> NPR {fmt(totalLiabilities)}</div>
              <div className="mt-2"><strong>Total Equity:</strong> NPR {fmt(totalEquity)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Balance check</p>
              <p className={`text-xs ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}>{balanced ? 'Assets and Liabilities are balanced' : `Difference: NPR ${fmt(balanceDiff)}`}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Working capital</p>
              <p className="text-xs text-slate-700">NPR {fmt(workingCapital)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}