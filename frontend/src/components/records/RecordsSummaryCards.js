import React from "react";

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function RecordsSummaryCards({
  dataSourceCount,
  totalRows,
  showingRows,
}) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <SummaryCard label="Data Sources" value={dataSourceCount} />
      <SummaryCard label="Total Rows" value={totalRows} />
      <SummaryCard label="Showing" value={showingRows} />
    </div>
  );
}
