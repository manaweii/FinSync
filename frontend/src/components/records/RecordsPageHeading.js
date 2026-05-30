import React from "react";

export default function RecordsPageHeading() {
  return (
    <>
      <div className="mb-2 text-center">
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
          Record
        </span>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Financial Records.
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
          All CSV/Excel imports plus online checkout records are shown in one
          table, so you can review every row from a single page.
        </p>
      </div>
    </>
  );
}
