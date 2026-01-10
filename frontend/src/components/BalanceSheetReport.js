import React from "react";

function SummaryCard({ label, value, change }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{value}</p>
      <p className="text-[11px] font-medium text-emerald-600">{change}</p>
    </div>
  );
}

function BalanceSheetReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total Assets" value="NPR 152,000" change="+4.8%" />
        <SummaryCard label="Current Assets" value="NPR 85,000" change="+6.2%" />
        <SummaryCard label="Total Liabilities" value="NPR 40,000" change="-2.4%" />
        <SummaryCard label="Total Equity" value="NPR 112,000" change="+7.1%" />
      </div>

      <div className="mt-2 rounded-2xl border border-slate-100 px-5 py-4 text-xs">
        <p className="text-sm font-semibold text-slate-900 mb-3">Detailed accounts</p>

        <div className="grid grid-cols-2 gap-8">
          {/* Assets column */}
          <div>
            <Section title="Current Assets">
              <Line label="Cash & Equivalents" value="NPR 63,500" />
              <Line label="Accounts Receivable" value="NPR 18,000" />
              <Line label="Inventory" value="NPR 3,500" />
              <Line label="Total Current Assets" value="NPR 85,000" bold />
            </Section>

            <Section title="Fixed Assets">
              <Line label="Property & Equipment" value="NPR 67,000" />
              <Line label="Total Fixed Assets" value="NPR 67,000" bold />
            </Section>

            <HighlightRow label="Total Assets" value="NPR 152,000" />
          </div>

          {/* Liabilities + Equity column */}
          <div>
            <Section title="Current Liabilities">
              <Line label="Accounts Payable" value="NPR 18,000" />
              <Line label="Short-term Debt" value="NPR 7,000" />
              <Line label="Total Current Liabilities" value="NPR 25,000" bold />
            </Section>

            <Section title="Long-term Liabilities">
              <Line label="Long-term Debt" value="NPR 15,000" />
              <Line label="Total Long-term Liabilities" value="NPR 15,000" bold />
            </Section>

            <Section title="Equity">
              <Line label="Owner's Equity" value="NPR 89,000" />
              <Line label="Retained Earnings" value="NPR 23,000" />
              <Line label="Total Equity" value="NPR 112,000" bold />
            </Section>

            <HighlightRow label="Total Liabilities & Equity" value="NPR 152,000" />
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

function HighlightRow({ label, value }) {
  return (
    <div className="mt-3 rounded-xl bg-sky-50/60 border border-sky-100 px-4 py-3 flex justify-between items-center">
      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-sky-700">{value}</span>
    </div>
  );
}

export default BalanceSheetReport;
