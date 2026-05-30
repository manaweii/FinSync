import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BanknotesIcon,
  BriefcaseIcon,
  PlusIcon,
  ReceiptPercentIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

/** Format a number as "Rs. 1,234.56" */
const fmt = (v) =>
  `Rs. ${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function MetricCard({
  icon,
  label,
  value,
  children,
  loading,
  accent = "cyan",
}) {
  const accentMap = {
    cyan: {
      iconBg: "bg-cyan-50",
      iconText: "text-cyan-500",
      bar: "bg-cyan-400",
      ring: "ring-cyan-100",
    },
    emerald: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-500",
      bar: "bg-emerald-400",
      ring: "ring-emerald-100",
    },
  };
  const a = accentMap[accent] || accentMap.cyan;

  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Thin accent bar on top */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${a.bar}`} />

      <div className="flex h-full flex-col gap-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
              {label}
            </p>
            <p className="mt-2 break-words font-['DM_Serif_Display',serif] text-3xl font-normal leading-none text-slate-800">
              {loading ? (
                <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                value
              )}
            </p>
          </div>
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.iconBg} ${a.iconText} ring-4 ${a.ring}`}
          >
            {icon}
          </span>
        </div>

        {/* Sub-metrics */}
        {children ? (
          <div className="mt-auto space-y-2 border-t border-slate-50 pt-4">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricSubtext({ icon, children }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400">
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}

export default function FinancialControlPanel({
  loading,
  allRows = [],
  isOrgAdmin,
  totalInvestment,
  remainingFunds,
  totalAmountMade,
  totalSpent,
  onOpenInvestmentModal,
}) {
  const navigate = useNavigate();
  const contributionCount = useMemo(() => {
    return allRows.filter((row) => {
      const accountType = String(
        row?.accountType || row?.["Account Type"] || "",
      )
        .toLowerCase()
        .trim();
      const category = String(row?.category || row?.Category || "")
        .toLowerCase()
        .trim();

      return accountType === "equity" && category === "capital";
    }).length;
  }, [allRows]);

  return (
    <section aria-label="Financial controls" className="mb-6">
      {/* Inject DM Serif Display from Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div
        className="grid gap-4 lg:grid-cols-12"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Two metric cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:col-span-8">
          <MetricCard
            icon={<BanknotesIcon className="h-5 w-5" />}
            label="Owner Investment"
            value={fmt(totalInvestment)}
            loading={loading}
            accent="cyan"
          >
            <MetricSubtext icon={<BriefcaseIcon className="h-3.5 w-3.5" />}>
              {contributionCount} Contribution
              {contributionCount === 1 ? "" : "s"} recorded
            </MetricSubtext>
            <MetricSubtext icon={<WalletIcon className="h-3.5 w-3.5" />}>
              {fmt(remainingFunds)} available cash remaining
            </MetricSubtext>
          </MetricCard>

          <MetricCard
            icon={<ReceiptPercentIcon className="h-5 w-5" />}
            label="Total Amount Made"
            value={fmt(totalAmountMade)}
            loading={loading}
            accent="emerald"
          >
            <MetricSubtext icon={<BanknotesIcon className="h-3.5 w-3.5" />}>
              {fmt(totalSpent)} operating expenses deducted
            </MetricSubtext>
          </MetricCard>
        </div>

        {/* ── Redesigned Eye-Catching Quick Action Card ── */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-4">
          {/* Decorative Modern Background Glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 opacity-10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-slate-100 opacity-40 blur-xl" />
          </div>

          {/* Top Border Accent Line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />

          {/* Content Layout */}
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            {/* Typography Section */}
            <div>
              <span className="inline-flex items-center rounded-md bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 ring-1 ring-inset ring-cyan-600/10">
                Quick Action
              </span>
              <h3 className="mt-3 font-['DM_Serif_Display',serif] text-xl font-normal leading-tight text-slate-800">
                Investment Management
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                Add your new investment here to effortlessly update capital
                totals and track real-time available funds.
              </p>
            </div>
            <div>
              <div className="flex justify-end w-full mt-4">
                <button
                  type="button"
                  onClick={onOpenInvestmentModal}
                  disabled={!isOrgAdmin}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-cyan-600"
                >
                  <PlusIcon className="h-4 w-4 stroke-[2.5]" />
                  Add Transaction
                </button>
              </div>

              {!isOrgAdmin && (
                <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-rose-500/80">
                  Requires organization admin credentials
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
