import React from "react";

function CFCard({ label, value, change }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
      <p className="text-[11px] font-medium text-emerald-600">{change}</p>
    </div>
  );
}

function CashFlowReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <CFCard label="Operating Cash Flow" value="NPR 42,000" change="+18.5%" />
        <CFCard label="Investing Cash Flow" value="NPR -8,500" change="Stable" />
        <CFCard label="Financing Cash Flow" value="NPR -5,000" change="Stable" />
        <CFCard label="Cash on Hand" value="NPR 63,500" change="+18.4%" />
      </div>

      <div className="mt-2 rounded-2xl border border-slate-100 px-5 py-4 text-xs">
        <p className="text-sm font-semibold text-slate-900 mb-3">Detailed accounts</p>

        <Section title="Operating Activities">
          <Line label="Cash from Customers" value="NPR 55,000" />
          <Line label="Cash to Suppliers" value="NPR -8,000" />
          <Line label="Cash to Employees" value="NPR -5,000" />
          <Line label="Net Operating Cash Flow" value="NPR 42,000" bold />
        </Section>

        <Section title="Investing Activities">
          <Line label="Purchase of Equipment" value="NPR -8,500" />
          <Line label="Net Investing Cash Flow" value="NPR -8,500" bold />
        </Section>

        <Section title="Financing Activities">
          <Line label="Loan Repayment" value="NPR -5,000" />
          <Line label="Net Financing Cash Flow" value="NPR -5,000" bold />
        </Section>

        <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3">
          <Line label="Beginning Cash Balance" value="NPR 35,000" />
          <Line label="Net Change in Cash" value="NPR 28,500" />
          <div className="mt-2 flex justify-between">
            <span className="text-[11px] font-semibold text-slate-700">
              Ending Cash Balance
            </span>
            <span className="text-sm font-semibold text-emerald-700">
              NPR 63,500
            </span>
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

function Line({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-500"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-slate-800" : "text-slate-700"}>
        {value}
      </span>
    </div>
  );
}

export default CashFlowReport;
