import React from "react";

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

function PLReport() {
  return (
    <div className="space-y-5">
      {/* top summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value="NPR 58,000" change="+12.5%" changeColor="green" />
        <StatCard label="Gross Profit" value="NPR 39,500" change="+8.3%" changeColor="green" />
        <StatCard label="Operating Expenses" value="NPR 16,500" change="+3.1%" changeColor="red" />
        <StatCard label="Net Profit" value="NPR 23,000" change="+15.2%" changeColor="green" />
      </div>

      {/* detailed accounts (simple table style) */}
      <div className="mt-2 rounded-2xl border border-slate-100">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Detailed accounts</p>
        </div>

        <div className="px-5 py-4 text-xs">
          {/* Revenue */}
          <p className="text-[11px] font-semibold text-slate-700 mb-2">Revenue</p>
          <div className="space-y-1 mb-3">
            <Row label="Product Sales" value="NPR 42,500" change="+15.2%" changeColor="green" />
            <Row label="Service Revenue" value="NPR 15,500" change="+8.4%" changeColor="green" />
            <Row label="Total Revenue" value="NPR 58,000" bold change="+12.5%" changeColor="green" />
          </div>

          {/* COGS */}
          <p className="text-[11px] font-semibold text-slate-700 mb-2">Cost of Goods Sold</p>
          <div className="space-y-1 mb-3">
            <Row label="Materials & Supplies" value="NPR 12,000" change="+5.2%" changeColor="red" />
            <Row label="Direct Labor" value="NPR 6,500" change="+3.8%" changeColor="red" />
            <Row label="Total COGS" value="NPR 18,500" bold change="+4.7%" changeColor="red" />
          </div>

          {/* Operating expenses */}
          <p className="text-[11px] font-semibold text-slate-700 mb-2">Operating Expenses</p>
          <div className="space-y-1 mb-3">
            <Row label="Salaries & Wages" value="NPR 9,500" change="+2.1%" changeColor="red" />
            <Row label="Rent & Utilities" value="NPR 3,500" change="0.0%" changeColor="neutral" />
            <Row label="Marketing & Advertising" value="NPR 2,000" change="+10.5%" changeColor="red" />
            <Row label="Office Supplies" value="NPR 1,500" change="-5.6%" changeColor="green" />
            <Row label="Total Operating Expenses" value="NPR 16,500" bold change="+3.1%" changeColor="red" />
          </div>

          {/* Net income highlight */}
          <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">Net Income</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-700">NPR 23,000</p>
              <p className="text-[11px] font-medium text-emerald-600">+15.2%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, change, changeColor, bold }) {
  const changeClass =
    changeColor === "green"
      ? "text-emerald-600"
      : changeColor === "red"
      ? "text-rose-600"
      : "text-slate-500";
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>
        {label}
      </span>
      <div className="flex gap-4">
        <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>
          {value}
        </span>
        <span className={"w-12 text-right " + changeClass}>{change}</span>
      </div>
    </div>
  );
}

export default PLReport;