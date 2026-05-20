import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

const EMPTY_MILESTONES = [];

export default function HistoricalGoals({
  milestones,
  latestSnapshot,
  formatCurrency,
  deriveGoalStatus,
  getMetricLabel,
  getMetricValue,
}) {
  const milestoneList = milestones ?? EMPTY_MILESTONES;
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(milestoneList.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedMilestones = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return milestoneList.slice(start, start + ITEMS_PER_PAGE);
  }, [milestoneList, page]);

  const startIndex = (page - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(page * ITEMS_PER_PAGE, milestoneList.length);

  if (!milestoneList.length) return null;

  return (
    <section
      aria-labelledby="historical-goals-heading"
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600" aria-hidden="true">
          <TrophyIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 id="historical-goals-heading" className="text-base font-semibold text-slate-900">
            Goal Performance History
          </h2>
          <p className="text-xs text-slate-400">
            Track record of your saved goals against current actuals
          </p>
        </div>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm" aria-label="Goal performance history table">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {["Goal", "Metric", "Target (NPR)", "Actual (NPR)", "Deadline", "Status"].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="pb-3 pr-5 text-xs font-bold uppercase tracking-wider text-slate-400 last:pr-0"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pagedMilestones.map((milestone) => {
              const actualForMetric = getMetricValue(latestSnapshot, milestone.metric);
              const goalStatus = deriveGoalStatus(
                actualForMetric,
                milestone.targetValue,
                milestone.metric
              );
              const normalizedMetric =
                milestone.metric === "expense" ? "expenses" : milestone.metric;
              const rawPct =
                normalizedMetric === "expenses"
                  ? (milestone.targetValue / Math.max(actualForMetric, 1)) * 100
                  : (actualForMetric / (milestone.targetValue || 1)) * 100;
              const pct = Math.min(
                Math.round(rawPct),
                100
              );
              const Icon = goalStatus?.icon;

              return (
                <tr
                  key={milestone._id || milestone.id}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="py-3.5 pr-5 font-semibold text-slate-800">{milestone.title}</td>
                  <td className="py-3.5 pr-5 text-slate-500">{getMetricLabel(milestone.metric)}</td>
                  <td className="py-3.5 pr-5 tabular-nums text-slate-700">
                    {formatCurrency(milestone.targetValue)}
                  </td>
                  <td className="py-3.5 pr-5 tabular-nums">
                    <span className="text-slate-700">{formatCurrency(actualForMetric)}</span>
                    <span className="ml-1.5 text-xs text-slate-400">({pct}%)</span>
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-5 text-slate-500">
                    {milestone.deadline
                      ? new Date(milestone.deadline).toLocaleDateString("en-NP", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3.5">
                    {goalStatus && Icon && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${goalStatus.color}`}
                      >
                        <Icon className="h-3.5 w-3.5 stroke-2" aria-hidden="true" />
                        {goalStatus.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {pagedMilestones.map((milestone) => {
          const actualForMetric = getMetricValue(latestSnapshot, milestone.metric);
          const goalStatus = deriveGoalStatus(
            actualForMetric,
            milestone.targetValue,
            milestone.metric
          );
          const normalizedMetric =
            milestone.metric === "expense" ? "expenses" : milestone.metric;
          const rawPct =
            normalizedMetric === "expenses"
              ? (milestone.targetValue / Math.max(actualForMetric, 1)) * 100
              : (actualForMetric / (milestone.targetValue || 1)) * 100;
          const pct = Math.min(
            Math.round(rawPct),
            100
          );
          const Icon = goalStatus?.icon;

          return (
            <div
              key={milestone._id || milestone.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{milestone.title}</p>
                <p className="mt-0.5 tabular-nums text-xs text-slate-500">
                  {formatCurrency(milestone.targetValue)} {getMetricLabel(milestone.metric)}
                  {milestone.deadline
                    ? ` · ${new Date(milestone.deadline).toLocaleDateString("en-NP", {
                        month: "short",
                        year: "numeric",
                      })}`
                    : ""}
                </p>
                <p className="mt-0.5 tabular-nums text-xs text-slate-400">
                  Actual: {formatCurrency(actualForMetric)} ({pct}%)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {goalStatus && Icon && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${goalStatus.color}`}
                  >
                    <Icon className="h-3.5 w-3.5 stroke-2" aria-hidden="true" />
                    {goalStatus.label}
                  </span>
                )}
                <ChevronRightIcon className="h-4 w-4 text-slate-300" aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </div>

      {milestoneList.length > ITEMS_PER_PAGE && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Showing {startIndex}-{endIndex} of {milestoneList.length} goals
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Prev
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
