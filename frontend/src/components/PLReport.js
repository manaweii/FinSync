import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { parseISO, isWithinInterval } from 'date-fns';

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

function safeNumber(v) {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const parsed = parseFloat(String(v).replace(/[ ,\u00A0]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function sumColumns(rows, columnNameCandidates) {
  if (!rows || rows.length === 0) return 0;
  let total = 0;
  for (const r of rows) {
    for (const key of Object.keys(r)) {
      const k = key.toLowerCase();
      if (columnNameCandidates.some((c) => k.includes(c))) {
        const n = safeNumber(r[key]);
        if (!Number.isNaN(n)) total += n;
      }
    }
  }
  return total;
}

function findTotalFromTotalsObject(totals, keywordCandidates) {
  if (!totals) return null;
  for (const k of Object.keys(totals)) {
    const kl = k.toLowerCase();
    if (keywordCandidates.some((c) => kl.includes(c))) return totals[k];
  }
  return null;
}

export default function PLReport() {
  const ctx = useOutletContext() || {};
  const importDetail = ctx.importDetail || null;
  const filters = ctx.filters || {};
  const rows = importDetail?.previewRows || [];
  const totals = importDetail?.totals || null;

  // Apply filters: date range, categories, regions
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return rows.filter((r) => {
      // Date filtering: try to find a date field and parse
      if (filters.from || filters.to) {
        const dateFieldKey = Object.keys(r).find((k) => k.toLowerCase().includes('date'));
        if (dateFieldKey && r[dateFieldKey]) {
          try {
            const d = parseISO(String(r[dateFieldKey]));
            const from = filters.from ? parseISO(filters.from) : null;
            const to = filters.to ? parseISO(filters.to) : null;
            if (from && to) {
              if (!isWithinInterval(d, { start: from, end: to })) return false;
            } else if (from) {
              if (d < from) return false;
            } else if (to) {
              if (d > to) return false;
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // Category filter: check common category columns
      if (filters.categories && filters.categories.length > 0) {
        const categoryKey = Object.keys(r).find((k) => k.toLowerCase().includes('category') || k.toLowerCase().includes('segment') || k.toLowerCase().includes('class'));
        if (categoryKey) {
          const val = String(r[categoryKey] || '').toLowerCase();
          const match = filters.categories.some((c) => val.includes(String(c).toLowerCase()));
          if (!match) return false;
        }
      }

      // Region filter
      if (filters.regions && filters.regions.length > 0) {
        const regionKey = Object.keys(r).find((k) => k.toLowerCase().includes('region') || k.toLowerCase().includes('location'));
        if (regionKey) {
          const val = String(r[regionKey] || '').toLowerCase();
          const match = filters.regions.some((c) => val.includes(String(c).toLowerCase()));
          if (!match) return false;
        }
      }

      return true;
    });
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
  } = useMemo(() => {
    const revenueKeywords = ["revenue", "sale", "sales", "income", "amount"];
    const cogsKeywords = ["cogs", "cost", "costofgoods", "cost_of_goods", "costofgoodsold", "cost of goods", "materials", "direct cost"];
    const salesMktKeywords = ["marketing", "sales", "advert"];
    const gnaKeywords = ["admin", "general", "overhead", "office"];
    const rndKeywords = ["rnd", "research", "product", "development"];
    const otherKeywords = ["other", "misc", "interest"];
    const taxKeywords = ["tax", "vat", "withholding"];

    const revFromTotals = findTotalFromTotalsObject(totals, revenueKeywords);
    const cogsFromTotals = findTotalFromTotalsObject(totals, cogsKeywords);

    const rev = revFromTotals != null ? Number(revFromTotals) : sumColumns(filteredRows, revenueKeywords);
    const cogs = cogsFromTotals != null ? Number(cogsFromTotals) : sumColumns(filteredRows, cogsKeywords);

    const sAndM = sumColumns(filteredRows, salesMktKeywords);
    const gAndA = sumColumns(filteredRows, gnaKeywords);
    const rAndD = sumColumns(filteredRows, rndKeywords);

    const oth = sumColumns(filteredRows, otherKeywords);
    const tx = sumColumns(filteredRows, taxKeywords);

    const gross = Number.isFinite(rev) && Number.isFinite(cogs) ? rev - cogs : NaN;
    const opProfit = Number.isFinite(gross) && Number.isFinite(sAndM) && Number.isFinite(gAndA) && Number.isFinite(rAndD) ? gross - (sAndM + gAndA + rAndD) : NaN;
    const pbt = Number.isFinite(opProfit) && Number.isFinite(oth) ? opProfit + oth : NaN;
    const net = Number.isFinite(pbt) && Number.isFinite(tx) ? pbt - tx : NaN;

    return {
      revenueTotal: Number.isFinite(rev) ? rev : 0,
      cogsTotal: Number.isFinite(cogs) ? cogs : 0,
      salesAndMarketing: Number.isFinite(sAndM) ? sAndM : 0,
      generalAndAdmin: Number.isFinite(gAndA) ? gAndA : 0,
      rnd: Number.isFinite(rAndD) ? rAndD : 0,
      otherIncome: Number.isFinite(oth) ? oth : 0,
      tax: Number.isFinite(tx) ? tx : 0,
      netProfit: Number.isFinite(net) ? net : 0,
      operatingProfit: Number.isFinite(opProfit) ? opProfit : 0,
    };
  }, [filteredRows, totals]);

  const fmt = (v) => {
    if (v == null || Number.isNaN(v)) return "—";
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
          <button className="text-xs px-3 py-1 rounded-lg border">Export PDF</button>
          <button className="text-xs px-3 py-1 rounded-lg border">Export Excel</button>
        </div>
      </div>

      {/* top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-2">
        <StatCard label="Total Revenue" value={`NPR ${fmt(revenueTotal)}`} change={pctOf(revenueTotal, Math.max(1, revenueTotal))} changeColor="green" />
        <StatCard label="Gross Profit" value={`NPR ${fmt(revenueTotal - cogsTotal)}`} change={pctOf(revenueTotal - cogsTotal, Math.max(1, revenueTotal))} changeColor="green" />
        <StatCard label="Operating Profit" value={`NPR ${fmt(operatingProfit)}`} change={pctOf(operatingProfit, Math.max(1, revenueTotal))} changeColor={operatingProfit>=0 ? 'green' : 'red'} />
        <StatCard label="Net Profit" value={`NPR ${fmt(netProfit)}`} change={pctOf(netProfit, Math.max(1, revenueTotal))} changeColor={netProfit>=0 ? 'green' : 'red'} />
      </div>

      {/* detailed accounts */}
      <div className="mt-2 rounded-2xl border border-slate-100 bg-white">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Detailed accounts</p>
        </div>

        <div className="px-5 py-4 text-xs">
          <Section title="Revenue">
            <Row label="Total Revenue" value={`NPR ${fmt(revenueTotal)}`} percentOfRevenue={pctOf(revenueTotal, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Cost of Goods Sold">
            <Row label="Total COGS" value={`NPR ${fmt(cogsTotal)}`} percentOfRevenue={pctOf(cogsTotal, Math.max(1, revenueTotal))} bold />
            <Row label="Gross Profit" value={`NPR ${fmt(revenueTotal - cogsTotal)}`} percentOfRevenue={pctOf(revenueTotal - cogsTotal, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Operating Expenses">
            <Row label="Sales & Marketing" value={`NPR ${fmt(salesAndMarketing)}`} percentOfRevenue={pctOf(salesAndMarketing, Math.max(1, revenueTotal))} />
            <Row label="General & Admin" value={`NPR ${fmt(generalAndAdmin)}`} percentOfRevenue={pctOf(generalAndAdmin, Math.max(1, revenueTotal))} />
            <Row label="R&D / Product" value={`NPR ${fmt(rnd)}`} percentOfRevenue={pctOf(rnd, Math.max(1, revenueTotal))} />
            <Row label="Operating Profit (EBIT)" value={`NPR ${fmt(operatingProfit)}`} percentOfRevenue={pctOf(operatingProfit, Math.max(1, revenueTotal))} bold />
          </Section>

          <Section title="Other / Taxes">
            <Row label="Other Income / Expense" value={`NPR ${fmt(otherIncome)}`} percentOfRevenue={pctOf(otherIncome, Math.max(1, revenueTotal))} />
            <Row label="Profit Before Tax" value={`NPR ${fmt(operatingProfit + otherIncome)}`} percentOfRevenue={pctOf(operatingProfit + otherIncome, Math.max(1, revenueTotal))} />
            <Row label="Tax Expense" value={`NPR ${fmt(tax)}`} percentOfRevenue={pctOf(tax, Math.max(1, revenueTotal))} />
            <Row label="Net Profit / (Loss)" value={`NPR ${fmt(netProfit)}`} percentOfRevenue={pctOf(netProfit, Math.max(1, revenueTotal))} bold />
          </Section>
        </div>
      </div>
    </div>
  );
}